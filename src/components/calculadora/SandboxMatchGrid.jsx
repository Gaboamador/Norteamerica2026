import { getTeamFlagSrc, handleFlagImageError } from "@/utils/flagUtils";
import {
  getEffectiveResult,
  isOfficialResult,
} from "@/utils/calculadora/matchResultUtils";
import { formatMatchDate } from "@/utils/dateFormat";
import styles from "./SandboxMatchGrid.module.scss";

export default function SandboxMatchGrid({
  matches,
  sandboxResults,
  setSandboxMatchResult,
  clearSandboxMatchResult,
}) {
  if (!matches.length) {
    return (
      <div className={styles.empty}>
        No hay partidos cargados para este grupo.
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Partidos</h3>

      <div className={styles.list}>
        {matches.map((match) => {
          const official = isOfficialResult(match);
          const effectiveResult = getEffectiveResult(match, sandboxResults);
          const sandboxResult = sandboxResults[match.id] ?? {};
          const formattedDate = match?.startTime ? formatMatchDate(match.startTime) : "";

          const homeValue = official
            ? match.result.homeGoals
            : sandboxResult.homeGoals ?? "";

          const awayValue = official
            ? match.result.awayGoals
            : sandboxResult.awayGoals ?? "";

          return (
            <article key={match.id} className={styles.match}>
              <div className={styles.meta}>
                <span>{formattedDate}</span>

                <span
                  className={`${styles.badge} ${
                    official ? styles.official : styles.sandbox
                  }`}
                >
                  {official
                    ? "Resultado oficial"
                    : effectiveResult
                      ? "Simulado"
                      : "Pendiente"}
                </span>
              </div>

              <div className={styles.teams}>
                <div className={styles.team}>
                  <img
                    className={styles.flag}
                    src={getTeamFlagSrc(match.homeTeam)}
                    alt=""
                    onError={handleFlagImageError}
                  />
                  <span>{match.homeTeam}</span>
                </div>

                <div className={styles.score}>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={homeValue}
                    disabled={official}
                    onWheel={(event) => event.currentTarget.blur()}
                    onChange={(event) =>
                      setSandboxMatchResult(
                        match.id,
                        "homeGoals",
                        event.target.value
                      )
                    }
                    aria-label={`Goles de ${match.homeTeam}`}
                  />

                  <span>-</span>

                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={awayValue}
                    disabled={official}
                    onWheel={(event) => event.currentTarget.blur()}
                    onChange={(event) =>
                      setSandboxMatchResult(
                        match.id,
                        "awayGoals",
                        event.target.value
                      )
                    }
                    aria-label={`Goles de ${match.awayTeam}`}
                  />
                </div>

                <div className={`${styles.team} ${styles.awayTeam}`}>
                  <span>{match.awayTeam}</span>
                  <img
                    className={styles.flag}
                    src={getTeamFlagSrc(match.awayTeam)}
                    alt=""
                    onError={handleFlagImageError}
                  />
                </div>
              </div>

              {!official && effectiveResult && (
                <button
                  type="button"
                  className={styles.clearMatch}
                  onClick={() => clearSandboxMatchResult(match.id)}
                >
                  Limpiar partido
                </button>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}