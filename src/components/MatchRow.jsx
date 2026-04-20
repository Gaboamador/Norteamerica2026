import { useState, useEffect } from "react";
import { updateMatch, resetMatch } from "@/services/firebase/firebaseUtils";
import { useToast } from "@/context/ToastContext";
import { useConfirm } from "@/context/ConfirmProvider";
import { Timestamp } from "firebase/firestore";
import { getTeamFlagSrc, handleFlagImageError } from "@/utils/flagUtils";
import styles from "./MatchRow.module.scss";
import { LuPencil } from "react-icons/lu";
import useIsMobile from "@/hooks/useIsMobile";
import { BREAKPOINTS } from "@/constants/breakpoints";
import { getRoundLabel } from "@/utils/matchRounds";
import { formatMatchDate } from "@/utils/dateFormat";

export default function MatchRow({ match, onSetResult }) {
  const [editing, setEditing] = useState(false);
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [homeTeam, setHomeTeam] = useState(match.homeTeam);
  const [awayTeam, setAwayTeam] = useState(match.awayTeam);
  const [group, setGroup] = useState(match.group || "");
  const [round, setRound] = useState(match.round || 1);
  const safeNumber = (v) => Number(v || 0);
  const isMobile = useIsMobile(BREAKPOINTS.mobile);

  const formatLocalDateTime = (date) => {
      const pad = (n) => String(n).padStart(2, "0");
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };
  
  const [startTime, setStartTime] = useState(
      match.startTime
      ? formatLocalDateTime(match.startTime.toDate())
      : ""
  );

  const [homeGoals, setHomeGoals] = useState("");
  const [awayGoals, setAwayGoals] = useState("");

  useEffect(() => {
    if (match.result) {
      setHomeGoals(match.result.homeGoals);
      setAwayGoals(match.result.awayGoals);
    }
  }, [match.result]);

  const handleSave = async () => {
    try {
        const start = new Date(startTime);
        const lock = new Date(start.getTime() - 5 * 60 * 1000);

        await updateMatch(match.id, {
        homeTeam,
        awayTeam,
        group,
        round: Number(round),
        startTime: Timestamp.fromDate(start),
        lockTime: Timestamp.fromDate(lock),
        });

        setEditing(false);

        showToast({
        type: "success",
        message: "Partido actualizado",
        });

    } catch (err) {
        showToast({
        type: "error",
        message: "Error actualizando partido",
        });
    }
  };

  const handleResetMatch = async () => {
    const confirmed = await confirm({
      title: "Resetear partido",
      message:
        "¿Seguro que querés resetear este partido? Se borran los puntos.",
    });

    if (!confirmed) return;

    try {
      await resetMatch(match.id);
      setHomeGoals("");
      setAwayGoals("");
    } catch (err) {
      console.error("Error reseteando partido", err);
    }
  };

  return (
    <div className={styles.card}>

      {/* EDITAR METADATA DEL PARTIDO */}
      <button
        className={styles.editFloating}
        onClick={() => setEditing(true)}
      >
        <span><LuPencil size={12}/></span>
      </button>
      
      {/* MATCH */}
        <div className={styles.matchGrid}>
          
          {/* HOME */}
          <div className={styles.teamLeft}>
            <div className={styles.team}>
              <span className={`${styles.teamName} ${styles.left}`}>{match.homeTeam}</span>
              <img
                src={getTeamFlagSrc(match.homeTeam)}
                alt={match.homeTeam}
                className={styles.flag}
                onError={handleFlagImageError}
              />
            </div>
          </div>

          {/* CENTRO */}
          <div className={styles.center}>
            {match.result ? (
              <div className={styles.score}>
                {match.result.homeGoals} - {match.result.awayGoals}
              </div>
            ) : (
              <span className={styles.vs}>vs</span>
            )}
          </div>

          {/* AWAY */}
          <div className={styles.teamRight}>
            <div className={styles.team}>
              <img
                src={getTeamFlagSrc(match.awayTeam)}
                alt={match.awayTeam}
                className={styles.flag}
                onError={handleFlagImageError}
              />
              <span className={`${styles.teamName} ${styles.right}`}>{match.awayTeam}</span>
            </div>
          </div>

        </div>

      {/* METADATA PARTIDO */}
      <div className={styles.metaBlock}>
        
        {/* ROW 1 */}
        <div className={styles.metaRowTop}>
          
          <div className={styles.metaGroup}>
            {match.group && (
              <span>Grupo {match.group}</span>
            )}
            <span>{getRoundLabel(match.round)}</span>
          </div>

          <div className={styles.metaDate}>
            {match.startTime
              ?
              // match.startTime.toDate().toLocaleString()
              formatMatchDate(match.startTime.toDate())
              : "-"}
          </div>

        </div>

        {/* ROW 2 */}
        <div className={styles.metaRowBottom}>
          <span>Estado: {match.status}</span>
        </div>

        {/* ROW 3 */}
        <div className={styles.metaRowFooter}>
          {match.result && (
            <button onClick={handleResetMatch}>
              Reset
            </button>
          )}
        </div>

      </div>

      {/* VIEW MODE */}
      {editing && 
        <div className={styles.edit}>
          <input
            className={styles.input}
            value={homeTeam}
            onChange={(e) => setHomeTeam(e.target.value)}
          />

          <input
            className={styles.input}
            value={awayTeam}
            onChange={(e) => setAwayTeam(e.target.value)}
          />

          <select
            className={styles.selectSmall}
            value={group}
            onChange={(e) => setGroup(e.target.value)}
          >
            {"ABCDEFGHIJKL".split("").map((g) => (
              <option key={g} value={g}>
                Grupo {g}
              </option>
            ))}
          </select>

          <select
            className={styles.selectSmall}
            value={round}
            onChange={(e) => setRound(Number(e.target.value))}
          >
            {[1, 2, 3].map((r) => (
              <option key={r} value={r}>
                Fecha {r}
              </option>
            ))}
          </select>

          <input
            className={styles.input}
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />

          <div className={styles.actions}>
            <button
              className={styles.primaryButton}
              onClick={handleSave}
            >
              Guardar
            </button>

            <button
              className={styles.secondaryButton}
              onClick={() => setEditing(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      }

      {/* RESULT */}
      <div className={styles.resultSection}>

        <div className={styles.resultsLayout}>

          {/* HOME */}
          <div className={styles.teamLeft}>
            <div className={styles.team}>
              <img
                src={getTeamFlagSrc(match.homeTeam)}
                className={styles.flag}
                onError={handleFlagImageError}
              />
              <span className={styles.teamName}>{match.homeTeam}</span>
            </div>

            <div className={styles.scoreControl}>
              <button onClick={() => setHomeGoals((v) => Math.max(0, safeNumber(v) - 1))}>-</button>

              <input
                type="number"
                value={homeGoals}
                onChange={(e) => setHomeGoals(e.target.value)}
              />

              <button onClick={() => setHomeGoals((v) => safeNumber(v) + 1)}>+</button>
            </div>
          </div>

          {/* CENTRO */}
          <div className={styles.center}>
            <span className={styles.vs}>vs</span>
          </div>

          {/* AWAY */}
          <div className={styles.teamRight}>

            {isMobile ? (
              <>
                {/* TEAM primero (flag izquierda) */}
                <div className={styles.team}>
                  <img
                    src={getTeamFlagSrc(match.awayTeam)}
                    className={styles.flag}
                    onError={handleFlagImageError}
                  />
                  <span className={styles.teamName}>{match.awayTeam}</span>
                </div>

                {/* INPUT después */}
                <div className={styles.scoreControl}>
                  <button onClick={() => setAwayGoals((v) => Math.max(0, safeNumber(v) - 1))}>-</button>

                  <input
                    type="number"
                    value={awayGoals}
                    onChange={(e) => setAwayGoals(e.target.value)}
                  />

                  <button onClick={() => setAwayGoals((v) => safeNumber(v) + 1)}>+</button>
                </div>
              </>
            ) : (
              <>
                {/* DESKTOP (igual que tenías) */}
                <div className={styles.scoreControl}>
                  <button onClick={() => setAwayGoals((v) => Math.max(0, safeNumber(v) - 1))}>-</button>

                  <input
                    type="number"
                    value={awayGoals}
                    onChange={(e) => setAwayGoals(e.target.value)}
                  />

                  <button onClick={() => setAwayGoals((v) => safeNumber(v) + 1)}>+</button>
                </div>

                <div className={styles.team}>
                  <span className={styles.teamName}>{match.awayTeam}</span>
                  <img
                    src={getTeamFlagSrc(match.awayTeam)}
                    className={styles.flag}
                    onError={handleFlagImageError}
                  />
                </div>
              </>
            )}

          </div>

        </div>

        <button
          className={styles.primaryButton}
          onClick={() =>
            onSetResult(match.id, homeGoals, awayGoals)
          }
        >
          Cargar resultado
        </button>
      </div>
    </div>
  );
}