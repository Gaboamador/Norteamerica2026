import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "../hooks/useAdmin";
import { getDocs, collection } from "firebase/firestore";
import { db } from "@/services/firebase/firebase";
import { createMatch, updateMatch, scoreMatch, getAllPredictions } from "@/services/firebase/firebaseUtils";
import { saveGlobalStandings, saveGroupStandings } from "@/services/firebase/firebaseStandings";
import { filterStandingsByGroup } from "@/utils/filterStandingsByGroup";
import { useToast } from "@/context/ToastContext";
import { Timestamp } from "firebase/firestore";
import { buildStandings } from "@/utils/buildStandings";
import MatchRow from "@/components/MatchRow";
import MatchesGrouped from "@/components/MatchesGrouped";
import { useMatches } from "@/hooks/useMatches";

export default function AdminMatches() {

  const { matches, loading, reload } = useMatches();
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

      reload();

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

      // 2. Calcular puntos en predictions
      await scoreMatch({
        id: matchId,
        result,
      });

      // 🔥 3. Recalcular standings globales
      const allPredictions = await getAllPredictions();
      const standings = buildStandings(allPredictions);

      // 🔥 4. Guardar standings en Firestore
      await saveGlobalStandings(standings);

      // 🔥 calcular standings por grupo
      const groupsSnap = await getDocs(collection(db, "groups"));
console.log("ALL PREDICTIONS", allPredictions);
console.log("STANDINGS GLOBAL", standings);
      for (const docSnap of groupsSnap.docs) {
        const group = docSnap.data();
        const groupId = docSnap.id;
console.log("GROUP", groupId);
console.log("MEMBERS", group.members);
        const groupStandings = filterStandingsByGroup(
          standings,
          group.members || []
        );
console.log("FILTERED", groupStandings);
        await saveGroupStandings(groupId, groupStandings);
      }

      showToast({
        type: "success",
        message: "Resultado cargado y standings actualizados",
      });

      reload();

    } catch (err) {
      showToast({
        type: "error",
        message: "Error cargando resultado",
      });
    }
  };

  return (
    <div>
      <h2>Admin - Partidos</h2>

      {/* CREATE */}
      <form
        onSubmit={handleCreate}
        style={{ display: "flex", gap: 10, flexWrap: "wrap" }}
      >
        <input
          placeholder="Local"
          value={homeTeam}
          onChange={(e) => setHomeTeam(e.target.value)}
          required
        />

        <input
          placeholder="Visitante"
          value={awayTeam}
          onChange={(e) => setAwayTeam(e.target.value)}
          required
        />

        <input
          placeholder="Grupo"
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          style={{ width: 60 }}
        />

        <input
          type="number"
          placeholder="Fecha"
          value={round}
          onChange={(e) => setRound(e.target.value)}
          style={{ width: 60 }}
        />

        <input
          type="datetime-local"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          required
        />

        <button>Crear</button>
      </form>

      <hr />

      {/* LIST */}
    <div>
      <div style={{ marginBottom: 10 }}>
        <button onClick={() => setMode("date")}>Por fecha</button>
        <button onClick={() => setMode("group")}>Por grupo</button>
      </div>

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
    </div>
    </div>
  );
}