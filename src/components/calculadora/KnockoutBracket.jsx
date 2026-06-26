import { getTeamFlagSrc, handleFlagImageError } from "@/utils/flagUtils";
import { getTeamShortName } from "@/utils/teams";
import styles from "./KnockoutBracket.module.scss";

const BRACKET_MATCH_ORDER = [
  74, 77,
  73, 75,
  83, 84,
  81, 82,
  76, 78,
  79, 80,
  86, 88,
  85, 87,

  89, 90,
  93, 94,
  91, 92,
  95, 96,

  97, 98,
  99, 100,

  101, 102,

  104,
  103,
];

function getMatchNumber(match) {
  const raw = String(match?.matchId ?? match?.id ?? "");
  const matchNumber = raw.match(/\d+/)?.[0];

  return matchNumber ? Number(matchNumber) : null;
}

function getBracketOrderIndex(match) {
  const matchNumber = getMatchNumber(match);
  const index = BRACKET_MATCH_ORDER.indexOf(matchNumber);

  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function getVisualRoundIndex(match, fallbackRoundIndex) {
  const matchNumber = getMatchNumber(match);

  if (matchNumber >= 73 && matchNumber <= 88) return 0;
  if (matchNumber >= 89 && matchNumber <= 96) return 1;
  if (matchNumber >= 97 && matchNumber <= 100) return 2;
  if (matchNumber >= 101 && matchNumber <= 102) return 3;
  if (matchNumber >= 103 && matchNumber <= 104) return 4;

  return fallbackRoundIndex;
}

function getMatchRowStart(match, fallbackRoundIndex, matchIndex) {
  const matchNumber = getMatchNumber(match);

  if (matchNumber === 104) return 16;
  if (matchNumber === 103) return 24;

  const visualRoundIndex = getVisualRoundIndex(match, fallbackRoundIndex);

  return (
    Math.pow(2, visualRoundIndex) +
    matchIndex * Math.pow(2, visualRoundIndex + 1)
  );
}

function getOrderedMatches(matches = []) {
  return [...matches].sort((a, b) => {
    const orderA = getBracketOrderIndex(a);
    const orderB = getBracketOrderIndex(b);

    if (orderA !== orderB) return orderA - orderB;

    const numberA = getMatchNumber(a) ?? 0;
    const numberB = getMatchNumber(b) ?? 0;

    return numberA - numberB;
  });
}

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

function formatProbability(value) {
  const number = Number(value ?? 0);

  if (!Number.isFinite(number)) return "0%";

  if (Number.isInteger(number)) return `${number}%`;

  return `${number.toFixed(1)}%`;
}

function getTopThirdOptionLabel(option, { includeTeam = false } = {}) {
  if (!option) return null;

  const baseLabel = `${option.assignedSlot} · ${formatProbability(
    option.percentage
  )}`;

  if (includeTeam && option.team) {
    return `${baseLabel} (${getTeamShortName(option.team)})`;
  }

  return `Probable: ${baseLabel}`;
}

function getTopThirdOptionTeam(option) {
  return option?.team || null;
}

function Slot({ slot, selected, canPick, onPick }) {
  const showTeam = Boolean(slot.team);

if (!showTeam) {
  const topThirdOptionLabel = getTopThirdOptionLabel(slot.topThirdOption);
  const topThirdOptionMobileLabel = getTopThirdOptionLabel(slot.topThirdOption, {
    includeTeam: true,
  });
  const topThirdOptionTeam = getTopThirdOptionTeam(slot.topThirdOption);
  const hasTopThirdOption = Boolean(topThirdOptionLabel);

  return (
    <button
      type="button"
      className={`${styles.slotButton} ${styles.placeholder} ${
        hasTopThirdOption ? styles.slotWithTopOption : ""
      }`}
      onClick={onPick}
      disabled={!canPick}
      title={hasTopThirdOption ? slot.displayName : undefined}
    >
      <span className={styles.slotMain}>
        {hasTopThirdOption ? (
          <>
            <span className={`${styles.slotName} ${styles.slotNameDesktop}`}>
              {topThirdOptionLabel}
            </span>

            <span className={`${styles.slotName} ${styles.slotNameMobile}`}>
              {topThirdOptionMobileLabel}
            </span>
          </>
        ) : (
          <span className={styles.slotName}>
            {slot.displayName}
          </span>
        )}

        {hasTopThirdOption && (
          <span className={styles.slotHoverLabel}>
            {topThirdOptionTeam && (
              <img
                className={styles.flag}
                src={getTeamFlagSrc(topThirdOptionTeam)}
                alt=""
                onError={handleFlagImageError}
              />
            )}

            <span className={styles.slotHoverTeam}>
              {topThirdOptionTeam || slot.displayName}
            </span>
          </span>
        )}
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

        <span className={styles.matchHeaderRight}>
          <span className={styles.winnerSlot}>{match.winnerSlot}</span>

          {hasSelection && (
            <button
              type="button"
              className={styles.clearWinner}
              onClick={() => onClearWinner(match.matchId)}
              aria-label={`Limpiar ganador de ${match.matchId}`}
              title="Limpiar ganador"
            >
              Limpiar
            </button>
          )}
        </span>
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
    </article>
  );
}

function getDisplayRounds(rounds) {
  if (!Array.isArray(rounds)) return [];

  const finalRoundIndex = rounds.findIndex((round) =>
    round.matches?.some((match) => getMatchNumber(match) === 104)
  );

  const thirdPlaceRoundIndex = rounds.findIndex((round) =>
    round.matches?.some((match) => getMatchNumber(match) === 103)
  );

  if (
    finalRoundIndex < 0 ||
    thirdPlaceRoundIndex < 0 ||
    finalRoundIndex === thirdPlaceRoundIndex
  ) {
    return rounds;
  }

  const thirdPlaceMatches =
    rounds[thirdPlaceRoundIndex].matches?.filter(
      (match) => getMatchNumber(match) === 103
    ) ?? [];

  if (!thirdPlaceMatches.length) return rounds;

  return rounds
    .map((round, index) => {
      if (index === finalRoundIndex) {
        return {
          ...round,
          matches: [...round.matches, ...thirdPlaceMatches],
        };
      }

      if (index === thirdPlaceRoundIndex) {
        const remainingMatches =
          round.matches?.filter((match) => getMatchNumber(match) !== 103) ?? [];

        return {
          ...round,
          matches: remainingMatches,
        };
      }

      return round;
    })
    .filter((round) => round.matches?.length);
}

export default function KnockoutBracket({
  rounds,
  onPickWinner,
  onClearWinner,
  onClearAllWinners,
  hasAnyKnockoutPicks,
}) {
  if (!rounds?.length) return null;

  const displayRounds = getDisplayRounds(rounds);

  const firstRound = rounds.find((round) =>
    round.matches?.some((match) => {
      const matchNumber = getMatchNumber(match);
      return matchNumber >= 73 && matchNumber <= 88;
    })
  );

  const firstRoundMatchCount = firstRound?.matches?.length ?? 16;
  const bracketRows = firstRoundMatchCount * 2;

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
          className={`button button--danger ${styles.clearAllButton}`}
          onClick={onClearAllWinners}
          disabled={!hasAnyKnockoutPicks}
        >
          Limpiar cuadro eliminatorio
        </button>
      </div>

      <div className={styles.bracketScroller}>
        <div className={styles.rounds}>
          {displayRounds.map((round, roundIndex) => {
            const orderedMatches = getOrderedMatches(round.matches);

            return (
              <section key={round.key} className={styles.round}>
                <h3 className={styles.roundTitle}>{round.title}</h3>

                <div
                  className={styles.matches}
                  style={{
                    gridTemplateRows: `repeat(${bracketRows}, var(--bracket-track-size))`,
                  }}
                >
                  {orderedMatches.map((match, matchIndex) => {
                    const rowStart = getMatchRowStart(
                      match,
                      roundIndex,
                      matchIndex
                    );

                    const visualRoundIndex = getVisualRoundIndex(
                      match,
                      roundIndex
                    );

                    const matchNumber = getMatchNumber(match);

                    const showIncomingConnector =
                      visualRoundIndex > 0 && matchNumber !== 103;

                    const showOutgoingConnector =
                      visualRoundIndex < 4;

                    const outgoingDirection =
                      matchIndex % 2 === 0
                        ? styles.outgoingConnectorDown
                        : styles.outgoingConnectorUp;

                    return (
                        <div
                          key={match.matchId}
                          className={`${styles.matchPlacement} ${
                            matchNumber === 104 ? styles.finalPlacement : ""
                          }`}
                          style={{
                            gridRow: `${rowStart} / span 2`,
                          }}
                        >
                        {showIncomingConnector && (
                          <span
                            className={styles.incomingConnector}
                            aria-hidden="true"
                          />
                        )}

                        {showOutgoingConnector && (
                          <span
                            className={`${styles.outgoingConnector} ${outgoingDirection}`}
                            aria-hidden="true"
                          />
                        )}

                        <KnockoutMatch
                          match={match}
                          onPickWinner={onPickWinner}
                          onClearWinner={onClearWinner}
                        />
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </section>
  );
}