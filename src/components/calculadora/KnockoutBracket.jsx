import { getTeamFlagSrc, handleFlagImageError } from "@/utils/flagUtils";
import styles from "./KnockoutBracket.module.scss";

function getSlotClassName(slot, selected) {
  if (selected) return styles.selected;
  if (slot.source === "official") return styles.official;
  if (slot.source === "projected") return styles.projected;

  if (
    slot.source === "third-matrix-missing" ||
    slot.source === "third-column-missing" ||
    slot.source === "third-row-missing"
  ) {
    return styles.matrixError;
  }

  return styles.placeholder;
}

function Slot({ slot, selected, canPick, onPick }) {
  const showTeam = Boolean(slot.team);

  if (!showTeam) {
    return (
      <button
        type="button"
        className={`${styles.slotButton} ${styles.placeholder}`}
        onClick={onPick}
        disabled={!canPick}
      >
        <span className={styles.slotMain}>
          <span className={styles.slotName}>{slot.displayName}</span>
        </span>
      </button>
    );
  }

  return (
    <fieldset
      className={`${styles.slotFieldset} ${getSlotClassName(slot, selected)}`}
    >
      <legend className={styles.slotLegend}>{slot.label}</legend>

      <button
        type="button"
        className={styles.slotButton}
        onClick={onPick}
        disabled={!canPick}
      >
        <span className={styles.slotMain}>
          <img
            className={styles.flag}
            src={getTeamFlagSrc(slot.team)}
            alt=""
            onError={handleFlagImageError}
          />

          <span className={styles.slotName}>{slot.displayName}</span>
        </span>
      </button>
    </fieldset>
  );
}

function KnockoutMatch({ match, onPickWinner, onClearWinner }) {
  const hasSelection = Boolean(match.selectedWinnerSide);

  return (
    <article className={styles.match}>
      <div className={styles.matchHeader}>
        <span className={styles.matchId}>{match.matchId}</span>
        <span className={styles.winnerSlot}>{match.winnerSlot}</span>
      </div>

      <div className={styles.slots}>
        <Slot
          slot={match.home}
          selected={match.selectedWinnerSide === "home"}
          canPick={match.canPickWinner}
          onPick={() => onPickWinner(match.matchId, "home")}
        />

        <Slot
          slot={match.away}
          selected={match.selectedWinnerSide === "away"}
          canPick={match.canPickWinner}
          onPick={() => onPickWinner(match.matchId, "away")}
        />
      </div>

      {hasSelection && (
        <button
          type="button"
          className={styles.clearWinner}
          onClick={() => onClearWinner(match.matchId)}
        >
          Limpiar ganador
        </button>
      )}
    </article>
  );
}

export default function KnockoutBracket({
  rounds,
  onPickWinner,
  onClearWinner,
  onClearAllWinners,
  hasAnyKnockoutPicks,
}) {
  if (!rounds?.length) return null;

  return (
    <section className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Cruces</h2>
          <p className={styles.description}>
            Proyección del cuadro de eliminación directa. Elegí ganadores para
            completar el camino hacia la final.
          </p>
        </div>

        <button
          type="button"
          className={`button button--secondary ${styles.clearAllButton}`}
          onClick={onClearAllWinners}
          disabled={!hasAnyKnockoutPicks}
        >
          Limpiar ganadores
        </button>
      </div>

      <div className={styles.rounds}>
        {rounds.map((round) => (
          <section key={round.key} className={styles.round}>
            <h3 className={styles.roundTitle}>{round.title}</h3>

            <div className={styles.matches}>
              {round.matches.map((match) => (
                <KnockoutMatch
                  key={match.matchId}
                  match={match}
                  onPickWinner={onPickWinner}
                  onClearWinner={onClearWinner}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}