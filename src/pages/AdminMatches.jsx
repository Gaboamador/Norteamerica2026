import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "../hooks/useAdmin";
import { getDocs, collection } from "firebase/firestore";
import { db } from "@/services/firebase/firebase";
import { createMatch, updateMatch, getAllPredictions } from "@/services/firebase/firebaseUtils";
import { saveGlobalStandings, saveGroupStandings } from "@/services/firebase/firebaseStandings";
import { filterStandingsByGroup } from "@/utils/filterStandingsByGroup";
import { recomputeStandings } from "@/services/firebase/standingsService";
import { useToast } from "@/context/ToastContext";
import { Timestamp } from "firebase/firestore";
import { buildStandings } from "@/utils/buildStandings";
import MatchRow from "@/components/MatchRow";
import MatchesGrouped from "@/components/MatchesGrouped";
import { useMatches } from "@/hooks/useMatches";
import styles from "./AdminMatches.module.scss";

export default function AdminMatches() {

  const { matches, loading } = useMatches();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [mode, setMode] = useState("date");
  // create form
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [group, setGroup] = useState("A");
  const [round, setRound] = useState(1);
  const [startTime, setStartTime] = useState("");


  // redirect if not admin
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/", { replace: true });
    }
  }, [adminLoading, isAdmin, navigate]);

  if (adminLoading) {
    return <div style={{ padding: 20 }}>Cargando...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  // CREATE
  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      const start = new Date(startTime);
      const lock = new Date(start.getTime() - 5 * 60 * 1000);

      await createMatch({
        homeTeam,
        awayTeam,
        group,
        round: Number(round),
        startTime: Timestamp.fromDate(start),
        lockTime: Timestamp.fromDate(lock),
        status: "scheduled",
        result: null,
      });

      showToast({
        type: "success",
        message: "Partido creado",
      });

      setHomeTeam("");
      setAwayTeam("");
      setStartTime("");

    } catch (err) {
      showToast({
        type: "error",
        message: "Error creando partido",
      });
    }
  };

  // UPDATE RESULT
  const handleSetResult = async (matchId, homeGoals, awayGoals) => {
    try {
      const result = {
        homeGoals: Number(homeGoals),
        awayGoals: Number(awayGoals),
      };

      // 1. Guardar resultado
      await updateMatch(matchId, {
        result,
        status: "finished",
      });

      await recomputeStandings();
      
      showToast({
        type: "success",
        message: "Resultado cargado",
      });

    } catch (err) {
      showToast({
        type: "error",
        message: "Error cargando resultado",
      });
    }
  };

  return (
    <section className={styles.wrapper}>
      
      {/* HEADER */}
      <div className={styles.header}>
        <h2 className={styles.title}>Crear Partidos</h2>

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

      {/* CREATE FORM */}
      <form onSubmit={handleCreate} className={styles.form}>

      <div className={styles.matchMetadata}>
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
        </div>
        
        <input
          className={styles.input}
          type="datetime-local"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          required
        />
        
        <div className={styles.match}>
          <input
            className={styles.input}
            placeholder="Local"
            value={homeTeam}
            onChange={(e) => setHomeTeam(e.target.value)}
            required
          />

          <input
            className={styles.input}
            placeholder="Visitante"
            value={awayTeam}
            onChange={(e) => setAwayTeam(e.target.value)}
            required
          />
        </div>
        <button className={styles.primaryButton}>
          Crear partido
        </button>
      </form>

      {/* LIST */}
      <MatchesGrouped
        matches={matches}
        mode={mode}
        renderMatch={(m) => (
          <MatchRow
            key={m.id}
            match={m}
            onSetResult={handleSetResult}
          />
        )}
      />
    </section>
  );
}