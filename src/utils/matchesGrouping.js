import { getRoundLabel } from "./matchRounds";

const DATE_BUCKET_ORDER = [
  "date-finished",
  "date-soon",
  "date-this-week",
  "date-next-week",
  "date-later",
];

const getDateBucket = (match) => {
  const start = match.startTime.toDate();
  const now = new Date();

  if (match.result) {
    return "date-finished";
  }

  const in48Hours = new Date(now);
  in48Hours.setHours(now.getHours() + 48);

  const in7Days = new Date(now);
  in7Days.setDate(now.getDate() + 7);

  const in14Days = new Date(now);
  in14Days.setDate(now.getDate() + 14);

  if (start < in48Hours) {
    return "date-soon";
  }

  if (start < in7Days) {
    return "date-this-week";
  }

  if (start < in14Days) {
    return "date-next-week";
  }

  return "date-later";
};

export const sortMatches = (matches, mode = "date") => {
  return [...matches].sort((a, b) => {
    const dateA = a.startTime.toDate();
    const dateB = b.startTime.toDate();

    const dayA = new Date(dateA.getFullYear(), dateA.getMonth(), dateA.getDate());
    const dayB = new Date(dateB.getFullYear(), dateB.getMonth(), dateB.getDate());

    // ===============================
    // GROUP MODE
    // ===============================
    if (mode === "group") {
      if (a.group !== b.group) {
        return a.group.localeCompare(b.group);
      }

      return dateA - dateB; // fecha + hora
    }

    // ===============================
    // ROUND MODE
    // ===============================
    if (mode === "round") {
      if (a.round !== b.round) {
        return a.round - b.round;
      }

      // fecha completa (incluye hora)
      if (dateA - dateB !== 0) {
        return dateA - dateB;
      }

      // desempate final por grupo
      return a.group.localeCompare(b.group);
    }

    // ===============================
    // DATE MODE
    // ===============================
    // 1. día
    if (dayA - dayB !== 0) {
      return dayA - dayB;
    }

    // 2. hora
    if (dateA - dateB !== 0) {
      return dateA - dateB;
    }

    // 3. grupo
    return a.group.localeCompare(b.group);
  });
};

export const groupMatches = (matches, mode = "date") => {
  const groups = {};

  matches.forEach((m) => {
    let key;

    // if (mode === "group") {
    //   if (m.round <= 3) {
    //     key = `group-${m.group}`;
    //   } else {
    //     key = `round-${m.round}`;
    //   }
    // }
    if (mode === "group") {
      if (m.round > 3) {
        return;
      }
      key = `group-${m.group}`;
    }
    else if (mode === "round") {
      key = `round-${m.round}`;
    } 
    else {
      // const d = m.startTime.toDate();
      // key = `date-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      key = getDateBucket(m);
    }

    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(m);
  });

  // ===============================
  // ORDENAR GRUPOS
  // ===============================

const sortedEntries = Object.entries(groups).sort(([keyA], [keyB]) => {

  if (mode === "date") {
    return DATE_BUCKET_ORDER.indexOf(keyA) - DATE_BUCKET_ORDER.indexOf(keyB);
  }

  const isGroupA = keyA.startsWith("group-");
  const isGroupB = keyB.startsWith("group-");

  // primero todos los grupos
  if (isGroupA && !isGroupB) return -1;
  if (!isGroupA && isGroupB) return 1;

  // ambos grupos → orden alfabético
  if (isGroupA && isGroupB) {
    const groupA = keyA.replace("group-", "");
    const groupB = keyB.replace("group-", "");
    return groupA.localeCompare(groupB);
  }

  // ambos rounds → orden numérico
  const roundA = Number(keyA.replace("round-", ""));
  const roundB = Number(keyB.replace("round-", ""));
  return roundA - roundB;
});

  // reconstruir objeto ordenado
  return Object.fromEntries(sortedEntries);
};

export const getGroupLabel = (key, mode, matches) => {
  if (mode === "group") {
    if (key.startsWith("group-")) {
      const group = key.replace("group-", "");
      return `Grupo ${group}`;
    }

    if (key.startsWith("round-")) {
      const round = Number(key.replace("round-", ""));
      return getRoundLabel(round);
    }
  }

  if (mode === "round") {
    const round = Number(key.replace("round-", ""));

    // fase de grupos
    if (round <= 3) {
      return `Fecha ${round}`;
    }

    // eliminatorias
    const roundMap = {
      4: "Dieciseisavos de final",
      5: "Octavos de final",
      6: "Cuartos de final",
      7: "Semifinal",
      8: "Partido por el tercer puesto",
      9: "Final",
    };

    return roundMap[round] || `Ronda ${round}`;
  }

  // mode === "date"
  // const firstMatch = matches[0];
  // const date = firstMatch.startTime.toDate();

  // return date.toLocaleDateString("es-AR", {
  //   day: "2-digit",
  //   month: "2-digit",
  //   year: "numeric",
  // });

  // ===============================
  // DATE MODE
  // ===============================
  const count = matches.length;

  const dateLabels = {
    "date-soon": "Próximas 48hs",
    "date-this-week": "En los próximos días",
    "date-next-week": "En más de una semana",
    "date-later": "Más adelante",
    "date-finished": "Ya jugados",
  };

  const label = dateLabels[key] || "Partidos";

  return `${label} · ${count} ${count === 1 ? "partido" : "partidos"}`;

};