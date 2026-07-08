import { Navigate } from "react-router-dom";
import LandingPage from "@/pages/landing";
import { hasAuthToken } from "@/utils/session";

export function RootPage() {
  if (hasAuthToken()) {
    return <Navigate to="/overview" replace />;
  }
  return <LandingPage />;
}