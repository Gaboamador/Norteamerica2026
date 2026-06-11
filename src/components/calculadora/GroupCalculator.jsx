import SandboxMatchGrid from "./SandboxMatchGrid";
import GroupStandingsTable from "./GroupStandingsTable";
import ManualTiebreakerControl from "./ManualTiebreakerControl";
import styles from "./GroupCalculator.module.scss";

export default function GroupCalculator({
  selectedGroup,
  groupMatches,
  groupTable,
  sandboxResults,
  setSandboxMatchResult,
  clearSandboxMatchResult,
  clearSelectedGroupSandbox,
  hasSandboxForSelectedGroup,
  setManualTiebreakerRank,
  clearManualTiebreakerGroup,
}) {
  return (
    <section className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Grupo {selectedGroup}</h2>
          <p className={styles.description}>
            Probá resultados de partidos pendientes y mirá cómo se movería la
            tabla del grupo.
          </p>
        </div>

        <button
          type="button"
          className={`button button--secondary ${styles.clearButton}`}
          onClick={clearSelectedGroupSandbox}
          disabled={!hasSandboxForSelectedGroup}
        >
          Limpiar simulación del grupo
        </button>
      </div>

      <div className={styles.layout}>
        <div className={styles.sidePanel}>
          <GroupStandingsTable rows={groupTable} />

          <ManualTiebreakerControl
            rows={groupTable}
            onChangeRank={setManualTiebreakerRank}
            onClearGroup={clearManualTiebreakerGroup}
          />
        </div>

        <SandboxMatchGrid
          matches={groupMatches}
          sandboxResults={sandboxResults}
          setSandboxMatchResult={setSandboxMatchResult}
          clearSandboxMatchResult={clearSandboxMatchResult}
        />
      </div>
    </section>
  );
}