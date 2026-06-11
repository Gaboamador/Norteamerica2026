import { getTeamFlagSrc, handleFlagImageError } from "@/utils/flagUtils";
import styles from "./ManualTiebreakerControl.module.scss";

function getRowKey(row) {
  return row?.teamKey ?? row?.team ?? row?.id ?? "";
}

function hasAnyPlayedMatch(rows) {
  if (!Array.isArray(rows)) return false;

  return rows.some((row) => Number(row?.played ?? 0) > 0);
}

function shouldShowRowInManualControl(row) {
  return (
    !!row?.unresolvedGroupId &&
    (row?.unresolvedTiebreaker || row?.rankingStatus === "manual")
  );
}

function getUnresolvedGroups(rows) {
  if (!Array.isArray(rows) || !rows.length) return [];

  const groups = new Map();

  rows.filter(shouldShowRowInManualControl).forEach((row) => {
    const unresolvedGroupId = row.unresolvedGroupId;

    if (!groups.has(unresolvedGroupId)) {
      groups.set(unresolvedGroupId, []);
    }

    groups.get(unresolvedGroupId).push(row);
  });

  return Array.from(groups.entries()).map(([unresolvedGroupId, groupRows]) => {
    const positions = Array.from(
      new Set(
        groupRows
          .map((row) => Number(row?.position))
          .filter((position) => Number.isFinite(position))
      )
    ).sort((a, b) => a - b);

    return {
      unresolvedGroupId,
      rows: [...groupRows].sort((a, b) => {
        const aRank = Number(a?.manualTiebreakRank ?? a?.position ?? 0);
        const bRank = Number(b?.manualTiebreakRank ?? b?.position ?? 0);

        return aRank - bRank;
      }),
      positions,
      isResolvedManually: groupRows.every(
        (row) => row?.rankingStatus === "manual"
      ),
    };
  });
}

function hasDuplicateManualRanks(rows) {
  if (!Array.isArray(rows)) return false;

  const ranks = rows
    .map((row) => row?.manualTiebreakRank)
    .filter((rank) => rank !== null && rank !== undefined && rank !== "");

  return new Set(ranks.map(Number)).size !== ranks.length;
}

export default function ManualTiebreakerControl({
  rows = [],
  onChangeRank,
  onClearGroup,
  title = "Desempate manual requerido",
  description = "El cálculo llegó a criterios de fair play / ranking FIFA. Como esos datos no están cargados, definí manualmente el orden para continuar la simulación.",
  manualControlEnabled,
}) {
  const safeRows = Array.isArray(rows) ? rows : [];

  const canShowManualControl =
    manualControlEnabled ?? hasAnyPlayedMatch(safeRows);

  const unresolvedGroups = canShowManualControl
    ? getUnresolvedGroups(safeRows)
    : [];

  if (!unresolvedGroups.length) return null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
      </div>

      <div className={styles.groups}>
        {unresolvedGroups.map(
          ({
            unresolvedGroupId,
            rows: groupRows,
            positions,
            isResolvedManually,
          }) => {
            const duplicatedRanks = hasDuplicateManualRanks(groupRows);

            return (
              <div key={unresolvedGroupId} className={styles.group}>
                <div className={styles.groupHeader}>
                  <span className={styles.groupTitle}>
                    {isResolvedManually
                      ? `Orden manual ${positions.join(" / ")}`
                      : `Posiciones ${positions.join(" / ")}`}
                  </span>

                  <button
                    type="button"
                    className={styles.clearButton}
                    onClick={() => onClearGroup?.(unresolvedGroupId)}
                  >
                    Limpiar
                  </button>
                </div>

                <div className={styles.rows}>
                  {groupRows.map((row, index) => {
                    const rowKey = getRowKey(row) || `${unresolvedGroupId}-${index}`;
                    const team = row?.team ?? "";

                    return (
                      <label key={rowKey} className={styles.row}>
                        <span className={styles.team}>
                          <img
                            className={styles.flag}
                            src={getTeamFlagSrc(team)}
                            alt=""
                            onError={handleFlagImageError}
                          />

                          <span>
                            {team}

                            {row?.group ? (
                              <small className={styles.groupLabel}>
                                Grupo {row.group}
                              </small>
                            ) : null}
                          </span>
                        </span>

                        <select
                          className={styles.select}
                          value={row?.manualTiebreakRank ?? ""}
                          onChange={(event) =>
                            onChangeRank?.(
                              unresolvedGroupId,
                              getRowKey(row),
                              event.target.value
                            )
                          }
                        >
                          <option value="">Elegir</option>

                          {positions.map((position) => (
                            <option key={position} value={position}>
                              {position}
                            </option>
                          ))}
                        </select>
                      </label>
                    );
                  })}
                </div>

                {duplicatedRanks && (
                  <p className={styles.warning}>
                    No puede haber dos equipos con la misma posición manual.
                  </p>
                )}

                {isResolvedManually && (
                  <p className={styles.resolvedHint}>
                    Este desempate ya fue resuelto manualmente. Podés modificar
                    el orden desde estos selectores o limpiar la asignación.
                  </p>
                )}
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}