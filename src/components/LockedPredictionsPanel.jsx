import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getTeamFlagSrc, handleFlagImageError } from "@/utils/flagUtils";
import styles from "./LockedPredictionsPanel.module.scss";

export default function LockedPredictionsPanel({
  match,
  controller,
}) {
  const [expanded, setExpanded] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState("");

  const {
    groups,
    groupsLoading,
    summaries,
    loadingGroupIds,
    error,
    loadGroups,
    loadSummary,
    getRowsForMatch,
  } = controller;

  const rows = selectedGroupId
    ? getRowsForMatch(selectedGroupId, match)
    : [];

  const selectedSummary = selectedGroupId ? summaries[selectedGroupId] : null;

  const selectedMatchWasPublished = Boolean(
    selectedSummary?.matches?.[match.id]
  );

  const isLoading =
    groupsLoading || Boolean(selectedGroupId && loadingGroupIds[selectedGroupId]);

  const handleToggle = async () => {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);

    if (!nextExpanded) return;

    const loadedGroups = await loadGroups();

    if (!loadedGroups.length) return;

    const nextGroupId = selectedGroupId || loadedGroups[0].id;

    setSelectedGroupId(nextGroupId);
    await loadSummary(nextGroupId);
  };

    const handleGroupChange = async (groupId) => {
    setSelectedGroupId(groupId);
    await loadSummary(groupId);
    };

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={`button button--secondary button--small ${styles.toggle}`}
        onClick={handleToggle}
      >
        {expanded ? "Ocultar pronósticos del grupo" : "Ver pronósticos del grupo"}
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            className={styles.panel}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
          >
            {error && (
              <div className={styles.message}>
                {error}
              </div>
            )}

            {isLoading && (
              <div className={styles.message}>
                Cargando pronósticos...
              </div>
            )}

            {!isLoading && groups.length === 0 && (
              <div className={styles.message}>
                No pertenecés a ningún grupo.
              </div>
            )}

            {!isLoading && groups.length > 1 && (
            <div className={styles.groupSelector}>
                {groups.map((group) => {
                const active = group.id === selectedGroupId;

                return (
                    <button
                    key={group.id}
                    type="button"
                    className={`${styles.groupChip} ${active ? styles.active : ""}`}
                    onClick={() => handleGroupChange(group.id)}
                    >
                    {group.name}
                    </button>
                );
                })}
            </div>
            )}

            {!isLoading && selectedGroupId && !selectedMatchWasPublished && (
              <div className={styles.message}>
                Todavía no se publicaron pronósticos para este partido.
              </div>
            )}

            {!isLoading && selectedMatchWasPublished && rows.length === 0 && (
              <div className={styles.message}>
                Nadie del grupo cargó pronóstico para este partido.
              </div>
            )}

            {!isLoading && rows.length > 0 && (
              <div className={styles.list}>
                {rows.map((row) => {
                  const hasMatchPoints =
                    row.matchPoints !== null && row.matchPoints !== undefined;

                  return (
                    <div key={row.uid} className={styles.row}>
                      <span className={styles.name}>
                        {row.displayName}
                      </span>

                      <span className={styles.prediction}>
                        <img
                          className={styles.flag}
                          src={getTeamFlagSrc(match.homeTeam)}
                          alt=""
                          onError={handleFlagImageError}
                        />

                        <span className={styles.score}>
                          {row.predHome} - {row.predAway}
                        </span>

                        <img
                          className={styles.flag}
                          src={getTeamFlagSrc(match.awayTeam)}
                          alt=""
                          onError={handleFlagImageError}
                        />
                      </span>

                      <span
                        className={`${styles.points} ${
                          hasMatchPoints ? styles[`points${row.matchPoints}`] : ""
                        }`}
                        title={
                          hasMatchPoints
                            ? `Puntos obtenidos: ${row.matchPoints}`
                            : "El partido todavía no tiene resultado oficial"
                        }
                      >
                        {hasMatchPoints ? `+${row.matchPoints}` : "-"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}