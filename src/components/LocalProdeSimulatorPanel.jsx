import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { getTeamFlagSrc, handleFlagImageError } from "@/utils/flagUtils";
import { getTeamShortName } from "@/utils/teams";
import { formatMatchDate } from "@/utils/dateFormat";
import { formatDisplayName } from "@/utils/formatDisplayName";
import { buildSimulatedProdeStandings, getSimulationCandidateMatches } from "@/utils/buildSimulatedProdeStandings";
import { PiArrowsInLineVertical, PiArrowsOutLineVertical } from "react-icons/pi";
import styles from "./LocalProdeSimulatorPanel.module.scss";

const STORAGE_VERSION = "v1";
const STORAGE_KEY = `na2026:${STORAGE_VERSION}:local-prode-simulator`;

const LIVE_ROW_HEIGHT = 44;
const LIVE_ROW_GAP = 4;
const LIVE_ROW_STEP = LIVE_ROW_HEIGHT + LIVE_ROW_GAP;

const LIVE_ROW_TRANSITION = {
  type: "spring",
  stiffness: 430,
  damping: 38,
  mass: 0.62,
};

function isBrowser() {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

function readStoredResults() {
  if (!isBrowser()) return {};

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);

    if (!raw) return {};

    const parsed = JSON.parse(raw);

    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return {};
  }
}

function saveStoredResults(simulatedResultsByMatchId) {
  if (!isBrowser()) return;

  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(simulatedResultsByMatchId)
    );
  } catch {
    // No bloqueamos el simulador si sessionStorage falla.
  }
}

function getFormattedMatchDate(match) {
  return match?.startTime ? formatMatchDate(match.startTime) : "";
}

function getLiveRowYByIndex(index) {
  return index * LIVE_ROW_STEP;
}

function getLiveTableBodyHeight(rows) {
  if (!rows.length) return 0;

  return rows.length * LIVE_ROW_STEP - LIVE_ROW_GAP;
}

function getMovementDirection(row) {
  if (row.movement > 0) return "up";
  if (row.movement < 0) return "down";
  return "neutral";
}

function getRowClassName(row) {
  if (row.movement > 0) return styles.rowUp;
  if (row.movement < 0) return styles.rowDown;

  return "";
}

function getPointsClassName(points) {
  const hasPoints = points !== null && points !== undefined;

  return `${styles.pointsBadge} ${
    hasPoints ? styles[`points${points}`] || "" : ""
  }`;
}

function hasAnyValue(result) {
  return (
    result?.homeGoals !== undefined ||
    result?.awayGoals !== undefined
  );
}

function hasCompleteResult(result) {
  if (!result) return false;

  const homeGoals = Number(result.homeGoals);
  const awayGoals = Number(result.awayGoals);

  return (
    Number.isInteger(homeGoals) &&
    Number.isInteger(awayGoals) &&
    homeGoals >= 0 &&
    awayGoals >= 0
  );
}

function MovementBadge({ movement }) {
  if (!movement) {
    return <span className={styles.movementNeutral}>—</span>;
  }

  if (movement > 0) {
    return <span className={styles.movementUp}>↑ {movement}</span>;
  }

  return <span className={styles.movementDown}>↓ {Math.abs(movement)}</span>;
}

function DeltaPointsBadge({ deltaPoints }) {
  if (!deltaPoints) {
    return <span className={`${styles.pointsBadge} ${styles.points0}`}>—</span>;
  }

  return (
    <span className={getPointsClassName(deltaPoints)}>
      +{deltaPoints}
    </span>
  );
}

export default function LocalProdeSimulatorPanel({
  currentMatch,
  group,
  summary,
  matches = [],
}) {
  const { user } = useAuth();
  const [simulationCompact, setSimulationCompact] = useState(true);
  const [simulatedResultsByMatchId, setSimulatedResultsByMatchId] = useState(() =>
    readStoredResults()
  );

  useEffect(() => {
    saveStoredResults(simulatedResultsByMatchId);
  }, [simulatedResultsByMatchId]);

  const candidateMatches = useMemo(() => {
  return getSimulationCandidateMatches({
    currentMatch,
    summary,
    matches,
  });
}, [currentMatch, summary, matches]);

const { table } = useMemo(() => {
  return buildSimulatedProdeStandings({
    group,
    summary,
    matches,
    simulatedResultsByMatchId,
  });
}, [group, summary, matches, simulatedResultsByMatchId]);

  const candidateMatchIds = useMemo(() => {
    return new Set(candidateMatches.map((match) => match.id));
  }, [candidateMatches]);

  const hasAnyCandidateSimulatedResult = useMemo(() => {
    return Object.entries(simulatedResultsByMatchId).some(([matchId, result]) => {
      return candidateMatchIds.has(matchId) && hasAnyValue(result);
    });
  }, [candidateMatchIds, simulatedResultsByMatchId]);

  const showClearAll = candidateMatches.length >= 2;

  const handleChangeResult = (matchId, field, value) => {
    setSimulatedResultsByMatchId((current) => {
      const previous = current[matchId] ?? {
        homeGoals: "",
        awayGoals: "",
      };

      const nextResult = {
        ...previous,
        [field]: value,
      };

      const bothEmpty =
        String(nextResult.homeGoals ?? "").trim() === "" &&
        String(nextResult.awayGoals ?? "").trim() === "";

      const next = { ...current };

      if (bothEmpty) {
        delete next[matchId];
      } else {
        next[matchId] = nextResult;
      }

      return next;
    });
  };

  const handleClearMatch = (matchId) => {
    setSimulatedResultsByMatchId((current) => {
      const next = { ...current };
      delete next[matchId];

      return next;
    });
  };

  const handleClearAll = () => {
    setSimulatedResultsByMatchId((current) => {
      if (!candidateMatches.length) return {};

      const next = { ...current };

      candidateMatches.forEach((match) => {
        delete next[match.id];
      });

      return next;
    });
  };

  return (
    <div className={styles.wrapper}>
      <section
        className={`${styles.simulationSection} ${
          simulationCompact ? styles.simulationCompact : ""
        }`}
      >
        <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderText}>
                <h2 className={styles.sectionTitle}>
                Resultados temporales
                </h2>

                {!simulationCompact && (
                <p className={styles.sectionDescription}>
                    Esta simulación no modifica resultados oficiales ni pronósticos.
                </p>
                )}
            </div>

            <div className={styles.sectionActions}>
                <button
                type="button"
                className={styles.viewToggle}
                onClick={() => setSimulationCompact((current) => !current)}
                aria-label={
                    simulationCompact
                    ? "Ver más información de los partidos"
                    : "Compactar partidos"
                }
                title={
                    simulationCompact
                    ? "Ver más información"
                    : "Compactar"
                }
                >
                {simulationCompact ? (
                    <PiArrowsOutLineVertical aria-hidden="true" />
                ) : (
                    <PiArrowsInLineVertical aria-hidden="true" />
                )}
                </button>

                {showClearAll && (
                <button
                    type="button"
                    className="button button--tertiary button--small"
                    onClick={handleClearAll}
                    disabled={!hasAnyCandidateSimulatedResult}
                >
                    Limpiar simulación
                </button>
                )}
            </div>
            </div>

        {!candidateMatches.length ? (
          <div className={styles.empty}>
            No hay partidos bloqueados sin resultado oficial disponibles para simular.
          </div>
        ) : (
          <div className={styles.matches}>
            {candidateMatches.map((match) => {
              const simulated = simulatedResultsByMatchId[match.id] ?? {};
              const formattedDate = getFormattedMatchDate(match);
              const matchHasAnyValue = hasAnyValue(simulated);
              const matchHasCompleteResult = hasCompleteResult(simulated);

              const homeTeamLabel = simulationCompact
                ? getTeamShortName(match.homeTeam)
                : match.homeTeam;

              const awayTeamLabel = simulationCompact
                ? getTeamShortName(match.awayTeam)
                : match.awayTeam;

              return (
                <article
                  key={match.id}
                  className={`${styles.match} ${
                    matchHasCompleteResult ? styles.matchActive : ""
                  }`}
                >
                  <div className={styles.matchMeta}>
                    <span>{formattedDate}</span>

                    {match.id === currentMatch?.id && (
                      <span className={styles.currentBadge}>
                        partido actual
                      </span>
                    )}
                  </div>

                  <div className={styles.matchMain}>
                    <div className={styles.team}>
                      <span>{homeTeamLabel}</span>
                      <img
                        className={styles.flag}
                        src={getTeamFlagSrc(match.homeTeam)}
                        alt=""
                        onError={handleFlagImageError}
                      />
                    </div>

                    <div className={styles.score}>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        inputMode="numeric"
                        value={simulated.homeGoals ?? ""}
                        onWheel={(event) => event.currentTarget.blur()}
                        onChange={(event) =>
                          handleChangeResult(
                            match.id,
                            "homeGoals",
                            event.target.value
                          )
                        }
                        aria-label={`Goles de ${match.homeTeam}`}
                      />

                      <span>-</span>

                      <input
                        type="number"
                        min="0"
                        max="20"
                        inputMode="numeric"
                        value={simulated.awayGoals ?? ""}
                        onWheel={(event) => event.currentTarget.blur()}
                        onChange={(event) =>
                          handleChangeResult(
                            match.id,
                            "awayGoals",
                            event.target.value
                          )
                        }
                        aria-label={`Goles de ${match.awayTeam}`}
                      />
                    </div>

                    <div className={`${styles.team} ${styles.awayTeam}`}>
                      <img
                        className={styles.flag}
                        src={getTeamFlagSrc(match.awayTeam)}
                        alt=""
                        onError={handleFlagImageError}
                      />
                      <span>{awayTeamLabel}</span>
                    </div>
                  </div>

                  {matchHasAnyValue && !simulationCompact && (
                    <button
                      type="button"
                      className={styles.clearMatch}
                      onClick={() => handleClearMatch(match.id)}
                    >
                      Limpiar partido
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className={styles.tableSection}>
        <h2 className={styles.sectionTitle}>
          Tabla simulada
        </h2>

        {!table.length ? (
          <div className={styles.empty}>
            La tabla se va a mostrar cuando haya pronósticos publicados para calcular.
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <div
              className={styles.liveTable}
              role="table"
              aria-label="Tabla simulada del grupo"
            >
              <div className={styles.tableHeader} role="row">
                <div role="columnheader">Pos</div>
                <div role="columnheader">Jugador</div>
                <div role="columnheader">Pts</div>
                <div role="columnheader">+/-</div>
                <div role="columnheader">Mov</div>
              </div>

              <div
                className={styles.liveTableBody}
                style={{
                  height: `${getLiveTableBodyHeight(table)}px`,
                }}
                role="rowgroup"
              >
                {table.map((row, visualIndex) => {
                  const movementDirection = getMovementDirection(row);
                  const hasMovement = movementDirection !== "neutral";

                  return (
                    <motion.div
                      key={row.uid}
                      className={`${styles.tableRow} ${getRowClassName(row)}`}
                      initial={false}
                      animate={{
                        y: getLiveRowYByIndex(visualIndex),
                      }}
                      transition={LIVE_ROW_TRANSITION}
                      role="row"
                    >
                      {hasMovement && (
                        <motion.span
                          key={`${row.uid}-${row.position}-${row.movement}`}
                          className={`${styles.liveFlash} ${
                            movementDirection === "up"
                              ? styles.liveFlashUp
                              : styles.liveFlashDown
                          }`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 0.95, ease: "easeOut" }}
                          aria-hidden="true"
                        />
                      )}

                      <div className={styles.positionCell} role="cell">
                        <span className={styles.position}>
                          {row.position}
                        </span>
                      </div>

                      <div role="cell">
                        <div className={styles.userCell}>
                          <span className={styles.userName}>
                            {formatDisplayName(row.displayName, row.email)}

                            {row.uid === user?.uid && (
                                <span className={styles.badge}>Vos</span>
                            )}
                            </span>
                        </div>
                      </div>

                      <div className={styles.points} role="cell">
                        {row.points}
                      </div>

                      <div role="cell">
                        <DeltaPointsBadge deltaPoints={row.deltaPoints} />
                      </div>

                      <div role="cell">
                        <MovementBadge movement={row.movement} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {!hasAnyCandidateSimulatedResult && table.length > 0 && (
          <p className={styles.hint}>
            Cargá un resultado temporal para ver cómo se movería la tabla.
          </p>
        )}
      </section>
    </div>
  );
}