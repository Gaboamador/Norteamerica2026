import { useEffect, useState } from "react";
import { createMatch, getAllMatches, updateMatch, scoreMatch } from "@/services/firebase/firebaseUtils";
import { useToast } from "../context/ToastContext";
import { Timestamp } from "firebase/firestore";
import MatchRow from "@/components/MatchRow";
import MatchesGrouped from "../components/MatchesGrouped";
import { useMatches } from "@/hooks/useMatches";

export default function AdminMatches() {

  const { matches, loading, reload } = useMatches();
  const { showToast } = useToast();
  const [mode, setMode] = useState("date");
  // create form
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [group, setGroup] = useState("A");
  const [round, setRound] = useState(1);
  const [startTime, setStartTime] = useState("");

  useEffect(() => {
    reload();
  }, []);

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

      await updateMatch(matchId, {
        result,
        status: "finished",
      });

      // 🔥 calcular puntos
      await scoreMatch({
        id: matchId,
        result,
      });

      showToast({
        type: "success",
        message: "Resultado cargado y puntos calculados",
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
    <div style={{ padding: 20 }}>
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