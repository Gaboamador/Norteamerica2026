import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStandingsDirty } from "@/context/StandingsDirtyContext";
import { recomputeStandings } from "@/services/firebase/standingsService";
import { useToast } from "@/context/ToastContext";
import { useAllGroups } from "@/hooks/useAllGroups";
import styles from "./DirtyBanner.module.scss";

export function DirtyBanner() {
  const ctx = useStandingsDirty();
  const { showToast } = useToast();
  const groups = useAllGroups();
  const [expanded, setExpanded] = useState(false);

  if (!ctx?.dirty) return null;

  const groupNameMap = Object.fromEntries(groups.map((g) => [g.id, g.name]));
  const { groups: groupChanges, users: userChanges } = ctx.changes;
  const hasDetails = groupChanges.length > 0 || userChanges.length > 0;

  const handleRecompute = async () => {
    try {
      await recomputeStandings();
      ctx.clearDirty();
      showToast({ type: "success", message: "Tabla actualizada" });
    } catch (err) {
      console.error(err);
      showToast({ type: "error", message: "Error al actualizar la tabla" });
    }
  };

  return (
    <div className={styles.dirtyBanner}>
      <div className={styles.content}>

        <div className={styles.header}>
          <span className={styles.message}>
            Hay cambios pendientes de aplicar en la tabla.
          </span>
          {hasDetails && (
            <button
              className={styles.expandButton}
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
            >
              {expanded ? "−" : "+"}
            </button>
          )}
        </div>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              className={styles.details}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
              {groupChanges.length > 0 && (
                <ul className={styles.changeLog}>
                  {groupChanges.map(({ groupId, added, removed }) => (
                    <li key={groupId}>
                      <strong>{groupNameMap[groupId] || groupId}:</strong>
                      {added.length > 0 && (
                        <span className={styles.added}> +{added.join(", ")}</span>
                      )}
                      {removed.length > 0 && (
                        <span className={styles.removed}> −{removed.join(", ")}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {userChanges.length > 0 && (
                <ul className={styles.changeLog}>
                  {userChanges.map(({ userId, from, to }) => (
                    <li key={userId}>
                      Nombre:{" "}
                      <span className={styles.removed}>{from}</span>
                      {" → "}
                      <span className={styles.added}>{to}</span>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      <button onClick={handleRecompute} className={styles.actionButton}>
        Actualizar
      </button>
    </div>
  );
}