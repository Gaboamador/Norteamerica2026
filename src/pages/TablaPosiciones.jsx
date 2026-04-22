import React, { useState, useMemo } from "react";
import { useUserGroups } from "@/hooks/useUserGroups";
import { useGroupStandings } from "@/hooks/useGroupStandings";
import { useMultiGroupStandings } from "@/hooks/useMultiGroupStandings";
import { mergeStandings } from "@/utils/mergeStandings";
import { formatDisplayName } from "@/utils/formatDisplayName";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./TablaPosiciones.module.scss";

const TablaPosiciones = () => {
  const groups = useUserGroups();

  // selector: "all" = unificada
  const [selected, setSelected] = useState("all");

  // memo para evitar loops
  const groupIds = useMemo(
    () => groups.map((g) => g.id),
    [groups]
  );

  // todas las tablas de los grupos
  const multiTables = useMultiGroupStandings(groupIds);

  // tabla unificada
  const unifiedTable = useMemo(
    () => mergeStandings(multiTables),
    [multiTables]
  );

  // tabla de grupo individual
  const groupTable = useGroupStandings(
    selected === "all" ? null : selected
  );

  // tabla final
  const table =
    selected === "all" ? unifiedTable : groupTable;

  const activeGroupName = useMemo(() => {
    if (selected === "all") {
      return "Tabla unificada de mis grupos";
    }

  const group = groups.find((g) => g.id === selected);
    return group?.name || "Grupo";
  }, [selected, groups]);

  return (
    <section className={styles.wrapper}>
      <div className={styles.title}>Tabla de posiciones</div>

      {/* SELECTOR */}
      <div className={styles.selectorWrapper}>
        <div className={styles.selectorLabel}>
          Ver tabla de:
        </div>
        <div className={styles.selector}>
          <button
            onClick={() => setSelected("all")}
            className={`${styles.selectorButton} ${
              selected === "all" ? styles.active : ""
            }`}
          >
            General
          </button>

          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => setSelected(g.id)}
              className={`${styles.selectorButton} ${
                selected === g.id ? styles.active : ""
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>

      {/* TITULO TABLA ACTIVA */}
      <div className={styles.activeGroupTitle}>
        {activeGroupName}
      </div>

      {/* TABLA */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selected}
          className={styles.table}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {(table || []).map((u) => (
            <motion.div
              key={u.uid}
              layout
              className={styles.row}
              whileLayout={{ scale: 1.01 }}
              transition={{
                layout: {
                  duration: 0.35,
                  ease: "easeOut"
                }
              }}
            >
              <span className={styles.position}>#{u.position}</span>
              <span className={styles.name}>{formatDisplayName(u.displayName, u.email)}</span>
              <motion.span
                className={styles.points}
                key={u.points}
                initial={{ scale: 1.2, opacity: 0.6 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.25 }}
              >
                {u.points} pts
              </motion.span>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </section>
  );
};

export default TablaPosiciones;