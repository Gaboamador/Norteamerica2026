import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useMatchesCached } from "@/hooks/useMatchesCached";
import { useLockedPredictionsSummaries } from "@/hooks/useLockedPredictionsSummaries";
import { buildProdeTimeline } from "@/utils/buildProdeTimeline";
import { formatDisplayName } from "@/utils/formatDisplayName";
import { formatMatchDate } from "@/utils/dateFormat";
import { getTeamFlagSrc, handleFlagImageError } from "@/utils/flagUtils";
import { getTeamShortName } from "@/utils/teams";
import { PiCaretDown, PiPauseFill, PiPlayFill } from "react-icons/pi";
import styles from "./ProdeTimeline.module.scss";

const PLAY_INTERVAL_MS = 1100;

const LIVE_ROW_HEIGHT = 44;
const LIVE_ROW_GAP = 4;
const LIVE_ROW_STEP = LIVE_ROW_HEIGHT + LIVE_ROW_GAP;

const LIVE_ROW_TRANSITION = {
  type: "spring",
  stiffness: 430,
  damping: 38,
  mass: 0.62,
};

function getFormattedMatchDate(match) {
  return match?.startTime ? formatMatchDate(match.startTime) : "";
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

function getCutHighlights(cut) {
  const table = Array.isArray(cut?.table) ? cut.table : [];

  const leader = table[0] || null;

  const biggestRise = table
    .filter((row) => row.movement > 0)
    .sort((a, b) => b.movement - a.movement)[0] || null;

  const biggestDrop = table
    .filter((row) => row.movement < 0)
    .sort((a, b) => a.movement - b.movement)[0] || null;

  const topScorers = table
    .filter((row) => row.deltaPoints > 0)
    .sort((a, b) => b.deltaPoints - a.deltaPoints)
    .slice(0, 3);

  return {
    leader,
    biggestRise,
    biggestDrop,
    topScorers,
  };
}

function getUserEvolution(timeline, uid) {
  if (!uid || !Array.isArray(timeline)) return [];

  return timeline
    .map((cut) => {
      const row = cut.table.find((item) => item.uid === uid);

      if (!row) return null;

      return {
        cutIndex: cut.index,
        matchId: cut.matchId,
        position: row.position,
        points: row.points,
        deltaPoints: row.deltaPoints,
        movement: row.movement,
      };
    })
    .filter(Boolean);
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

function UserEvolutionCard({ evolution, selectedCutIndex }) {
  if (!evolution.length) return null;

  const current = evolution.find(
    (item) => item.cutIndex === selectedCutIndex
  ) || evolution[evolution.length - 1];

  const recentEvolution = evolution.slice(-10);

  return (
    <div className={styles.evolutionCard}>
      <div className={styles.evolutionHeader}>
        <div>
          <span className={styles.evolutionLabel}>Mi evolución</span>
          <strong className={styles.evolutionCurrent}>
            {current.position}° · {current.points} pts
          </strong>
        </div>

        <div className={styles.evolutionDelta}>
          <DeltaPointsBadge deltaPoints={current.deltaPoints} />
          <MovementBadge movement={current.movement} />
        </div>
      </div>

      <div className={styles.evolutionTrack}>
        {recentEvolution.map((item) => {
          const active = item.cutIndex === selectedCutIndex;

          return (
            <span
              key={item.matchId}
              className={`${styles.evolutionPoint} ${
                active ? styles.evolutionPointActive : ""
              }`}
              title={`Corte ${item.cutIndex + 1}: ${item.position}°`}
            >
              {item.position}°
            </span>
          );
        })}
      </div>
    </div>
  );
}

function MatchLabelWithFlags({ cut, compact = false }) {
  const display = cut?.matchDisplay;

  if (!display) {
    return cut?.matchLabel || "";
  }

  return (
  <span className={`${styles.matchLabelWithFlags} ${compact ? styles.compact : ""}`}>
    <span className={`${styles.matchTeam} ${styles.homeTeam}`}>
      <span>{compact ? getTeamShortName(display.homeTeam) : display.homeTeam}</span>

      <img
        className={styles.matchFlag}
        src={getTeamFlagSrc(display.homeTeam)}
        alt=""
        onError={handleFlagImageError}
      />
    </span>

    <span className={styles.matchScore}>
    {display.hasResult ? (
        <>
        <span className={styles.matchGoal}>{display.homeGoals}</span>
        <span className={styles.matchDash}>-</span>
        <span className={styles.matchGoal}>{display.awayGoals}</span>
        </>
    ) : (
        <span className={styles.matchVs}>vs</span>
    )}
    </span>

    <span className={`${styles.matchTeam} ${styles.awayTeam}`}>
      <img
        className={styles.matchFlag}
        src={getTeamFlagSrc(display.awayTeam)}
        alt=""
        onError={handleFlagImageError}
      />

      <span>{compact ? getTeamShortName(display.awayTeam) : display.awayTeam}</span>
    </span>
  </span>
);
}

export default function ProdeTimeline() {
  const { user } = useAuth();
  const { matches, loading: matchesLoading } = useMatchesCached();
  const lockedController = useLockedPredictionsSummaries();

  const {
    groups,
    groupsLoading,
    summaries,
    loadingGroupIds,
    error,
    loadGroups,
    loadSummary,
  } = lockedController;

  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedCutIndex, setSelectedCutIndex] = useState(0);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [cutsExpanded, setCutsExpanded] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      const loadedGroups = await loadGroups();

      if (cancelled) return;

      const firstGroupId = loadedGroups?.[0]?.id || "";

      setSelectedGroupId(firstGroupId);

      if (firstGroupId) {
        await loadSummary(firstGroupId);
      }

      if (!cancelled) {
        setInitialLoadDone(true);
      }
    }

    loadInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedGroup = useMemo(() => {
    return groups.find((group) => group.id === selectedGroupId) || null;
  }, [groups, selectedGroupId]);

  const selectedSummary = selectedGroupId
    ? summaries[selectedGroupId]
    : null;

  const timeline = useMemo(() => {
    return buildProdeTimeline({
      group: selectedGroup,
      summary: selectedSummary,
      matches,
    });
  }, [selectedGroup, selectedSummary, matches]);

  const selectedCut = timeline[selectedCutIndex] || null;

  const highlights = useMemo(
    () => getCutHighlights(selectedCut),
    [selectedCut]
  );

  const userEvolution = useMemo(
    () => getUserEvolution(timeline, user?.uid),
    [timeline, user?.uid]
  );

  useEffect(() => {
    setSelectedCutIndex((current) => {
      if (!timeline.length) return 0;
      return Math.min(current, timeline.length - 1);
    });
  }, [timeline.length]);

  useEffect(() => {
    if (!isPlaying || timeline.length <= 1) return;

    const intervalId = window.setInterval(() => {
      setSelectedCutIndex((current) => {
        if (current >= timeline.length - 1) {
          setIsPlaying(false);
          return current;
        }

        return current + 1;
      });
    }, PLAY_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isPlaying, timeline.length]);

  const handleSelectGroup = async (groupId) => {
    setIsPlaying(false);
    setSelectedGroupId(groupId);
    setSelectedCutIndex(0);
    await loadSummary(groupId);
  };

  const goToPreviousCut = () => {
    setIsPlaying(false);
    setSelectedCutIndex((current) => Math.max(0, current - 1));
  };

  const goToNextCut = () => {
    setIsPlaying(false);
    setSelectedCutIndex((current) =>
      Math.min(timeline.length - 1, current + 1)
    );
  };

  const goToLastCut = () => {
    setIsPlaying(false);
    setSelectedCutIndex(Math.max(0, timeline.length - 1));
  };

  const togglePlay = () => {
    if (timeline.length <= 1) return;

    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    if (selectedCutIndex >= timeline.length - 1) {
      setSelectedCutIndex(0);
    }

    setIsPlaying(true);
  };

  const isLoading =
    matchesLoading ||
    groupsLoading ||
    !initialLoadDone ||
    Boolean(selectedGroupId && loadingGroupIds[selectedGroupId]);

  const hasPreviousCut = selectedCutIndex > 0;
  const hasNextCut = selectedCutIndex < timeline.length - 1;
  const progressPercent = timeline.length > 1
    ? ((selectedCutIndex + 1) / timeline.length) * 100
    : 100;

  if (isLoading) {
    return (
      <section className={styles.wrapper}>
        <div className={styles.loading}>
          Cargando línea de tiempo...
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.wrapper}>
        <div className={styles.message}>
          {error}
        </div>
      </section>
    );
  }

  if (!groups.length) {
    return (
      <section className={styles.wrapper}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Línea de tiempo</h1>
            <p className={styles.subtitle}>
              Acá vas a poder ver cómo fue cambiando la tabla de tus grupos.
            </p>
          </div>
        </header>

        <div className={styles.message}>
          No pertenecés a ningún grupo.
        </div>
      </section>
    );
  }

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Línea de tiempo</h1>
          <p className={styles.subtitle}>
            Mirá la evolución del grupo partido a partido.
          </p>
        </div>
      </header>

      {groups.length > 1 && (
        <div className={styles.groupSelector}>
          {groups.map((group) => {
            const active = group.id === selectedGroupId;

            return (
              <button
                key={group.id}
                type="button"
                className={`${styles.groupChip} ${active ? styles.active : ""}`}
                onClick={() => handleSelectGroup(group.id)}
              >
                {group.name}
              </button>
            );
          })}
        </div>
      )}

      {!selectedSummary && (
        <div className={styles.message}>
          Todavía no hay pronósticos publicados para este grupo.
        </div>
      )}

      {selectedSummary && timeline.length === 0 && (
        <div className={styles.message}>
          Todavía no hay partidos finalizados con pronósticos publicados para
          reconstruir la línea de tiempo.
        </div>
      )}

      {timeline.length > 0 && selectedCut && (
        <div className={styles.layout}>
          <aside className={styles.timelinePanel}>
            <button
                type="button"
                className={styles.panelHeader}
                onClick={() => setCutsExpanded((current) => !current)}
                aria-expanded={cutsExpanded}
            >
                <span className={styles.panelTitle}>
                Cortes por partido
                </span>

                <motion.span
                className={styles.panelChevron}
                animate={{ rotate: cutsExpanded ? 180 : 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                aria-hidden="true"
                >
                <PiCaretDown />
                </motion.span>
            </button>

            <motion.div
                className={styles.cutsCollapse}
                initial={false}
                animate={{
                height: cutsExpanded ? "auto" : 0,
                opacity: cutsExpanded ? 1 : 0,
                }}
                transition={{ duration: 0.22, ease: "easeOut" }}
            >
                <div className={styles.cuts}>
                {timeline.map((cut, index) => {
                    const active = index === selectedCutIndex;

                    return (
                    <button
                        key={cut.matchId}
                        type="button"
                        className={`${styles.cutButton} ${active ? styles.cutActive : ""}`}
                        onClick={() => {
                        setIsPlaying(false);
                        setSelectedCutIndex(index);
                        }}
                    >
                        <span className={styles.cutNumber}>
                        {index + 1}
                        </span>

                        <span className={styles.cutContent}>
                        <span className={styles.cutTopLine}>
                            <span className={styles.cutDate}>
                            {getFormattedMatchDate(cut.match)}
                            </span>
                        </span>

                        <span className={styles.cutMatch}>
                            <MatchLabelWithFlags cut={cut} compact />
                        </span>
                        </span>
                    </button>
                    );
                })}
                </div>
            </motion.div>
            </aside>

          <main className={styles.snapshot}>
            <div className={styles.snapshotHeader}>
                <div>
                    <div className={styles.snapshotLabel}>
                    Corte {selectedCut.index + 1} de {timeline.length}
                    </div>

                    <h2 className={styles.snapshotTitle}>
                    <MatchLabelWithFlags cut={selectedCut} />
                    </h2>

                    <p className={styles.snapshotDate}>
                    {getFormattedMatchDate(selectedCut.match)}
                    </p>
                </div>
                </div>

                <div className={styles.stickyControls}>
                <div className={styles.navigation}>
                    <button
                    type="button"
                    className={`button button--primary button--small ${styles.navButton} ${styles.playButton}`}
                    onClick={togglePlay}
                    disabled={timeline.length <= 1}
                    aria-label={isPlaying ? "Pausar reproducción" : "Reproducir línea de tiempo"}
                    title={isPlaying ? "Pausar" : "Reproducir"}
                    >
                    {isPlaying ? (
                        <PiPauseFill aria-hidden="true" />
                    ) : (
                        <PiPlayFill aria-hidden="true" />
                    )}
                    </button>

                    <button
                    type="button"
                    className={`button button--secondary button--small ${styles.navButton}`}
                    onClick={goToPreviousCut}
                    disabled={!hasPreviousCut}
                    >
                    Anterior
                    </button>

                    <button
                    type="button"
                    className={`button button--secondary button--small ${styles.navButton}`}
                    onClick={goToNextCut}
                    disabled={!hasNextCut}
                    >
                    Siguiente
                    </button>

                    <button
                    type="button"
                    className={`button button--tertiary button--small ${styles.navButton}`}
                    onClick={goToLastCut}
                    disabled={!hasNextCut}
                    >
                    Actual
                    </button>
                </div>

                <div className={styles.progressTrack}>
                    <div
                    className={styles.progressFill}
                    style={{ width: `${progressPercent}%` }}
                    />
                </div>
                </div>

            <UserEvolutionCard
              evolution={userEvolution}
              selectedCutIndex={selectedCutIndex}
            />

            <div className={styles.summaryGrid}>
              <div className={styles.summaryCard}>
                <span className={styles.summaryLabel}>Líder</span>
                <strong className={styles.summaryValue}>
                  {highlights.leader
                    ? formatDisplayName(
                        highlights.leader.displayName,
                        highlights.leader.email
                      )
                    : "—"}
                </strong>
              </div>

              <div className={styles.summaryCard}>
                <span className={styles.summaryLabel}>Mayor subida</span>
                <span className={styles.summaryValue}>
                {highlights.biggestRise ? (
                    <>
                    <span className={styles.summaryName}>
                        {formatDisplayName(
                        highlights.biggestRise.displayName,
                        highlights.biggestRise.email
                        )}
                    </span>

                    <span className={styles.summaryMovement}>
                        ↑ {highlights.biggestRise.movement}
                    </span>
                    </>
                ) : (
                    <span className={styles.summaryEmpty}>Sin cambios</span>
                )}
                </span>
              </div>

              <div className={styles.summaryCard}>
                <span className={styles.summaryLabel}>Mayor caída</span>
                <span className={styles.summaryValue}>
                {highlights.biggestDrop ? (
                    <>
                    <span className={styles.summaryName}>
                        {formatDisplayName(
                        highlights.biggestDrop.displayName,
                        highlights.biggestDrop.email
                        )}
                    </span>

                    <span className={styles.summaryMovement}>
                        ↓ {Math.abs(highlights.biggestDrop.movement)}
                    </span>
                    </>
                ) : (
                    <span className={styles.summaryEmpty}>Sin cambios</span>
                )}
                </span>
              </div>
            </div>

            {highlights.topScorers.length > 0 && (
              <div className={styles.topScorers}>
                <span className={styles.topScorersLabel}>
                  Más puntos en este corte
                </span>

                <div className={styles.topScorersList}>
                  {highlights.topScorers.map((row) => (
                    <span key={row.uid} className={styles.topScorer}>
                      {formatDisplayName(row.displayName, row.email)}
                        <span className={getPointsClassName(row.deltaPoints)}>
                        +{row.deltaPoints}
                        </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.tableWrapper}>
                <div
                    className={styles.liveTable}
                    role="table"
                    aria-label="Tabla de posiciones del grupo"
                >
                    <div className={styles.tableHeader} role="row">
                    <div role="columnheader">Pos</div>
                    <div role="columnheader">Jugador</div>
                    <div role="columnheader">Pts</div>
                    <div role="columnheader">+Pts</div>
                    <div className={styles.desktopOnly} role="columnheader">Signos</div>
                    <div className={styles.desktopOnly} role="columnheader">Puntuados</div>
                    <div className={styles.desktopOnly} role="columnheader">Plenos</div>
                    <div role="columnheader">Mov.</div>
                    </div>

                    <div
                    className={styles.liveTableBody}
                    style={{
                        height: `${getLiveTableBodyHeight(selectedCut.table)}px`,
                    }}
                    role="rowgroup"
                    >
                    {selectedCut.table.map((row, visualIndex) => {
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
                                key={`${selectedCut.matchId}-${row.uid}-${movementDirection}`}
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

                            <div className={styles.desktopOnly} role="cell">{row.signHits}</div>

                            <div className={styles.desktopOnly} role="cell">{row.scoredMatches}</div>

                            <div className={styles.desktopOnly} role="cell">{row.plenos}</div>

                            <div role="cell">
                            <MovementBadge movement={row.movement} />
                            </div>
                        </motion.div>
                        );
                    })}
                    </div>
                </div>
                </div>
          </main>
        </div>
      )}
    </section>
  );
}