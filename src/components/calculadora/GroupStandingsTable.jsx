import { getTeamFlagSrc, handleFlagImageError } from "@/utils/flagUtils";
import { PiHandPalmBold, PiApproximateEqualsBold } from "react-icons/pi";
import { TiEquals } from "react-icons/ti";
import styles from "./GroupStandingsTable.module.scss";

function hasEveryTeamPlayedAtLeastOnce(rows) {
  return (
    Array.isArray(rows) &&
    rows.length > 0 &&
    rows.every((row) => Number(row?.played ?? 0) > 0)
  );
}

function getRankingLabel(row, canShowTiebreakerStatus) {
  if (!canShowTiebreakerStatus) return null;

  if (row?.rankingStatus === "manual") return "manual";
  if (row?.unresolvedTiebreaker) return "pendiente";

  return null;
}

export default function GroupStandingsTable({ rows = [] }) {
  const safeRows = Array.isArray(rows) ? rows : [];

  if (!safeRows.length) {
    return (
      <div className={styles.empty}>
        La tabla se va a mostrar cuando haya equipos cargados en el grupo.
      </div>
    );
  }

  const canShowTiebreakerStatus = hasEveryTeamPlayedAtLeastOnce(safeRows);

  return (
    <div className={styles.card}>
      {/* <h3 className={styles.title}>Tabla</h3> */}

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
            {safeRows.map((row, index) => {
              const rankingLabel = getRankingLabel(
                row,
                canShowTiebreakerStatus
              );

              const rowKey = row?.teamKey ?? row?.team ?? `team-${index}`;
              const team = row?.team ?? "";
              const shouldMarkAsUnresolved =
                canShowTiebreakerStatus && row?.unresolvedTiebreaker;

              return (
                <tr
                  key={rowKey}
                  className={shouldMarkAsUnresolved ? styles.unresolved : ""}
                >
                  <td>{row?.position ?? "-"}</td>

                  <td>
                    <div className={styles.team}>
                      <img
                        className={styles.flag}
                        src={getTeamFlagSrc(team)}
                        alt=""
                        onError={handleFlagImageError}
                      />
                      <span>{team || "-"}</span>
                    </div>
                  </td>

                  <td className={styles.points}>{row?.points ?? 0}</td>
                  <td>{row?.played ?? 0}</td>
                  <td>{row?.won ?? 0}</td>
                  <td>{row?.drawn ?? 0}</td>
                  <td>{row?.lost ?? 0}</td>
                  <td>{row?.goalsFor ?? 0}</td>
                  <td>{row?.goalsAgainst ?? 0}</td>
                  <td>{row?.goalDifference ?? 0}</td>

                  <td>
                    {rankingLabel ? (
                      <span
                        className={`${styles.statusBadge} ${
                          row?.rankingStatus === "manual"
                            ? styles.manual
                            : styles.pending
                        }`}
                        title={
                          row?.rankingStatus === "manual"
                            ? "Desempate ajustado manualmente"
                            : "Desempate pendiente"
                        }
                      >
                        {rankingLabel === "manual" ? (
                          <PiHandPalmBold aria-hidden="true" />
                        ) : (
                          <PiApproximateEqualsBold aria-hidden="true" />
                        )}
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
{/* 
      <p className={styles.note}>
        El orden aplica desempates reglamentarios por resultados.
      </p> */}
    </div>
  );
}