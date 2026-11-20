
import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  MapPin,
  CalendarDays,
  Building2,
  FileText,
  RefreshCw,
  ClipboardList,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function MyApplicationsPage() {
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchApplications() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/applications/my");
      setApplications(response.data.applications || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load your applications. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchApplications();
  }, []);

  function formatDate(dateValue) {
    if (!dateValue) return "Date unavailable";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function getSelectionStatus(status) {
    switch (status) {
      case "qualified":
        return {
          label: "Selected",
          className: "application-status-qualified",
          Icon: CheckCircle2,
        };

      case "not_selected":
        return {
          label: "Not Selected",
          className: "application-status-not-selected",
          Icon: XCircle,
        };

      case "submitted":
      default:
        return {
          label: "Under Review",
          className: "application-status-pending",
          Icon: Clock,
        };
    }
  }

  return (
    <div className="my-applications-page shared-applications-page">
      <main className="applications-content">
        <section className="applications-hero">
          <span className="jobs-eyebrow">
            <ClipboardList size={16} />
            APPLICATION TRACKER
          </span>

          <h1>My Applications</h1>

          <p>
            Keep track of the jobs you have applied for
            and review your application details.
          </p>
        </section>

        {/* Application summary */}
        <section className="applications-summary">
          <div className="application-summary-card">
            <span className="application-summary-icon">
              <BriefcaseBusiness size={22} />
            </span>

            <div>
              <span>Total Applications</span>
              <strong>
                {loading ? "—" : applications.length}
              </strong>
            </div>
          </div>
        </section>

        {/* Applied jobs */}
        <section className="applications-list-section">
          <div className="applications-section-heading">
            <div>
              <span className="jobs-section-kicker">
                YOUR ACTIVITY
              </span>

              <h2>Applied Jobs</h2>

              <p>
                {loading
                  ? "Loading your applications..."
                  : `${applications.length} application${
                      applications.length === 1 ? "" : "s"
                    } found`}
              </p>
            </div>

            <button
              className="jobs-clear-button"
              onClick={fetchApplications}
              disabled={loading}
            >
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>

          {loading && (
            <div className="applications-state-card">
              <RefreshCw
                size={28}
                className="jobs-loading-icon"
              />
              <h3>Loading applications</h3>
              <p>Fetching your application records...</p>
            </div>
          )}

          {!loading && error && (
            <div className="applications-state-card applications-error">
              <AlertCircle size={32} />
              <h3>Unable to load applications</h3>
              <p>{error}</p>

              <button
                className="jobs-search-button"
                onClick={fetchApplications}
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && applications.length === 0 && (
            <div className="applications-state-card">
              <FileText size={38} />
              <h3>No applications yet</h3>

              <p>
                You haven't applied for any jobs yet. Explore
                available opportunities and apply for a job
                that matches your interests.
              </p>

              <button
                className="jobs-search-button"
                onClick={() => navigate("/candidate/jobs")}
              >
                <BriefcaseBusiness size={17} />
                Find Jobs
              </button>
            </div>
          )}

          {!loading && !error && applications.length > 0 && (
            <div className="applications-list">
              {applications.map((application) => {
                const job = application.job;
                const selection = getSelectionStatus(
                  application.status
                );
                const SelectionIcon = selection.Icon;

                return (
                  <article
                    className="application-card"
                    key={application.id}
                  >
                    {/* Job heading */}
                    <div className="application-card-header">
                      <div className="application-company-icon">
                        <Building2 size={24} />
                      </div>

                      <span className="application-status submitted">
                        Application Submitted
                      </span>
                    </div>

                    <h3>
                      {job?.title || "Job details unavailable"}
                    </h3>

                    <p className="application-company-name">
                      {job?.company_name || "Company unavailable"}
                    </p>

                    <div className="application-meta">
                      <span>
                        <MapPin size={16} />
                        {job?.location || "Location not specified"}
                      </span>

                      <span>
                        <BriefcaseBusiness size={16} />
                        {job?.employment_type || "Not specified"}
                      </span>
                    </div>

                    <div className="application-divider" />

                    {/* Application details */}
                    <div className="application-details-grid">
                      <div>
                        <span>
                          <CalendarDays size={16} />
                          Applied on
                        </span>

                        <strong>
                          {formatDate(application.applied_at)}
                        </strong>
                      </div>
                    </div>

                    {/* Selection decision */}
                    <div className="application-divider" />

                    <div className="application-selection">
                      <strong>Selection Decision</strong>

                      <span
                        className={`application-status ${selection.className}`}
                      >
                        <SelectionIcon size={15} />
                        {selection.label}
                      </span>
                    </div>

                    {/* Required skills */}
                    {Array.isArray(job?.required_skills) &&
                      job.required_skills.length > 0 && (
                        <div className="application-required-skills">
                          <strong>Required Skills</strong>

                          <div className="job-skills">
                            {job.required_skills.map(
                              (skill, index) => (
                                <span key={`${skill}-${index}`}>
                                  {skill}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer className="jobs-page-footer">
          <span>TalentLens · IS026 Mini Project</span>
          <span>AI-powered recruitment with transparency.</span>
        </footer>
      </main>
    </div>
  );
}
