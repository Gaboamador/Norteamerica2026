import React, { useState, useMemo } from "react";
import { useGroupStandings } from "../hooks/useGroupStandings";
import { useUserGroups } from "../hooks/useUserGroups";
import { useMultiGroupStandings } from "../hooks/useMultiGroupStandings";
import { mergeStandings } from "../utils/mergeStandings";
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
      <div className={styles.selector}>
        <button
          onClick={() => setSelected("all")}
          className={`${styles.selectorButton} ${
            selected === "all" ? styles.active : ""
          }`}
        >
          Tabla unificada de mis grupos
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

      {/* TITULO TABLA ACTIVA */}
      <div className={styles.activeGroupTitle}>
        {activeGroupName}
      </div>

      {/* TABLA */}
      <div className={styles.table}>
        {table.map((u) => (
          <div key={u.uid} className={styles.row}>
            <span className={styles.position}>#{u.position}</span>
            <span className={styles.name}>{u.displayName}</span>
            <span className={styles.points}>{u.points} pts</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TablaPosiciones;