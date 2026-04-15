export const getTimeToLock = (match) => {
  if (!match?.lockTime) return null;

  const now = Date.now();

  const lockTime =
    match.lockTime?.toMillis?.() ??
    new Date(match.lockTime).getTime();

  const diff = lockTime - now;

  if (diff <= 0) return 0;

  return diff;
};

export const formatCountdown = (ms) => {
  if (ms <= 0) return null;

  const totalSeconds = Math.floor(ms / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);

  const seconds = totalSeconds % 60;
  const minutes = totalMinutes % 60;
  const totalHours = Math.floor(totalMinutes / 60);

  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  // 📅 Más de 1 día → "2d 5h"
  if (days >= 1) {
    return `${days}d ${hours}h`;
  }

  // ⏱ Más de 1 hora → "5h 20m"
  if (totalHours >= 1) {
    return `${totalHours}h ${minutes}m`;
  }

  // ⏱ Más de 1 minuto → "15:32"
  if (totalMinutes >= 1) {
    return `${totalMinutes}:${seconds.toString().padStart(2, "0")}`;
  }

  // ⏱ Menos de 1 minuto → "45s"
  return `${seconds}s`;
};