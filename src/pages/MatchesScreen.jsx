import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMatchesCached } from "@/hooks/useMatchesCached";
import { usePredictions } from "@/hooks/usePredictions";
import { useLockedPredictionsSummaries } from "@/hooks/useLockedPredictionsSummaries";
import { countMissingPredictions } from "@/utils/predictionStatus";
import MatchCard from "@/components/MatchCard";
import MatchesGrouped from "@/components/MatchesGrouped";
import styles from "./MatchesScreen.module.scss";
import { PiWarningCircle } from "react-icons/pi";

export default function MatchesScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { matches, loading } = useMatchesCached();
  const [mode, setMode] = useState("date"); // "date" | "group"
  const [returnMatchId, setReturnMatchId] = useState(null);

  const { predictions, savePrediction } = usePredictions();
  const lockedPredictionsController = useLockedPredictionsSummaries();
  
  const handleOpenSimulator = async (match) => {
    const loadedGroups = lockedPredictionsController.groups.length
      ? lockedPredictionsController.groups
      : await lockedPredictionsController.loadGroups();

    const firstGroupId = loadedGroups?.[0]?.id || "";

    const params = new URLSearchParams();

    if (firstGroupId) {
      params.set("groupId", firstGroupId);
    }

    params.set("matchId", match.id);

    navigate(`/pronosticos/simulador?${params.toString()}`, {
      state: {
        returnMatchId: match.id,
      },
    });
  };

  useEffect(() => {
  const matchId = location.state?.scrollToMatchId;

  if (!matchId) return;

  setReturnMatchId(matchId);
}, [location.state]);

useEffect(() => {
  if (!returnMatchId) return;

  const timeoutId = window.setTimeout(() => {
    const element = document.querySelector(`[data-match-id="${returnMatchId}"]`);

    element?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    setReturnMatchId(null);

    navigate(location.pathname, {
      replace: true,
      state: null,
    });
  }, 320);

  return () => {
    window.clearTimeout(timeoutId);
  };
}, [returnMatchId, location.pathname, navigate]);

  const missingPredictionsCount = useMemo(() => {
    return countMissingPredictions(matches, predictions);
  }, [matches, predictions]);

  const predictionsByMatchId = useMemo(() => {
    return new Map(
      predictions.map((prediction) => [prediction.matchId, prediction])
    );
  }, [predictions]);

  if (loading) {
    return (
      <div className={styles.loading}>
        Cargando partidos...
      </div>
    );
  }

  return (
    <section className={styles.wrapper}>
      <div className={styles.title}>Cargar Pronósticos</div>

      {/* SELECTOR */}
        <div className={styles.selectorWrapper}>
          <div className={styles.selectorLabel}>
            VER:
          </div>
          <div className={styles.selector}>
            <button
              onClick={() => setMode("date")}
              className={`button button--primary button--small ${
                mode === "date" ? styles.active : ""
              }`}
            >
              Por fecha
            </button>

            <button
              onClick={() => setMode("group")}
              className={`button button--primary button--small ${
                mode === "group" ? styles.active : ""
              }`}
            >
              Por grupo
            </button>
            <button
              onClick={() => setMode("round")}
              className={`button button--primary button--small ${
                mode === "round" ? styles.active : ""
              }`}
            >
              Por fase
            </button>
          </div>
        </div>

      {missingPredictionsCount > 0 && (
        <div className={styles.pendingLegend}>
          <PiWarningCircle size={16} />
          <span>
            Te faltan cargar {missingPredictionsCount}{" "}
            {missingPredictionsCount === 1 ? "pronóstico" : "pronósticos"}.
            Los partidos marcados con este ícono todavía están pendientes de carga.
          </span>
        </div>
      )}

      {/* LIST */}
      <MatchesGrouped
        matches={matches}
        mode={mode}
        autoFocusPending={false}
        focusMatchId={returnMatchId}
        renderMatch={(m) => (
          <div key={m.id} data-match-id={m.id}>
            <MatchCard
              match={m}
              matches={matches}
              prediction={predictionsByMatchId.get(m.id) || null}
              savePrediction={savePrediction}
              lockedPredictionsController={lockedPredictionsController}
              onOpenSimulator={handleOpenSimulator}
            />
          </div>
        )}
      />
    </section>
  );
}