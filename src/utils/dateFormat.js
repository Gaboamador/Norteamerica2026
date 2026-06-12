export const formatMatchDate = (date) => {
  const d = date instanceof Date ? date : date.toDate();

  const weekday = d.toLocaleDateString("es-AR", {
    weekday: "long",
  });

  const dayMonth = d.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "numeric",
  });

  const time = d.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return `${weekday} ${dayMonth}, ${time}`;
};