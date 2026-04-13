import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePredictions } from "@/hooks/usePredictions";
import { useToast } from "@/context/ToastContext";
import { isMatchLocked } from "@/services/firebase/firebaseUtils";

export default function MatchCard({ match }) {
  const { user } = useAuth();
  const { predictions, savePrediction } = usePredictions();
  const { showToast } = useToast();

  const [home, setHome] = useState("");
  const [away, setAway] = useState("");

  const existing = predictions.find(
    (p) => p.matchId === match.id
  );

  const locked = isMatchLocked(match);

  useEffect(() => {
    if (existing) {
      setHome(existing.predHome);
      setAway(existing.predAway);
    }
  }, [existing]);

  const handleSave = async () => {
    try {
      const isUpdate = !!existing;

      await savePrediction(match.id, Number(home), Number(away));

      showToast({
        type: "success",
        message: isUpdate
          ? "Predicción actualizada"
          : "Predicción guardada",
      });

    } catch (err) {
      showToast({
        type: "error",
        message: "Error guardando predicción",
      });
    }
  };

  return (
    <div style={{ border: "1px solid #ccc", marginBottom: 10, padding: 10 }}>
      <div>
        {match.homeTeam} vs {match.awayTeam}
      </div>

      {user ? (
        <>
          <input
            type="number"
            value={home}
            disabled={locked}
            onChange={(e) => setHome(e.target.value)}
            style={{ width: 50 }}
          />

          <input
            type="number"
            value={away}
            disabled={locked}
            onChange={(e) => setAway(e.target.value)}
            style={{ width: 50 }}
          />

          <button onClick={handleSave} disabled={locked}>
            Guardar
          </button>

          {locked && <div>🔒 Partido bloqueado</div>}
        </>
      ) : (
        <div>Logueate para participar</div>
      )}
    </div>
  );
}