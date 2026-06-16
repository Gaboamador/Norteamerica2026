import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ToastProvider } from "@/context/ToastContext";
import { ConfirmProvider } from "@/context/ConfirmProvider";
import { StandingsDirtyProvider } from "@/context/StandingsDirtyContext";
import ProtectedRoute from "@/auth/ProtectedRoute";
import AdminRoute from "@/auth/AdminRoute";
import AppLayout from "./layouts/AppLayout";
import AuthScreen from "@/pages/AuthScreen.jsx";
import Spinner from "@/components/Spinner.jsx";
import Home from "@/pages/Home.jsx";
import Header from "@/components/Header.jsx";
import ScrollArrow from "@/components/ScrollArrow";
import MatchesScreen from "@/pages/MatchesScreen";
import TablaPosiciones from "./pages/TablaPosiciones";
import JoinGroup from "@/pages/JoinGroup";
import UserProfile from "@/pages/UserProfile";
import AdminMatches from "@/pages/AdminMatches";
import AdminGroups from "@/pages/AdminGroups";
import AdminGroupDetail from "@/pages/AdminGroupDetail";
import GameRules from "@/pages/GameRules";
import WorldCup from "@/pages/WorldCup";
import ProdeTimeline from "@/pages/ProdeTimeline";
import LocalProdeSimulatorScreen from "@/pages/LocalProdeSimulatorScreen";
import DirtyTabIndicator from "@/components/DirtyTabIndicator";

function App() {
  
  const { loading } = useAuth();

  return (
    <StandingsDirtyProvider>
    <ConfirmProvider>
    <ToastProvider>
    <>
      <DirtyTabIndicator />
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
                <Route path="/pronosticos" element={<MatchesScreen />} />
                <Route path="/pronosticos/simulador" element={<LocalProdeSimulatorScreen />} />
                <Route path="/posiciones" element={<TablaPosiciones />} />
                <Route path="/linea-de-tiempo" element={<ProdeTimeline />} />
                <Route path="/reglamento" element={<GameRules />} />
                <Route path="/mundial-calculadora" element={<WorldCup />} />
                <Route path="/join" element={<JoinGroup />} />
                <Route path="/usuario" element={<UserProfile />} />
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
      <ScrollArrow/>
    </>
    </ToastProvider>
    </ConfirmProvider>
    </StandingsDirtyProvider>
  );
}

export default App;
