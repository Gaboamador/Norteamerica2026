import { getTeamFlagSrc, handleFlagImageError } from "@/utils/flagUtils";
import styles from "./GroupStandingsTable.module.scss";

function getRankingLabel(row) {
  if (row.rankingStatus === "manual") return "=";
  if (row.unresolvedTiebreaker) return "P";
  return null;
}

export default function GroupStandingsTable({ rows }) {
  if (!rows.length) {
    return (
      <div className={styles.empty}>
        La tabla se va a mostrar cuando haya equipos cargados en el grupo.
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Tabla</h3>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Pos</th>
              <th>Equipo</th>
              <th>Pts</th>
              <th>PJ</th>
              <th>PG</th>
              <th>PE</th>
              <th>PP</th>
              <th>GF</th>
              <th>GC</th>
              <th>DG</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => {
              const rankingLabel = getRankingLabel(row);

              return (
                <tr
                  key={row.team}
                  className={row.unresolvedTiebreaker ? styles.unresolved : ""}
                >
                  <td>{row.position}</td>

                  <td>
                    <div className={styles.team}>
                      <img
                        className={styles.flag}
                        src={getTeamFlagSrc(row.team)}
                        alt=""
                        onError={handleFlagImageError}
                      />
                      <span>{row.team}</span>
                    </div>
                  </td>

                  <td className={styles.points}>{row.points}</td>
                  <td>{row.played}</td>
                  <td>{row.won}</td>
                  <td>{row.drawn}</td>
                  <td>{row.lost}</td>
                  <td>{row.goalsFor}</td>
                  <td>{row.goalsAgainst}</td>
                  <td>{row.goalDifference}</td>

                  <td>
                    {rankingLabel ? (
                      <span
                        className={`${styles.statusBadge} ${
                          row.rankingStatus === "manual"
                            ? styles.manual
                            : styles.pending
                        }`}
                      >
                        {rankingLabel}
                      </span>
                    ) : (
                      <span className={styles.dash}></span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className={styles.note}>
        El orden aplica desempates reglamentarios por resultados. Si el empate
        llega a fair play / ranking FIFA, la calculadora pide resolución manual.
      </p>
    </div>
  );
}