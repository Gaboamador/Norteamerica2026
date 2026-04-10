export const sortMatches = (matches, mode = "date") => {
  return [...matches].sort((a, b) => {
    if (mode === "group") {
      // grupo primero
      if (a.group !== b.group) {
        return a.group.localeCompare(b.group);
      }

      // después fecha
      if (a.round !== b.round) {
        return a.round - b.round;
      }

      return a.startTime.toDate() - b.startTime.toDate();
    }

    // mode === "date"
    const dateA = a.startTime.toDate();
    const dateB = b.startTime.toDate();

    if (dateA.toDateString() !== dateB.toDateString()) {
      return dateA - dateB;
    }

    if (a.group !== b.group) {
      return a.group.localeCompare(b.group);
    }

    return dateA - dateB;
  });
};

export const groupMatches = (matches, mode = "date") => {
  const groups = {};

  matches.forEach((m) => {
    let key;

    if (mode === "group") {
      key = `group-${m.group}`;
    } else {
      const d = m.startTime.toDate();
      key = `date-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }

    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(m);
  });

  return groups;
};

export const getGroupLabel = (key, mode, matches) => {
  if (mode === "group") {
    const group = key.replace("group-", "");
    return `Grupo ${group}`;
  }

  const firstMatch = matches[0];
  const date = firstMatch.startTime.toDate();

  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};