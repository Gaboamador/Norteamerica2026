import { useMemo, useState } from "react";
import { useMatchesCached } from "@/hooks/useMatchesCached";
import { usePredictions } from "@/hooks/usePredictions";
import { countMissingPredictions } from "@/utils/predictionStatus";
import MatchCard from "@/components/MatchCard";
import MatchesGrouped from "@/components/MatchesGrouped";
import styles from "./MatchesScreen.module.scss";
import { PiWarningCircle } from "react-icons/pi";

export default function MatchesScreen() {
  const { matches, loading } = useMatchesCached();
  const [mode, setMode] = useState("date"); // "date" | "group"

  const { predictions, savePrediction } = usePredictions();

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
        renderMatch={(m) => (
          <MatchCard
            key={m.id}
            match={m}
            prediction={predictionsByMatchId.get(m.id) || null}
            savePrediction={savePrediction}
          />
        )}
      />
    </section>
  );
}