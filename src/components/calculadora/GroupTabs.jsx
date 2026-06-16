import { useMemo } from "react";
import { getTeamFlagSrc, handleFlagImageError } from "@/utils/flagUtils";
import styles from "./GroupTabs.module.scss";

function getTeamsByGroup(matches = []) {
  return matches.reduce((acc, match) => {
    if (!match.group) return acc;

    if (!acc[match.group]) {
      acc[match.group] = [];
    }

    [match.homeTeam, match.awayTeam].forEach((team) => {
      if (team && !acc[match.group].includes(team)) {
        acc[match.group].push(team);
      }
    });

    return acc;
  }, {});
}

export default function GroupTabs({
  groups,
  selectedGroup,
  onSelectGroup,
  matches = [],
}) {
  const teamsByGroup = useMemo(() => getTeamsByGroup(matches), [matches]);

  return (
    <div className={styles.tabs} role="tablist" aria-label="Grupos">
      {groups.map((group) => {
        const teams = teamsByGroup[group] ?? [];

        return (
          <button
            key={group}
            type="button"
            className={`${styles.tab} ${
              selectedGroup === group ? styles.active : ""
            }`}
            onClick={() => onSelectGroup(group)}
            title={
              teams.length
                ? `Grupo ${group}: ${teams.join(", ")}`
                : `Grupo ${group}`
            }
          >
            <span className={styles.label}>Grupo {group}</span>

            {teams.length > 0 && (
              <span className={styles.flags} aria-hidden="true">
                {teams.slice(0, 4).map((team) => (
                  <span key={team} className={styles.flagSlot}>
                    <img
                      className={styles.flag}
                      src={getTeamFlagSrc(team)}
                      alt=""
                      onError={handleFlagImageError}
                    />
                  </span>
                ))}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}