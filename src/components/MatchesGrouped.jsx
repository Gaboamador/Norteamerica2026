import { sortMatches, groupMatches, getGroupLabel } from "@/utils/matchesGrouping";
import styles from "./MatchesGrouped.module.scss";

export default function MatchesGrouped({
  matches,
  mode,
  renderMatch,
}) {
  const sorted = sortMatches(matches, mode);
  const grouped = groupMatches(sorted, mode);

  return (
    <div className={styles.wrapper}>
      {Object.entries(grouped).map(([key, groupMatches]) => (
        <section key={key} className={styles.group}>
          
          <h3 className={styles.groupTitle}>
            {getGroupLabel(key, mode, groupMatches)}
          </h3>

          <div className={styles.matches}>
            {groupMatches.map((m) => renderMatch(m))}
          </div>

        </section>
      ))}
    </div>
  );
}