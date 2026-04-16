import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePredictions } from "@/hooks/usePredictions";
import { useToast } from "@/context/ToastContext";
import { isMatchLocked } from "@/services/firebase/firebaseUtils";
import { getTeamFlagSrc, handleFlagImageError } from "@/utils/flagUtils";
import styles from "./MatchCard.module.scss";
import { getTimeToLock, formatCountdown } from "@/utils/timeUtils";
import { getPredictionPoints } from "@/utils/predictionPoints";

export default function MatchCard({ match }) {
  const { user } = useAuth();
  const { predictions, savePrediction } = usePredictions();
  const { showToast } = useToast();
  const result = match.result;

  let winner = null;

  if (result) {
    if (result.homeGoals > result.awayGoals) winner = "home";
      else if (result.homeGoals < result.awayGoals) winner = "away";
      else winner = "draw";
    }

  const [home, setHome] = useState("");
  const [away, setAway] = useState("");

  const existing = predictions.find(
    (p) => p.matchId === match.id
  );
  const draftKey = user ? `pred_draft_${user.uid}_${match.id}` : null;
  const hasHydratedRef = useRef(false);
  const didUserEditRef = useRef(false);
  const isDirty =
  String(home) !== String(existing?.predHome ?? "") ||
  String(away) !== String(existing?.predAway ?? "");

  const points = getPredictionPoints(existing, match);
  const showPoints = match.status === "finished" && points !== null;
  
  const locked = isMatchLocked(match);
  const [timeLeft, setTimeLeft] = useState(() => getTimeToLock(match));
  const countdown = formatCountdown(timeLeft);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeToLock(match));
    }, 1000);

    return () => clearInterval(interval);
  }, [match]);

  // useEffect(() => {
  //   if (existing) {
  //     setHome(existing.predHome);
  //     setAway(existing.predAway);
  //   }
  // }, [existing]);
  useEffect(() => {
    if (!user || !draftKey) return;

    const draftRaw = sessionStorage.getItem(draftKey);

    if (draftRaw) {
      try {
        const draft = JSON.parse(draftRaw);
        setHome(String(draft.home ?? ""));
        setAway(String(draft.away ?? ""));
        hasHydratedRef.current = true;
        return;
      } catch {
        sessionStorage.removeItem(draftKey);
      }
    }

    if (existing) {
      setHome(String(existing.predHome ?? ""));
      setAway(String(existing.predAway ?? ""));
    } else {
      setHome("");
      setAway("");
    }

    hasHydratedRef.current = true;
  }, [user, draftKey, existing]);

  useEffect(() => {
    if (!user || !draftKey) return;
    if (!hasHydratedRef.current) return;
    if (!didUserEditRef.current) return;

    const hasValues = home !== "" || away !== "";

    if (hasValues) {
      sessionStorage.setItem(
        draftKey,
        JSON.stringify({ home, away })
      );
    } else {
      sessionStorage.removeItem(draftKey);
    }
  }, [home, away, user, draftKey]);

  const handleSave = async () => {
    try {
      const isUpdate = !!existing;

      await savePrediction(match.id, Number(home), Number(away));

      if (draftKey) {
        sessionStorage.removeItem(draftKey);
      }
      didUserEditRef.current = false;

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
    <div className={`${styles.card}`}>
      
      {/* MATCH INFO */}
      <div className={styles.matchGrid}>
  
        {/* HOME */}
        <div className={styles.teamLeft}>
          <div className={styles.teamChip}>
            <img
              src={getTeamFlagSrc(match.homeTeam)}
              alt={match.homeTeam}
              className={styles.flag}
              onError={handleFlagImageError}
            />
            <span className={styles.teamName}>{match.homeTeam}</span>
          </div>
        </div>

        {/* CENTRO */}
        <div className={styles.center}>
          {result ? (
            <div className={styles.score}>
              {result.homeGoals} - {result.awayGoals}
            </div>
          ) : (
            <span className={styles.vs}>vs</span>
          )}
        </div>

        {/* AWAY */}
        <div className={styles.teamRight}>
          <div className={styles.teamChip}>
            <span className={styles.teamName}>{match.awayTeam}</span>
            <img
              src={getTeamFlagSrc(match.awayTeam)}
              alt={match.awayTeam}
              className={styles.flag}
              onError={handleFlagImageError}
            />
          </div>
        </div>

      </div>

      {/* LOCK WARNING */}
      {!locked &&
      <div className={styles.lockInfo}>
          <span className={styles.countdown}>
            Cierra en {countdown}
          </span>
      </div>
      }

      {/* ACTIONS */}
      {user ? (
        <div className={styles.actions}>
          <div className={styles.inputsTitle}>
            <div className={styles.title}>
                PREDICCIÓN
            </div>
            <div className={styles.inputs}>

              {/* PREDICCIÓN GOLES HOME */}
              <input
                type="number"
                min={0}
                max={20}
                inputMode="numeric"
                pattern="[0-9]*"
                value={home}
                disabled={locked}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || Number(value) >= 0) {
                    didUserEditRef.current = true;
                    setHome(value);
                  }
                }}
                className={`${styles.input} ${isDirty ? styles.inputDirty : ""}`}
              />

              {/* CENTRO / DIVISOR */}
              <div className={styles.centerPronostico}>
                  <span className={styles.vs}>-</span>
              </div>

              {/* PREDICCIÓN GOLES AWAY */}
              <input
                type="number"
                min={0}
                max={20}
                inputMode="numeric"
                pattern="[0-9]*"
                value={away}
                disabled={locked}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || Number(value) >= 0) {
                    didUserEditRef.current = true;
                    setAway(value);
                  }
                }}
                className={`${styles.input} ${isDirty ? styles.inputDirty : ""}`}
              />
            </div>

            <div className={styles.pointsWrapper}>
              {showPoints && (
                <div className={`${styles.points} ${styles[`points${points}`]}`}>
                  {`+${points}`}
                </div>
              )}
            </div>
          </div>

          {isDirty && (
            <div className={styles.unsaved}>
              Cambios sin guardar
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={locked || !isDirty}
            className={`${styles.button} ${isDirty ? styles.buttonDirty : ""}`}
          >
            {isDirty ? "Guardar cambios" : "Guardado"}
          </button>
          
          {locked && (
            <div className={styles.lockedMessage}>
              🔒 Partido bloqueado
            </div>
          )}

        </div>
      ) : (
        <div className={styles.loginMessage}>
          Logueate para participar
        </div>
      )}
    </div>
  );
}