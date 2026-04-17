export const formatDisplayName = (displayName) => {
  if (!displayName || typeof displayName !== "string") return "";

  const parts = displayName.trim().split(/\s+/);

  // 1 palabra → dejar igual
  if (parts.length === 1) {
    return parts[0];
  }

  // más de 1 palabra
  const [first, ...rest] = parts;

  const initials = rest
    .map((word) => word.charAt(0).toUpperCase() + ".")
    .join(" ");

  return `${first} ${initials}`;
};