import { getTeamFlagSrc, handleFlagImageError } from "@/utils/flagUtils";
import ManualTiebreakerControl from "./ManualTiebreakerControl";
import styles from "./BestThirdsTable.module.scss";

const THIRD_PLACE_COLUMNS = ["1A", "1B", "1D", "1E", "1G", "1I", "1K", "1L"];

function getRankingLabel(row) {
  if (row?.rankingStatus === "manual") return "Manual";
  if (row?.unresolvedTiebreaker) return "Pendiente";
  if (row?.sourceGroupUnresolved) return "Grupo pendiente";

  return null;
}

function canShowBestThirdsManualControl(rows) {
  if (!Array.isArray(rows)) return false;

  return (
    rows.length === 12 &&
    rows.every((row) => Number(row?.played ?? 0) > 0)
  );
}

function formatGroups(groups = []) {
  if (!Array.isArray(groups) || groups.length === 0) return "-";

  return groups.map((group) => `3${group}`).join(", ");
}

function formatPercentage(value) {
  const number = Number(value ?? 0);

  if (!Number.isFinite(number)) return "0%";

  if (Number.isInteger(number)) return `${number}%`;

  return `${number.toFixed(1)}%`;
}

function getGroupFromThirdSlot(slot) {
  const value = String(slot || "").trim();

  if (!value.startsWith("3")) return "";

  return value.slice(1);
}

function getGroupFromDirectSlot(slot) {
  const value = String(slot || "").trim();

  if (!/^[123][A-L]$/.test(value)) return "";

  return value.slice(1);
}

function getPositionFromDirectSlot(slot) {
  const value = String(slot || "").trim();
  const position = Number(value.charAt(0));

  return Number.isInteger(position) ? position : null;
}

function getDirectSlotRow(slot, groupTablesByGroup) {
  const group = getGroupFromDirectSlot(slot);
  const position = getPositionFromDirectSlot(slot);

  if (!group || !position) return null;

  return groupTablesByGroup?.[group]?.[position - 1] ?? null;
}

function buildThirdRowsByGroup(rows = []) {
  if (!Array.isArray(rows)) return new Map();

  return new Map(
    rows
      .filter((row) => row?.group && row?.team)
      .map((row) => [row.group, row])
  );
}

function ThirdSlotLabel({
  slot,
  thirdsByGroup,
  guaranteedGroups,
  className = "",
}) {
  const group = getGroupFromThirdSlot(slot);
  const row = thirdsByGroup.get(group);
  const team = row?.team ?? "";
  const isFixed = guaranteedGroups.includes(group);

  return (
    <span className={`${styles.thirdSlotLabel} ${className}`.trim()}>
      {team && (
        <img
          className={`${styles.thirdSlotFlag} ${
            isFixed ? "" : styles.slotFlagTemporary
          }`}
          src={getTeamFlagSrc(team)}
          alt=""
          title={isFixed ? team : `${team} — tercero temporal`}
          onError={handleFlagImageError}
        />
      )}

      <span>{slot}</span>
    </span>
  );
}

function DirectSlotLabel({
  slot,
  groupTablesByGroup,
  className = "",
}) {
  const row = getDirectSlotRow(slot, groupTablesByGroup);
  const team = row?.team ?? "";
  const isFixed = Boolean(row?.isGroupOfficiallyClosed);

  return (
    <span className={`${styles.directSlotLabel} ${className}`.trim()}>
      <span>{slot}</span>

      {team && (
        <img
          className={`${styles.directSlotFlag} ${
            isFixed ? "" : styles.slotFlagTemporary
          }`}
          src={getTeamFlagSrc(team)}
          alt=""
          title={isFixed ? team : `${team} — posición temporal`}
          onError={handleFlagImageError}
        />
      )}
    </span>
  );
}

function PossibilityGroupList({ label, groups, variant }) {
  return (
    <div className={styles.groupBlock}>
      <span className={styles.groupBlockLabel}>{label}</span>

      <div className={styles.groupPills}>
        {Array.isArray(groups) && groups.length > 0 ? (
          groups.map((group) => (
            <span
              key={group}
              className={`${styles.groupPill} ${styles[variant] || ""}`}
            >
              3{group}
            </span>
          ))
        ) : (
          <span className={styles.groupEmpty}>-</span>
        )}
      </div>
    </div>
  );
}

function ThirdPlacePossibilitiesPanel({ 
  thirdPlacePossibilities,
  thirdRows = [],
  groupTablesByGroup = {},
  }) {

  if (!thirdPlacePossibilities) return null;

  const {
    totalOptions = 495,
    possibleCount = 0,
    impossibleCount = 0,
    guaranteedGroups = [],
    eliminatedGroups = [],
    openGroups = [],
    matchupProbabilities = {},
  } = thirdPlacePossibilities;
  
  const thirdsByGroup = buildThirdRowsByGroup(thirdRows);
  const hasPossibleOptions = possibleCount > 0;

  return (
    <div className={styles.possibilitiesPanel}>
      <div className={styles.possibilitiesHeader}>
        <div>
          <h3 className={styles.possibilitiesTitle}>
            Combinaciones de terceros
          </h3>

          <p className={styles.possibilitiesDescription}>
            El cálculo toma resultados oficiales y simulados. Los porcentajes
            indican en cuántas combinaciones posibles aparece cada cruce.
          </p>
        </div>

        <div className={styles.combinationCounter}>
          <strong>{possibleCount}</strong>
          <span>/ {totalOptions}</span>
        </div>
      </div>

      <div className={styles.groupStatusGrid}>
        <PossibilityGroupList
          label="Asegurados"
          groups={guaranteedGroups}
          variant="guaranteed"
        />

        <PossibilityGroupList
          label="Eliminados"
          groups={eliminatedGroups}
          variant="out"
        />

        <PossibilityGroupList
          label="En carrera"
          groups={openGroups}
          variant="open"
        />
      </div>

      <div className={styles.matchupPanel}>
        <div className={styles.matchupHeader}>
          <h4 className={styles.matchupTitle}>Probabilidades de cruces</h4>
          <span className={styles.matchupHint}>
            Proporciones dentro de las combinaciones que siguen vivas.
          </span>
        </div>

        {!hasPossibleOptions ? (
          <p className={styles.matchupEmpty}>
            No hay combinaciones posibles con los datos actuales. Revisá los
            resultados simulados o desempates manuales.
          </p>
        ) : (
          <div className={styles.matchupGrid}>
            {THIRD_PLACE_COLUMNS.map((column) => {
              const columnData = matchupProbabilities[column];
              const options = columnData?.options ?? [];

              return (
                <div key={column} className={styles.matchupCard}>
                <div className={styles.matchupColumn}>
                  <span className={styles.matchupColumnMain}>
                    <DirectSlotLabel
                      slot={column}
                      groupTablesByGroup={groupTablesByGroup}
                    />
                  </span>

                  {/* {columnData?.resolvedGroup && (
                    <strong>Definido</strong>
                  )} */}
                </div>

                  <div className={styles.matchupOptions}>
                    {options.length > 0 ? (
                      options.map((option) => (
                        <div
                          key={`${column}-${option.group}`}
                          className={styles.matchupOption}
                        >
                          <ThirdSlotLabel
                            slot={option.assignedSlot}
                            thirdsByGroup={thirdsByGroup}
                            guaranteedGroups={guaranteedGroups}
                          />

                          <div className={styles.percentageTrack}>
                            <span
                              className={styles.percentageFill}
                              style={{
                                width: `${Math.max(
                                  0,
                                  Math.min(100, Number(option.percentage) || 0)
                                )}%`,
                              }}
                            />
                          </div>

                          <strong>{formatPercentage(option.percentage)}</strong>
                          
                          {columnData?.resolvedGroup && (
                            <span className={styles.definidoBadge}>Definido</span>
                          )}                          
                        </div>
                      ))
                    ) : (
                      <span className={styles.groupEmpty}>-</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BestThirdsTable({
  rows = [],
  thirdPlacePossibilities = null,
  groupTablesByGroup = {},
  onChangeRank,
  onClearGroup,
}) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const guaranteedGroups = thirdPlacePossibilities?.guaranteedGroups ?? [];

  if (!safeRows.length) {
    return (
      <section className={styles.card}>
        <h2 className={styles.title}>Mejores terceros</h2>
        <p className={styles.empty}>
          La tabla de terceros se va a mostrar cuando haya datos suficientes.
        </p>
      </section>
    );
  }

  const showManualTiebreaker = canShowBestThirdsManualControl(safeRows);

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
              {safeRows.map((row, index) => {
                const rankingLabel = getRankingLabel(row);
                const rowKey =
                  row?.teamKey ?? row?.team ?? row?.group ?? `third-${index}`;
                const team = row?.team ?? "";
                const isGuaranteedThird = guaranteedGroups.includes(row?.group);

                return (
                  <tr
                    key={rowKey}
                    className={[
                      row?.bestThirdStatus === "qualified"
                        ? styles.qualified
                        : styles.eliminated,
                      isGuaranteedThird ? styles.guaranteedRow : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
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

                    <td>{row?.group ?? "-"}</td>
                    <td className={styles.points}>{row?.points ?? 0}</td>
                    <td>{row?.played ?? 0}</td>
                    <td>{row?.goalsFor ?? 0}</td>
                    <td>{row?.goalsAgainst ?? 0}</td>
                    <td>{row?.goalDifference ?? 0}</td>

                    <td>
                      <span
                        className={`${styles.statusBadge} ${
                          isGuaranteedThird
                            ? styles.statusGuaranteed
                            : row?.bestThirdStatus === "qualified"
                            ? styles.statusQualified
                            : styles.statusEliminated
                        }`}
                      >
                        {isGuaranteedThird
                          ? "Asegurado"
                          : row?.bestThirdStatus === "qualified"
                          ? "Clasifica"
                          : "Eliminado"}
                      </span>
                    </td>

                    <td>
                      {rankingLabel ? (
                        <span
                          className={`${styles.tieBadge} ${
                            row?.rankingStatus === "manual"
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

        <ThirdPlacePossibilitiesPanel
          thirdPlacePossibilities={thirdPlacePossibilities}
          thirdRows={safeRows}
          groupTablesByGroup={groupTablesByGroup}
        />
      </div>

      <ManualTiebreakerControl
        rows={safeRows}
        onChangeRank={onChangeRank}
        onClearGroup={onClearGroup}
        title="Desempate manual entre terceros"
        description="El orden de mejores terceros llegó a criterios de fair play / ranking FIFA. Definí manualmente esas posiciones para continuar la simulación."
        manualControlEnabled={showManualTiebreaker}
      />
    </section>
  );
}