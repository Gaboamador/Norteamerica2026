import { sortMatches, groupMatches, getGroupLabel } from "@/utils/matchesGrouping";

export default function MatchesGrouped({
  matches,
  mode,
  renderMatch,
}) {
  const sorted = sortMatches(matches, mode);
  const grouped = groupMatches(sorted, mode);

  return (
    <div>
      {Object.entries(grouped).map(([key, groupMatches]) => (
        <div key={key} style={{ marginBottom: 20 }}>
          <h3>{getGroupLabel(key, mode, groupMatches)}</h3>

          {groupMatches.map((m) => renderMatch(m))}
        </div>
      ))}
    </div>
  );
}