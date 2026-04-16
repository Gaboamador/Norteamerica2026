import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ToastProvider } from "./context/ToastContext";
import ProtectedRoute from "@/auth/ProtectedRoute";
import AdminRoute from "@/auth/AdminRoute";
import AppLayout from "./layouts/AppLayout";
import AuthScreen from "@/pages/AuthScreen.jsx";
import Spinner from "@/components/Spinner.jsx";
import Home from "@/pages/Home.jsx";
import Header from "@/components/Header.jsx";
import MatchesScreen from "@/pages/MatchesScreen";
import TablaPosiciones from "./pages/TablaPosiciones";
import JoinGroup from "@/pages/JoinGroup";
import AdminMatches from "@/pages/AdminMatches";
import AdminGroups from "@/pages/AdminGroups";
import AdminGroupDetail from "@/pages/AdminGroupDetail";

function App() {
  const { loading } = useAuth();

  return (
    <ToastProvider>
    <>
      <Header />

      <Routes >
        <Route element={<AppLayout />}>
        {loading ? (
          <Route path="*" element={<Spinner label="Chequeando sesión" />} />
        ):(
            <>
              {/* Ruta pública */}
              <Route path="/auth" element={<AuthScreen />} />

              {/* Rutas protegidas */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Home />} />
                <Route path="/matches" element={<MatchesScreen />} />
                <Route path="/standings" element={<TablaPosiciones />} />
                <Route path="/join" element={<JoinGroup />} />
                <Route path="*" element={<Navigate to="/" replace />} />

                <Route element={<AdminRoute />}>
                  <Route path="/admin/matches" element={<AdminMatches />} />
                  <Route path="/admin/groups" element={<AdminGroups />} />
                  <Route path="/admin/groups/:groupId" element={<AdminGroupDetail />} />
                </Route>
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Route>
      </Routes>
    </>
    </ToastProvider>
  );
}

export default App;
