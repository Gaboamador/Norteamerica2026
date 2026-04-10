import { useState } from "react";
import { updateMatch } from "@/services/firebase/firebaseUtils";
import { useToast } from "../context/ToastContext";
import { Timestamp } from "firebase/firestore";

export default function MatchRow({ match, onSetResult }) {
    const [editing, setEditing] = useState(false);
    const { showToast } = useToast();
    const [homeTeam, setHomeTeam] = useState(match.homeTeam);
    const [awayTeam, setAwayTeam] = useState(match.awayTeam);
    const [group, setGroup] = useState(match.group || "");
    const [round, setRound] = useState(match.round || 1);
    const formatLocalDateTime = (date) => {
        const pad = (n) => String(n).padStart(2, "0");
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };
    
    const [startTime, setStartTime] = useState(
        match.startTime
        ? formatLocalDateTime(match.startTime.toDate())
        : ""
    );

  const [homeGoals, setHomeGoals] = useState("");
  const [awayGoals, setAwayGoals] = useState("");

    const handleSave = async () => {
    try {
        const start = new Date(startTime);
        const lock = new Date(start.getTime() - 5 * 60 * 1000);

        await updateMatch(match.id, {
        homeTeam,
        awayTeam,
        group,
        round: Number(round),
        startTime: Timestamp.fromDate(start),
        lockTime: Timestamp.fromDate(lock),
        });

        setEditing(false);

        showToast({
        type: "success",
        message: "Partido actualizado",
        });

    } catch (err) {
        showToast({
        type: "error",
        message: "Error actualizando partido",
        });
    }
    };

  return (
    <div style={{ border: "1px solid #ccc", padding: 10, marginBottom: 10 }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: 8 }}>
        [{match.group || "-"} | Fecha {match.round || "-"}]
      </div>

      {/* VIEW MODE */}
      {!editing ? (
        <>
          <div>
            {match.homeTeam} vs {match.awayTeam}
          </div>

          <div>Estado: {match.status}</div>

          <div>Horario: {match.startTime ? match.startTime.toDate().toLocaleString() : "-"}</div>

          {match.result && (
            <div>
              Resultado: {match.result.homeGoals} -{" "}
              {match.result.awayGoals}
            </div>
          )}

          <button onClick={() => setEditing(true)}>
            Editar
          </button>
        </>
      ) : (
        <>
          {/* EDIT MODE */}

          <input
            value={homeTeam}
            onChange={(e) => setHomeTeam(e.target.value)}
            placeholder="Local"
          />

          <input
            value={awayTeam}
            onChange={(e) => setAwayTeam(e.target.value)}
            placeholder="Visitante"
          />

          <input
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            placeholder="Grupo"
            style={{ width: 60 }}
          />

          <input
            type="number"
            value={round}
            onChange={(e) => setRound(e.target.value)}
            placeholder="Fecha"
            style={{ width: 60 }}
          />

          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />

          <div style={{ marginTop: 8 }}>
            <button onClick={handleSave}>Guardar</button>
            <button onClick={() => setEditing(false)}>
              Cancelar
            </button>
          </div>
        </>
      )}

      {/* RESULT SECTION */}
      <div style={{ marginTop: 10 }}>
        <input
          type="number"
          placeholder="Local"
          value={homeGoals}
          onChange={(e) => setHomeGoals(e.target.value)}
          style={{ width: 50 }}
        />

        <input
          type="number"
          placeholder="Visitante"
          value={awayGoals}
          onChange={(e) => setAwayGoals(e.target.value)}
          style={{ width: 50 }}
        />

        <button
          onClick={() =>
            onSetResult(match.id, homeGoals, awayGoals)
          }
        >
          Cargar resultado
        </button>
      </div>
    </div>
  );
}