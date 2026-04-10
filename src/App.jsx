import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ToastProvider } from "./context/ToastContext";
import AuthScreen from "@/pages/AuthScreen.jsx";
import Spinner from "@/components/Spinner.jsx";
import AdminMatches from "@/pages/AdminMatches";
import Home from "@/pages/Home.jsx";
import Header from "@/components/Header.jsx";
import MatchesScreen from "@/pages/MatchesScreen";
import TablaPosiciones from "./pages/TablaPosiciones";






function App() {
  const { loading } = useAuth();

   // Esperamos a Firebase
  if (loading) {
    return <Spinner label="Chequeando sesión" />;
  }

  return (
    <ToastProvider>
    <>
      <Header />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminMatches />} />
        <Route path="/matches" element={<MatchesScreen />} />
        <Route path="/standings" element={<TablaPosiciones />} />
        <Route path="/auth" element={<AuthScreen/>}/>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
    </ToastProvider>
  );
}

export default App;
