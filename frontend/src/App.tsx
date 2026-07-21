import { Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "./contexts/AuthContext";
import { CandidateDashboard } from "./pages/CandidateDashboard";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { RecruiterDashboard } from "./pages/RecruiterDashboard";
import { RegisterPage } from "./pages/RegisterPage";

export default function App() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={
          isAuthenticated && user ? (
            <Navigate to={user.role === "candidate" ? "/candidate" : "/recruiter"} replace />
          ) : (
            <LoginPage />
          )
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated && user ? (
            <Navigate to={user.role === "candidate" ? "/candidate" : "/recruiter"} replace />
          ) : (
            <RegisterPage />
          )
        }
      />
      <Route
        path="/candidate"
        element={
          <ProtectedRoute role="candidate">
            <CandidateDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recruiter"
        element={
          <ProtectedRoute role="recruiter">
            <RecruiterDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
