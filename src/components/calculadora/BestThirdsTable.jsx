import { getTeamFlagSrc, handleFlagImageError } from "@/utils/flagUtils";
import ManualTiebreakerControl from "./ManualTiebreakerControl";
import styles from "./BestThirdsTable.module.scss";

function getRankingLabel(row) {
  if (row.rankingStatus === "manual") return "Manual";
  if (row.unresolvedTiebreaker) return "Pendiente";
  if (row.sourceGroupUnresolved) return "Grupo pendiente";

  return null;
}

export default function BestThirdsTable({
  rows,
  onChangeRank,
  onClearGroup,
}) {
  if (!rows.length) {
    return (
      <section className={styles.card}>
        <h2 className={styles.title}>Mejores terceros</h2>
        <p className={styles.empty}>
          La tabla de terceros se va a mostrar cuando haya datos suficientes.
        </p>
      </section>
    );
  }

  return (
    <section className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Mejores terceros</h2>
            <p className={styles.description}>
              Clasifican los ocho mejores equipos ubicados terceros en sus
              grupos.
            </p>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Pos</th>
                <th>Equipo</th>
                <th>Grupo</th>
                <th>Pts</th>
                <th>PJ</th>
                <th>GF</th>
                <th>GC</th>
                <th>DG</th>
                <th>Estado</th>
                <th>Desempate</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => {
                const rankingLabel = getRankingLabel(row);

                return (
                  <tr
                    key={row.teamKey}
                    className={
                      row.bestThirdStatus === "qualified"
                        ? styles.qualified
                        : styles.eliminated
                    }
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

                    <td>{row.group}</td>
                    <td className={styles.points}>{row.points}</td>
                    <td>{row.played}</td>
                    <td>{row.goalsFor}</td>
                    <td>{row.goalsAgainst}</td>
                    <td>{row.goalDifference}</td>

                    <td>
                      <span
                        className={`${styles.statusBadge} ${
                          row.bestThirdStatus === "qualified"
                            ? styles.statusQualified
                            : styles.statusEliminated
                        }`}
                      >
                        {row.bestThirdStatus === "qualified"
                          ? "Clasifica"
                          : "Eliminado"}
                      </span>
                    </td>

                    <td>
                      {rankingLabel ? (
                        <span
                          className={`${styles.tieBadge} ${
                            row.rankingStatus === "manual"
                              ? styles.manual
                              : styles.pending
                          }`}
                        >
                          {rankingLabel}
                        </span>
                      ) : (
                        <span className={styles.dash}>-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className={styles.note}>
          El orden automático usa puntos, diferencia de gol y goles a favor.
          Si el desempate llega a fair play / ranking FIFA, se resuelve
          manualmente en la simulación.
        </p>
      </div>

      <ManualTiebreakerControl
        rows={rows}
        onChangeRank={onChangeRank}
        onClearGroup={onClearGroup}
        title="Desempate manual entre terceros"
        description="El orden de mejores terceros llegó a criterios de fair play / ranking FIFA. Definí manualmente esas posiciones para continuar la simulación."
      />
    </section>
  );
}