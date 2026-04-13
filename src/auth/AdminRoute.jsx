import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";

export default function AdminRoute() {
  const { user } = useAuth();
  const { isAdmin, loading } = useAdmin();

  // Esperar a saber si es admin
  if (loading) return null;

  // No logueado
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // No verificado
  if (!user.emailVerified) {
    return <Navigate to="/auth" replace state={{ mode: "verify" }} />;
  }

  // No admin → fuera
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}