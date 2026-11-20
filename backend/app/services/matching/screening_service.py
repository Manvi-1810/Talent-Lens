
import logging
from pathlib import Path

from app.extensions import db
from app.services.matching.matching_service import compare_skills
from app.services.skill_gap.recommendation_service import (
    generate_skill_recommendations
)
from app.services.skill_gap.report_generator import (
    generate_skill_gap_pdf,
    generate_qualification_pdf
)
from app.services.email.email_service import (
    send_skill_gap_report_email,
    send_qualification_email
)

logger = logging.getLogger(__name__)

SCREENING_THRESHOLD = 85.0


def screen_application(application, user, job, resume):
    """
    Automatically screens an application using the candidate's
    latest uploaded resume.

    The screening result is stored internally. Reports and emails
    are generated without exposing screening details to the candidate
    through the application submission response.
    """

    # Compare candidate skills with job requirements
    result = compare_skills(
        resume.extracted_skills or [],
        job.required_skills or []
    )

    match_score = float(result.get("match_score", 0))
    matched_skills = result.get("matched_skills", [])
    missing_skills = result.get("missing_skills", [])

    # Save screening information internally
    application.resume_path = resume.file_path
    application.match_score = match_score
    application.matched_skills = matched_skills
    application.missing_skills = missing_skills

    is_qualified = match_score >= SCREENING_THRESHOLD

    if is_qualified:
        application.status = "qualified"
    else:
        application.status = "not_selected"

    # Commit screening result before report/email generation
    db.session.commit()

    # Do not send the same outcome email more than once
    if application.skill_gap_email_sent:
        return application.status

    try:
        if is_qualified:
            pdf_buffer = generate_qualification_pdf(
                candidate_name=user.name,
                candidate_email=user.email,
                job_title=job.title,
                company_name=job.company_name,
                match_score=match_score,
                threshold=SCREENING_THRESHOLD
            )

            pdf_filename = (
                f"qualification_application_{application.id}.pdf"
            )

            email_function = send_qualification_email

        else:
            recommendations = generate_skill_recommendations(
                missing_skills
            )

            pdf_buffer = generate_skill_gap_pdf(
                candidate_name=user.name,
                candidate_email=user.email,
                job_title=job.title,
                company_name=job.company_name,
                match_score=match_score,
                matched_skills=matched_skills,
                missing_skills=missing_skills,
                recommendations=recommendations
            )

            pdf_filename = (
                f"skill_gap_application_{application.id}.pdf"
            )

            email_function = send_skill_gap_report_email

        # Save the generated PDF
        backend_root = Path(__file__).resolve().parents[3]
        report_folder = backend_root / "uploads" / "skill_gap_reports"
        report_folder.mkdir(parents=True, exist_ok=True)

        report_path = report_folder / pdf_filename

        pdf_bytes = pdf_buffer.getvalue()
        report_path.write_bytes(pdf_bytes)

        application.skill_gap_report_path = str(report_path)
        db.session.commit()

        # Send the appropriate email with PDF attachment
        if is_qualified:
            email_function(
                recipient_email=user.email,
                candidate_name=user.name,
                job_title=job.title,
                pdf_bytes=pdf_bytes,
                pdf_filename=pdf_filename
            )
        else:
            email_function(
                recipient_email=user.email,
                candidate_name=user.name,
                job_title=job.title,
                match_score=match_score,
                pdf_bytes=pdf_bytes,
                pdf_filename=pdf_filename
            )

        application.skill_gap_email_sent = True
        db.session.commit()

    except Exception:
        db.session.rollback()
        logger.exception(
            "Report generation or email failed for application %s",
            application.id
        )

    return application.status
