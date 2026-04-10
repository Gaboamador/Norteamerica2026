import { useState } from "react";
import { useMatches } from "@/hooks/useMatches";
import MatchCard from "@/components/MatchCard";
import MatchesGrouped from "@/components/MatchesGrouped";

export default function MatchesScreen() {
  const { matches, loading } = useMatches();
  const [mode, setMode] = useState("date"); // "date" | "group"

  if (loading) return <div>Cargando partidos...</div>;

  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <button onClick={() => setMode("date")}>Por fecha</button>
        <button onClick={() => setMode("group")}>Por grupo</button>
      </div>

      <MatchesGrouped
        matches={matches}
        mode={mode}
        renderMatch={(m) => <MatchCard key={m.id} match={m} />}
      />
    </div>
  );
}