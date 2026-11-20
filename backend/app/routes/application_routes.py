
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models import User, Job, Application
from app.models.resume import Resume
from app.models.notification import Notification

from app.services.matching.screening_service import screen_application

applications_bp = Blueprint("applications", __name__)


@applications_bp.get("/my")
@jwt_required()
def get_my_applications():
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)

    if not user:
        return jsonify({
            "status": "error",
            "message": "User not found"
        }), 404

    applications = (
        Application.query
        .filter_by(candidate_id=user.id)
        .order_by(Application.applied_at.desc())
        .all()
    )

    results = []

    for application in applications:
        job = db.session.get(Job, application.job_id)

        if not job:
            continue

        results.append({
            "id": application.id,
            "status": application.status,
            "applied_at": (
                application.applied_at.isoformat()
                if application.applied_at else None
            ),
            "job": {
                "id": job.id,
                "title": job.title,
                "company_name": job.company_name,
                "location": job.location,
                "employment_type": job.employment_type,
                "required_skills": job.required_skills or []
            }
        })

    return jsonify({
        "status": "success",
        "count": len(results),
        "applications": results
    }), 200


@applications_bp.post("/")
@jwt_required()
def apply_for_job():
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)

    if not user:
        return jsonify({
            "status": "error",
            "message": "User not found"
        }), 404

    data = request.get_json() or {}
    job_id = data.get("job_id")

    if not job_id:
        return jsonify({
            "status": "error",
            "message": "Job ID is required"
        }), 400

    job = db.session.get(Job, job_id)

    if not job or job.status != "active":
        return jsonify({
            "status": "error",
            "message": "Job not found or inactive"
        }), 404

    existing_application = Application.query.filter_by(
        candidate_id=user.id,
        job_id=job.id
    ).first()

    if existing_application:
        return jsonify({
            "status": "error",
            "message": "You have already applied for this job"
        }), 409

    # Get the candidate's latest uploaded resume
    latest_resume = (
        Resume.query
        .filter_by(candidate_id=user.id)
        .order_by(Resume.uploaded_at.desc())
        .first()
    )

    if not latest_resume:
        return jsonify({
            "status": "error",
            "message": "Please upload your resume before applying for this job."
        }), 400

    # Create application
    application = Application(
        candidate_id=user.id,
        job_id=job.id,
        resume_path=latest_resume.file_path,
        status="submitted"
    )

    db.session.add(application)

    notification = Notification(
        user_id=user.id,
        title="Application submitted",
        message=(
            f"Your application for {job.title} at "
            f"{job.company_name} has been submitted successfully."
        ),
        notification_type="application",
        is_read=False,
        link="/candidate/applications"
    )

    db.session.add(notification)

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": "Unable to submit your application. Please try again."
        }), 500

    # Automatically screen the application.
    # Screening/report/email failures should not undo the saved application.
    try:
        screen_application(
            application=application,
            user=user,
            job=job,
            resume=latest_resume
        )
    except Exception:
        db.session.rollback()

    return jsonify({
        "status": "success",
        "message": (
            "Application submitted successfully! "
            "You can track your application in My Applications."
        )
    }), 201
