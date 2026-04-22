import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function ProtectedRoute() {
  const { user } = useAuth();
  const location = useLocation();

  // No autenticado → login
  if (!user) {
    sessionStorage.setItem(
      "na2026_post_auth_redirect",
      location.pathname + location.search
    );

    return <Navigate to="/auth" replace />;
  }

  // Autenticado pero NO verificado
  if (!user.emailVerified) {
    return (
      <Navigate
        to="/auth"
        replace
        state={{ mode: "verify" }}
      />
    );
  }

  // OK
  return <Outlet />;
}