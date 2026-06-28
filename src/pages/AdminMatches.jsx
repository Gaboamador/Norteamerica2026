import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "../hooks/useAdmin";
import { createMatch, setOfficialMatchResult } from "@/services/firebase/firebaseUtils";
import { recomputeStandings } from "@/services/firebase/standingsService";
import { refreshMatchesMetaSafely } from "@/services/firebase/firebaseMatchesMeta";
import { publishLockedPredictions } from "@/services/firebase/firebaseLockedPredictions";
import { useToast } from "@/context/ToastContext";
import { Timestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import MatchRow from "@/components/MatchRow";
import MatchesGrouped from "@/components/MatchesGrouped";
import MatchChannelsBatchEditor from "@/components/admin/MatchChannelsBatchEditor";
import MatchCodesBatchEditor from "@/components/admin/MatchCodesBatchEditor";
import { useMatches } from "@/hooks/useMatches";
import { ROUND_OPTIONS } from "@/utils/matchRounds";
import { isGroupStageRound } from "@/utils/matchRounds";
import styles from "./AdminMatches.module.scss";
import { IoIosAddCircleOutline, IoIosRemoveCircleOutline } from "react-icons/io";
import { PiHashStraight, PiTelevisionSimple } from "react-icons/pi";


export default function AdminMatches() {

  const { matches, loading } = useMatches();
  const { isAdmin, canCreateMatches, loading: adminLoading } = useAdmin();
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
  const [channelsOpen, setChannelsOpen] = useState(false);
  const [codesOpen, setCodesOpen] = useState(false);
  const [publishingLockedPredictions, setPublishingLockedPredictions] = useState(false);
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

// UPDATE RESULT
const handleSetResult = async (
  matchId,
  homeGoals,
  awayGoals,
  winnerSide = null
) => {
  try {
    const match = matches.find((item) => item.id === matchId);
    const matchIsKnockout = match ? !isGroupStageRound(match.round) : false;

    const rawHomeGoals = String(homeGoals).trim();
    const rawAwayGoals = String(awayGoals).trim();

    if (rawHomeGoals === "" || rawAwayGoals === "") {
      showToast({
        type: "error",
        message: "Cargá ambos goles antes de guardar el resultado",
      });
      return;
    }

    const parsedHomeGoals = Number(rawHomeGoals);
    const parsedAwayGoals = Number(rawAwayGoals);

    if (
      !Number.isInteger(parsedHomeGoals) ||
      !Number.isInteger(parsedAwayGoals) ||
      parsedHomeGoals < 0 ||
      parsedAwayGoals < 0 ||
      parsedHomeGoals > 20 ||
      parsedAwayGoals > 20
    ) {
      showToast({
        type: "error",
        message: "El resultado debe tener goles enteros entre 0 y 20",
      });
      return;
    }

    const resultIsDraw = parsedHomeGoals === parsedAwayGoals;
    const normalizedWinnerSide =
      winnerSide === "home" || winnerSide === "away" ? winnerSide : null;

    if (matchIsKnockout && resultIsDraw && !normalizedWinnerSide) {
      showToast({
        type: "error",
        message: "Elegí el ganador del cruce antes de guardar el empate",
      });
      return;
    }

    const result = {
      homeGoals: parsedHomeGoals,
      awayGoals: parsedAwayGoals,
    };

    await setOfficialMatchResult(
      matchId,
      result,
      matchIsKnockout && resultIsDraw ? normalizedWinnerSide : null
    );

    await recomputeStandings();

    await refreshMatchesMetaSafely("carga de resultado oficial");

    showToast({
      type: "success",
      message: "Resultado cargado",
    });

  } catch (err) {
    console.error("Error cargando resultado", err);

    showToast({
      type: "error",
      message: "Error cargando resultado",
    });
  }
};

// PUBLISH LOCKED PREDICTIONS
const handlePublishLockedPredictions = async () => {
  try {
    setPublishingLockedPredictions(true);

    const result = await publishLockedPredictions();

    if (result.newMatchCount === 0) {
      showToast({
        type: "info",
        message: "No hay partidos bloqueados nuevos para publicar",
      });
      return;
    }

    showToast({
      type: "success",
      message: `Pronósticos publicados: ${result.newMatchCount} partido(s), ${result.groupCount} grupo(s)`,
    });
  } catch (err) {
    console.error("Error publicando pronósticos bloqueados", err);

    showToast({
      type: "error",
      message: "Error publicando pronósticos bloqueados",
    });
  } finally {
    setPublishingLockedPredictions(false);
  }
};

  return (
    <section className={styles.wrapper}>
      <div className={styles.title}>Administrar Partidos</div>
    {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.selector}>
          <span>Ver:</span>
          <button
            onClick={() => setMode("date")}
            className={`button button--primary button--small ${
              mode === "date" ? styles.active : ""
            }`}
          >
            Por fecha
          </button>

          <button
            onClick={() => setMode("group")}
            className={`button button--primary button--small ${
              mode === "group" ? styles.active : ""
            }`}
          >
            Por grupo
          </button>

          <button
            onClick={() => setMode("round")}
            className={`button button--primary button--small ${
              mode === "round" ? styles.active : ""
            }`}
          >
            Por fase
          </button>
        </div>

        <button
          type="button"
          className="button button--warning button--small"
          onClick={handlePublishLockedPredictions}
          disabled={publishingLockedPredictions}
        >
          {publishingLockedPredictions
            ? "Publicando..."
            : "Publicar pronósticos bloqueados"}
        </button>
      </div>

      {/* CREATE FORM */}
      {canCreateMatches && (
      <>
        <div className={styles.titleRow}>
          <button
            type="button"
            className={styles.titleIconButton}
            onClick={() => setCreateOpen((v) => !v)}
            title={createOpen ? "Ocultar creación de partido" : "Crear partido"}
            aria-expanded={createOpen}
          >
            {createOpen ? <IoIosRemoveCircleOutline /> : <IoIosAddCircleOutline />}
          </button>

          <button
            type="button"
            className={styles.titleIconButton}
            onClick={() => setChannelsOpen((v) => !v)}
            title={channelsOpen ? "Ocultar editor de canales" : "Editar canales"}
            aria-expanded={channelsOpen}
          >
            <PiTelevisionSimple />
          </button>

          <button
            type="button"
            className={styles.titleIconButton}
            onClick={() => setCodesOpen((v) => !v)}
            title={
              codesOpen
                ? "Ocultar editor de códigos de partido"
                : "Editar códigos de partido"
            }
            aria-expanded={codesOpen}
          >
            <PiHashStraight />
          </button>
        </div>

        <AnimatePresence initial={false}>
          {channelsOpen && (
            <motion.div
              key="channels-editor"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              style={{ overflow: "hidden" }}
            >
              <MatchChannelsBatchEditor matches={matches} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {codesOpen && (
            <motion.div
              key="codes-editor"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              style={{ overflow: "hidden" }}
            >
              <MatchCodesBatchEditor matches={matches} />
            </motion.div>
          )}
        </AnimatePresence>

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
          <div className={styles.titleCrearPartido}>Crear Partido</div>
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
            <button className={`button button--success`}>
              Crear partido
            </button>
          </form>
        </motion.div>
        )}
        </AnimatePresence>
        </>
        )}

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
        userMode={false}
      />
    </section>
  );
}