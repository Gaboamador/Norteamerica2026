import { NATIONAL_TEAMS } from "@/utils/teams";

export default function TeamSelect({ value, onChange, className }) {
  const isKnownTeam = NATIONAL_TEAMS.some((team) => team.name === value);
  const hasCustomValue = value && !isKnownTeam;

  return (
    <select
      className={className}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Seleccionar selección</option>

      {hasCustomValue && (
        <option value={value}>
          {value} — valor actual
        </option>
      )}

      {NATIONAL_TEAMS.map((team) => (
        <option key={team.flagCode} value={team.name}>
          {team.name}
        </option>
      ))}
    </select>
  );
}