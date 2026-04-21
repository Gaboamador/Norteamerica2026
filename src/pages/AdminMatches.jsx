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
import { motion, AnimatePresence } from "framer-motion";
import MatchRow from "@/components/MatchRow";
import MatchesGrouped from "@/components/MatchesGrouped";
import { useMatches } from "@/hooks/useMatches";
import { ROUND_OPTIONS } from "@/utils/matchRounds";
import { isGroupStageRound, getRoundLabel } from "@/utils/matchRounds";
import styles from "./AdminMatches.module.scss";
import { IoIosAddCircleOutline } from "react-icons/io";


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
  const [createOpen, setCreateOpen] = useState(false);
  const isKnockout = !isGroupStageRound(round);


  // redirect if not admin
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/", { replace: true });
    }
  }, [adminLoading, isAdmin, navigate]);

  useEffect(() => {
    if (isKnockout) {
      setGroup("");
    }
  }, [round]);

  useEffect(() => {
    if (isKnockout) {
      setGroup("");
    }
  }, [isKnockout]);

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
      // setStartTime("");

    } catch (err) {
      showToast({
        type: "error",
        message: "Error creando partido",
      });
    }
  };

  // UPDATE RESULTf
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
        <div className={styles.selector}>
          <span>Ver</span>
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
          <button
            onClick={() => setMode("round")}
            className={`${styles.selectorButton} ${
              mode === "round" ? styles.active : ""
            }`}
          >
            Por fase
          </button>
        </div>
      </div>

<div>
        <div
          className={styles.titleRow}
          onClick={() => setCreateOpen((v) => !v)}
        >
          <div className={styles.title}>
            <IoIosAddCircleOutline/>
          </div>
        </div>

      {/* CREATE FORM */}
      <AnimatePresence initial={false}>
      {createOpen && (
        <motion.div
          key="create-form"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          style={{ overflow: "hidden" }}
        >
        <form onSubmit={handleCreate} className={styles.form}>
        <div className={styles.title}>Crear Partido</div>
        <div className={styles.matchMetadata}>
          {!isKnockout && 
          <select
            className={styles.selectSmall}
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            disabled={isKnockout}
          >
            {"ABCDEFGHIJKL".split("").map((g) => (
                <option key={g} value={g}>
                  Grupo {g}
                </option>
              ))
            }
          </select>
          }
            <select
              className={styles.selectSmall}
              value={round}
              onChange={(e) => setRound(Number(e.target.value))}
            >
              {ROUND_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
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
      </motion.div>
      )}
      </AnimatePresence>
    </div>

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