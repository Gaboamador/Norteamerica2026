import { useState } from "react";
import { useMatches } from "@/hooks/useMatches";
import MatchCard from "@/components/MatchCard";
import MatchesGrouped from "@/components/MatchesGrouped";
import styles from "./MatchesScreen.module.scss";

export default function MatchesScreen() {
  const { matches, loading } = useMatches();
  const [mode, setMode] = useState("date"); // "date" | "group"

  if (loading) {
    return (
      <div className={styles.loading}>
        Cargando partidos...
      </div>
    );
  }

  return (
    <section className={styles.wrapper}>
      <div className={styles.titleMain}>Cargar Pronósticos</div>

      {/* HEADER */}
      <div className={styles.header}>
        <h2 className={styles.title}>Partidos</h2>

        <div className={styles.selector}>
          <span>Ordenar</span>
          <button
            onClick={() => setMode("date")}
            className={`${styles.selectorButton} ${
              mode === "date" ? styles.active : ""
            }`}
          >
            Por fecha
          </button>

          <button
            onClick={() => setMode("group")}
            className={`${styles.selectorButton} ${
              mode === "group" ? styles.active : ""
            }`}
          >
            Por grupo
          </button>
        </div>
      </div>

      {/* LIST */}
      <MatchesGrouped
        matches={matches}
        mode={mode}
        renderMatch={(m) => (
          <MatchCard key={m.id} match={m} />
        )}
      />
    </section>
  );
}