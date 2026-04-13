import React, { useState, useMemo } from "react";
import { useGroupStandings } from "../hooks/useGroupStandings";
import { useUserGroups } from "../hooks/useUserGroups";
import { useMultiGroupStandings } from "../hooks/useMultiGroupStandings";
import { mergeStandings } from "../utils/mergeStandings";

const TablaPosiciones = () => {
  const groups = useUserGroups();

  // 🔥 selector: "all" = unificada
  const [selected, setSelected] = useState("all");

  // 🔥 memo para evitar loops
  const groupIds = useMemo(
    () => groups.map((g) => g.id),
    [groups]
  );

  // 🔥 todas las tablas de los grupos
  const multiTables = useMultiGroupStandings(groupIds);

  // 🔥 tabla unificada
  const unifiedTable = useMemo(
    () => mergeStandings(multiTables),
    [multiTables]
  );

  // 🔥 tabla de grupo individual
  const groupTable = useGroupStandings(
    selected === "all" ? null : selected
  );

  // 🔥 tabla final
  const table =
    selected === "all" ? unifiedTable : groupTable;

  return (
    <div>
      <h2>Tabla de posiciones</h2>

      {/* SELECTOR */}
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => setSelected("all")}
          style={{
            fontWeight: selected === "all" ? "bold" : "normal",
          }}
        >
          Mis grupos
        </button>

        {groups.map((g) => (
          <button
            key={g.id}
            onClick={() => setSelected(g.id)}
            style={{
              marginLeft: 10,
              fontWeight: selected === g.id ? "bold" : "normal",
            }}
          >
            {g.name}
          </button>
        ))}
      </div>

      {/* TABLA */}
      <div>
        {table.map((u) => (
          <div key={u.uid}>
            #{u.position} - {u.displayName} - {u.points} pts
          </div>
        ))}
      </div>
    </div>
  );
};

export default TablaPosiciones;