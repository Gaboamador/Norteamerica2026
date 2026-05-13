import React, { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserGroups } from "@/hooks/useUserGroups";
import { useGroupStandings } from "@/hooks/useGroupStandings";
import { useMultiGroupStandings } from "@/hooks/useMultiGroupStandings";
import { mergeStandings } from "@/utils/mergeStandings";
import { formatDisplayName } from "@/utils/formatDisplayName";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./TablaPosiciones.module.scss";

const TablaPosiciones = () => {

  const { user } = useAuth();
  const groups = useUserGroups();

  // selector: "all" = unificada
  const [selected, setSelected] = useState("all");
  const [expandedUid, setExpandedUid] = useState(null);

  // función que limpia y cierra detalle cuando se cambia de tabla
  const handleSelect = (value) => {
    setSelected(value);
    setExpandedUid(null);
  };

  // memo para evitar loops
  const groupIds = useMemo(
    () => groups.map((g) => g.id),
    [groups]
  );

  // memo para verificar la cantidad de grupos en que participa el usuario
  const hasMultipleGroups = groups.length > 1;
  const onlyGroupId = groups.length === 1 ? groups[0].id : null;
  const activeSelected = hasMultipleGroups ? selected : onlyGroupId;

  // todas las tablas de los grupos
  const multiTables = useMultiGroupStandings(groupIds);

  // tabla unificada
  const unifiedTable = useMemo(
    () => mergeStandings(multiTables),
    [multiTables]
  );

  // tabla de grupo individual
  const groupTable = useGroupStandings(
    // selected === "all" ? null : selected
    activeSelected === "all" ? null : activeSelected
  );

  // tabla final
  const table =
    // selected === "all" ? unifiedTable : groupTable;
    activeSelected === "all" ? unifiedTable : groupTable;

  const leaderRank = useMemo(() => {
    if (!table?.length) return null;

    const first = table[0];

    return {
      points: Number(first.points || 0),
      signHits: Number(first.signHits || 0),
      scoredMatches: Number(first.scoredMatches || 0),
      plenos: Number(first.plenos || 0),
    };
  }, [table]);

  const hasSameLeaderRank = (u) => {
    if (!leaderRank) return false;

    return (
      Number(u.points || 0) === leaderRank.points &&
      Number(u.signHits || 0) === leaderRank.signHits &&
      Number(u.scoredMatches || 0) === leaderRank.scoredMatches &&
      Number(u.plenos || 0) === leaderRank.plenos
    );
  };

  const activeGroupName = useMemo(() => {
    if (!hasMultipleGroups) {
      return groups[0]?.name || "Grupo";
    }

    if (activeSelected === "all") {
      return "Tabla unificada de mis grupos";
    }

    const group = groups.find((g) => g.id === activeSelected);
    return group?.name || "Grupo";
  }, [activeSelected, groups, hasMultipleGroups]);


  return (
    <section className={styles.wrapper}>
      <div className={styles.title}>Tabla de posiciones</div>

      {/* SELECTOR */}
      {hasMultipleGroups && (
      <div className={styles.selectorWrapper}>
        <div className={styles.selectorLabel}>
          SELECCIONAR TABLA
        </div>
        <div className={styles.selector}>
          <button
            onClick={() => handleSelect("all")}
            className={`button button--primary button--small ${
              selected === "all" ? styles.active : ""
            }`}
          >
            General
          </button>

          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => handleSelect(g.id)}
              className={`button button--primary button--small ${
                selected === g.id ? styles.active : ""
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>
      )}
      
      {/* TITULO TABLA ACTIVA (si hay más de un grupo) */}
      
      <div className={styles.activeGroupTitle}>
        {activeGroupName}
      </div>
      

      <p className={styles.tableHint}>
        Tocá una fila para ver los criterios de desempate.
      </p>

      {/* TABLA */}
      <AnimatePresence mode="wait">
        <motion.div
          // key={selected}
          key={activeSelected || "empty"}
          className={styles.table}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {(table || []).map((u) => {
          const isExpanded = expandedUid === u.uid;
          const isMe = user?.uid === u.uid;
          const isLeader = hasSameLeaderRank(u);

          return (
            <motion.div
              key={u.uid}
              layout
              className={styles.rowWrapper}
              transition={{
                layout: {
                  duration: 0.35,
                  ease: "easeOut",
                },
              }}
            >
              <button
                type="button"
                className={`${styles.row} ${isLeader ? styles.leaderRow : ""} ${
                  isMe ? styles.myRow : ""
                }`}
                onClick={() =>
                  setExpandedUid((current) => (current === u.uid ? null : u.uid))
                }
                aria-expanded={isExpanded}
              >
                <span className={styles.position}>#{u.position}</span>

                <span className={styles.name}>
                  {formatDisplayName(u.displayName, u.email)}
                  {isMe && <span className={styles.badge}>Vos</span>}
                </span>

                <motion.span
                  className={styles.points}
                  key={u.points}
                  initial={{ scale: 1.2, opacity: 0.6 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.25 }}
                >
                  {u.points} pts
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    className={styles.detail}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                  >
                    <div className={styles.detailInner}>
                      <div className={styles.detailTitle}>
                        Criterios de desempate
                      </div>

                      <div className={styles.detailGrid}>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>
                            Ganador o empate acertado
                          </span>
                          <span className={styles.detailValue}>
                            {u.signHits ?? 0}
                          </span>
                        </div>

                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>
                            Partidos puntuados
                          </span>
                          <span className={styles.detailValue}>
                            {u.scoredMatches ?? 0}
                          </span>
                        </div>

                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>
                            Plenos
                          </span>
                          <span className={styles.detailValue}>
                            {u.plenos ?? 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
        </motion.div>
      </AnimatePresence>
    </section>
  );
};

export default TablaPosiciones;