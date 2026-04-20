import { useEffect, useRef, useState } from "react";
import { sortMatches, groupMatches, getGroupLabel } from "@/utils/matchesGrouping";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./MatchesGrouped.module.scss";

export default function MatchesGrouped({
  matches,
  mode,
  renderMatch,
  autoFocusPending = true,
}) {
  const sorted = sortMatches(matches, mode);
  const grouped = groupMatches(sorted, mode);
  const firstPendingRef = useRef(null);
  const firstPendingId = autoFocusPending ? sorted.find((m) => !m.result)?.id : null;
  const [openGroups, setOpenGroups] = useState({});
  const [autoOpenedMode, setAutoOpenedMode] = useState(null);
  const toggleGroup = (key) => {
    setOpenGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  useEffect(() => {
    if (firstPendingRef.current) {
      firstPendingRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [matches, mode]);

  // Abrir automáticamente el grupo donde está el pending
  useEffect(() => {
    if (!firstPendingId) return;

    // si ya abrimos para este modo, no repetir
    if (autoOpenedMode === mode) return;

    for (const [key, list] of Object.entries(grouped)) {
      if (list.some((m) => m.id === firstPendingId)) {
        setOpenGroups((prev) => ({
          ...prev,
          [key]: true,
        }));

        setAutoOpenedMode(mode);
        break;
      }
    }
  }, [firstPendingId, mode]);

  return (
    <div className={styles.wrapper}>
      {Object.entries(grouped).map(([key, groupMatches]) => (
        <section key={key} className={styles.group}>
          <div
            className={styles.groupHeader}
            onClick={() => toggleGroup(key)}
          >
            <h3 className={styles.groupTitle}>
              {getGroupLabel(key, mode, groupMatches)}
            </h3>

            <motion.span
              className={styles.chevron}
              animate={{ rotate: openGroups[key] ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              ▼
            </motion.span>
          </div>

          <AnimatePresence initial={false}>
            {openGroups[key] && (
              <motion.div
                key="content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                style={{ overflow: "hidden" }}
              >
                <div className={styles.matches}>
                  {groupMatches.map((m) => {
                    const ref = m.id === firstPendingId ? firstPendingRef : null;

                    return (
                      <div key={m.id} ref={ref}>
                        {renderMatch(m)}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      ))}
    </div>
  );
}