
import { Navigate, Route, Routes } from "react-router-dom";

import LandingPage from "./pages/public/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

// Candidate pages
import CandidateDashboard from "./pages/candidate/CandidateDashboard";
import FindJobsPage from "./pages/candidate/FindJobsPage";
import MyApplicationsPage from "./pages/candidate/MyApplicationsPage";
import MyResumePage from "./pages/candidate/MyResumePage";
import MyProfilePage from "./pages/candidate/MyProfilePage";
import CandidateSettingsPage from "./pages/candidate/CandidateSettingsPage";

// Recruiter pages
import ManageJobsPage from "./pages/recruiter/ManageJobsPage";
import ApplicantsPage from "./pages/recruiter/ApplicantsPage";
import AIInterviewResultsPage from "./pages/recruiter/AIInterviewResultsPage";
import RecruiterProfilePage from "./pages/recruiter/RecruiterProfilePage";
import RecruiterSettingsPage from "./pages/recruiter/RecruiterSettingsPage";
import RecruiterDashboardPage from "./pages/recruiter/RecruiterDashboardPage";

// Layouts
import CandidateLayout from "./components/candidate/CandidateLayout";
import RecruiterLayout from "./components/recruiter/RecruiterLayout";

// Candidate route protection
function CandidateRoute({ children }) {
  const token = localStorage.getItem("access_token");

  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "candidate") {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Recruiter route protection
function RecruiterRoute({ children }) {
  const token = localStorage.getItem("access_token");

  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "recruiter") {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Candidate workspace */}
      <Route
        path="/candidate"
        element={
          <CandidateRoute>
            <CandidateLayout />
          </CandidateRoute>
        }
      >
        <Route path="dashboard" element={<CandidateDashboard />} />
        <Route path="jobs" element={<FindJobsPage />} />
        <Route path="resume" element={<MyResumePage />} />
        <Route path="applications" element={<MyApplicationsPage />} />
        <Route path="profile" element={<MyProfilePage />} />
        <Route path="settings" element={<CandidateSettingsPage />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Recruiter workspace */}
      <Route
        path="/recruiter"
        element={
          <RecruiterRoute>
            <RecruiterLayout />
          </RecruiterRoute>
        }
      >
        <Route path="dashboard" element={<RecruiterDashboardPage />} />
        <Route path="jobs" element={<ManageJobsPage />} />
        <Route path="applicants" element={<ApplicantsPage />} />
        <Route path="interviews" element={<AIInterviewResultsPage />} />
        <Route path="profile" element={<RecruiterProfilePage />} />
        <Route path="settings" element={<RecruiterSettingsPage />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
