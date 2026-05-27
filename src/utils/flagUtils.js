import { NATIONAL_TEAMS } from "@/utils/teams";

function normalizeTeamName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const TEAM_FLAG_MAP = Object.fromEntries(
  NATIONAL_TEAMS.map((team) => [
    normalizeTeamName(team.name),
    team.flagCode,
  ])
);

export function getTeamFlagCode(teamName) {
  const normalized = normalizeTeamName(teamName);
  return TEAM_FLAG_MAP[normalized] ?? null;
}

export function getTeamFlagSrc(teamName) {
  const code = getTeamFlagCode(teamName);
  return code ? `/flags/${code}.png` : "/flags/fallback.png";
}

export function handleFlagImageError(e) {
  e.currentTarget.src = "/flags/fallback.png";
}