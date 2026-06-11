import { useWorldCupCalculator } from "@/hooks/calculadora/useWorldCupCalculator";
import GroupTabs from "@/components/calculadora/GroupTabs";
import GroupCalculator from "@/components/calculadora/GroupCalculator";
import BestThirdsTable from "@/components/calculadora/BestThirdsTable";
import KnockoutBracket from "@/components/calculadora/KnockoutBracket";
import styles from "./WorldCup.module.scss";

export default function WorldCup() {
  const calculator = useWorldCupCalculator();

  if (calculator.loading) {
    return (
      <div className={styles.loading}>
        Cargando calculadora...
      </div>
    );
  }

  return (
    <section className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Mundial - Calculadora</h1>
          <p className={styles.subtitle}>
            Simulá resultados pendientes y mirá cómo quedarían las tablas de
            cada grupo.
          </p>
        </div>

        <button
          type="button"
          className={`button button--secondary ${styles.clearAllButton}`}
          onClick={calculator.clearAllSandbox}
          disabled={!calculator.hasAnySandboxData}
        >
          Limpiar toda la simulación
        </button>
      </div>

      <GroupTabs
        groups={calculator.groups}
        selectedGroup={calculator.selectedGroup}
        onSelectGroup={calculator.setSelectedGroup}
      />

      <GroupCalculator
        selectedGroup={calculator.selectedGroup}
        groupMatches={calculator.groupMatches}
        groupTable={calculator.groupTable}
        sandboxResults={calculator.sandboxResults}
        setSandboxMatchResult={calculator.setSandboxMatchResult}
        clearSandboxMatchResult={calculator.clearSandboxMatchResult}
        clearSelectedGroupSandbox={calculator.clearSelectedGroupSandbox}
        hasSandboxForSelectedGroup={calculator.hasSandboxForSelectedGroup}
        setManualTiebreakerRank={calculator.setManualTiebreakerRank}
        clearManualTiebreakerGroup={calculator.clearManualTiebreakerGroup}
      />

      <BestThirdsTable
        rows={calculator.bestThirdsTable}
        onChangeRank={calculator.setManualTiebreakerRank}
        onClearGroup={calculator.clearManualTiebreakerGroup}
      />

      <KnockoutBracket
        rounds={calculator.knockoutBracket}
        onPickWinner={calculator.setKnockoutWinner}
        onClearWinner={calculator.clearKnockoutWinner}
        onClearAllWinners={calculator.clearAllKnockoutPicks}
        hasAnyKnockoutPicks={calculator.hasAnyKnockoutPicks}
      />
    </section>
  );
}