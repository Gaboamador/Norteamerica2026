import { useState } from "react";
import { useWorldCupCalculator } from "@/hooks/calculadora/useWorldCupCalculator";
import GroupTabs from "@/components/calculadora/GroupTabs";
import GroupCalculator from "@/components/calculadora/GroupCalculator";
import BestThirdsTable from "@/components/calculadora/BestThirdsTable";
import KnockoutBracket from "@/components/calculadora/KnockoutBracket";
import ConfirmModal from "@/components/ConfirmModal";
import styles from "./WorldCup.module.scss";

export default function WorldCup() {
  const calculator = useWorldCupCalculator();

  const [confirmAction, setConfirmAction] = useState(null);

  const handleOpenClearGroupConfirm = () => {
    setConfirmAction({
      type: "clearGroup",
      title: `Limpiar simulación del grupo ${calculator.selectedGroup}`,
      message:
        `Se van a borrar los resultados simulados del grupo ${calculator.selectedGroup}. También se van a limpiar los desempates manuales de este grupo y las selecciones del cuadro eliminatorio.`,
      confirmText: "Sí, limpiar grupo",
    });
  };

  const handleOpenClearAllConfirm = () => {
    setConfirmAction({
      type: "clearAll",
      title: "Limpiar toda la simulación",
      message:
        "Se van a borrar todos los resultados simulados, todos los desempates manuales y todas las selecciones del cuadro eliminatorio.",
      confirmText: "Sí, limpiar todo",
    });
  };

  const handleOpenClearKnockoutConfirm = () => {
    setConfirmAction({
      type: "clearKnockout",
      title: "Limpiar ganadores del cuadro",
      message:
        "Se van a borrar todas las selecciones de ganadores del cuadro eliminatorio. Los resultados simulados de los grupos y los desempates manuales no se van a modificar.",
      confirmText: "Sí, limpiar ganadores",
    });
  };

  const handleCloseConfirm = () => {
    setConfirmAction(null);
  };

  const handleConfirm = () => {
    if (!confirmAction) return;

    if (confirmAction.type === "clearGroup") {
      calculator.clearSelectedGroupSandbox();
    }

    if (confirmAction.type === "clearAll") {
      calculator.clearAllSandbox();
    }

    if (confirmAction.type === "clearKnockout") {
      calculator.clearAllKnockoutPicks();
    }

    setConfirmAction(null);
  };

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
          <h1 className={styles.title}>
            <span>Mundial + Calculadora</span>
            <span>(Beta)</span>
          </h1>
          <p className={styles.subtitle}>
            Simulá resultados pendientes y mirá cómo quedarían las tablas de
            cada grupo.
          </p>
        </div>

        <button
          type="button"
          className={`button button--danger ${styles.clearAllButton}`}
          onClick={handleOpenClearAllConfirm}
          disabled={!calculator.hasAnySandboxData}
        >
          Limpiar toda la simulación
        </button>
      </div>

      <GroupTabs
        groups={calculator.groups}
        selectedGroup={calculator.selectedGroup}
        onSelectGroup={calculator.setSelectedGroup}
        matches={calculator.matches}
      />

      <GroupCalculator
        selectedGroup={calculator.selectedGroup}
        groupMatches={calculator.groupMatches}
        groupTable={calculator.groupTable}
        sandboxResults={calculator.sandboxResults}
        setSandboxMatchResult={calculator.setSandboxMatchResult}
        clearSandboxMatchResult={calculator.clearSandboxMatchResult}
        clearSelectedGroupSandbox={handleOpenClearGroupConfirm}
        hasSandboxForSelectedGroup={calculator.hasSandboxForSelectedGroup}
        setManualTiebreakerRank={calculator.setManualTiebreakerRank}
        clearManualTiebreakerGroup={calculator.clearManualTiebreakerGroup}
      />

      <BestThirdsTable
        rows={calculator.bestThirdsTable}
        thirdPlacePossibilities={calculator.thirdPlacePossibilities}
        groupTablesByGroup={calculator.groupTablesByGroup}
        onChangeRank={calculator.setManualTiebreakerRank}
        onClearGroup={calculator.clearManualTiebreakerGroup}
      />

      <KnockoutBracket
        rounds={calculator.knockoutBracket}
        onPickWinner={calculator.setKnockoutWinner}
        onClearWinner={calculator.clearKnockoutWinner}
        onClearAllWinners={handleOpenClearKnockoutConfirm}
        hasAnyKnockoutPicks={calculator.hasAnyKnockoutPicks}
      />

      <ConfirmModal
        open={!!confirmAction}
        title={confirmAction?.title}
        message={confirmAction?.message}
        confirmText={confirmAction?.confirmText}
        cancelText="Cancelar"
        onConfirm={handleConfirm}
        onCancel={handleCloseConfirm}
      />
    </section>
  );
}