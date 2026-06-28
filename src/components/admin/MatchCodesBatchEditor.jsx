import { useEffect, useMemo, useState } from "react";
import { updateMatchesCodesBatch } from "@/services/firebase/firebaseUtils";
import { formatMatchDate } from "@/utils/dateFormat";
import { getRoundLabel } from "@/utils/matchRounds";
import { useToast } from "@/context/ToastContext";
import styles from "./MatchCodesBatchEditor.module.scss";

const MATCH_CODES = Array.from({ length: 32 }, (_, index) => `M${73 + index}`);

function isKnockoutMatch(match) {
  const roundNumber = Number(match?.round);

  return Number.isFinite(roundNumber) && roundNumber >= 4;
}

function getInitialCodes(matches) {
  return Object.fromEntries(
    matches.map((match) => [match.id, match.matchCode ?? ""])
  );
}

function getCodeUsage(codesByMatchId) {
  const usage = new Map();

  Object.entries(codesByMatchId).forEach(([matchId, code]) => {
    if (!code) return;

    if (!usage.has(code)) {
      usage.set(code, []);
    }

    usage.get(code).push(matchId);
  });

  return usage;
}

function getUsedCodesCount(codesByMatchId) {
  return Object.values(codesByMatchId).filter(Boolean).length;
}

function getDuplicateCodes(codeUsage) {
  return Array.from(codeUsage.entries())
    .filter(([, matchIds]) => matchIds.length > 1)
    .map(([code]) => code);
}

export default function MatchCodesBatchEditor({ matches = [] }) {
  const { showToast } = useToast();

  const [codesByMatchId, setCodesByMatchId] = useState({});
  const [saving, setSaving] = useState(false);

  const sortedMatches = useMemo(() => {
    return matches
      .filter(isKnockoutMatch)
      .sort((a, b) => {
        const roundA = Number(a.round ?? 0);
        const roundB = Number(b.round ?? 0);

        if (roundA !== roundB) return roundA - roundB;

        const aTime = a.startTime?.toMillis?.() ?? 0;
        const bTime = b.startTime?.toMillis?.() ?? 0;

        return aTime - bTime;
      });
  }, [matches]);

  useEffect(() => {
    setCodesByMatchId((current) => {
      const initialCodes = getInitialCodes(sortedMatches);
      const next = { ...current };

      Object.entries(initialCodes).forEach(([matchId, matchCode]) => {
        if (!(matchId in next)) {
          next[matchId] = matchCode;
        }
      });

      return next;
    });
  }, [sortedMatches]);

  const codeUsage = useMemo(
    () => getCodeUsage(codesByMatchId),
    [codesByMatchId]
  );

  const duplicateCodes = useMemo(
    () => getDuplicateCodes(codeUsage),
    [codeUsage]
  );

  const hasDuplicateCodes = duplicateCodes.length > 0;

  const changedItems = useMemo(() => {
    return sortedMatches
      .map((match) => {
        const savedMatchCode = match.matchCode ?? "";
        const draftMatchCode = codesByMatchId[match.id] ?? "";

        return {
          matchId: match.id,
          matchCode: draftMatchCode,
          savedMatchCode,
        };
      })
      .filter((item) => item.matchCode && item.savedMatchCode !== item.matchCode)
      .map(({ matchId, matchCode }) => ({
        matchId,
        matchCode,
      }));
  }, [sortedMatches, codesByMatchId]);

  const selectedCount = getUsedCodesCount(codesByMatchId);
  const dirtyCount = changedItems.length;

  const handleSelectCode = (matchId, matchCode) => {
    setCodesByMatchId((current) => ({
      ...current,
      [matchId]: matchCode,
    }));
  };

  const handleSave = async () => {
    if (hasDuplicateCodes) {
      showToast({
        type: "error",
        message: `Hay códigos repetidos: ${duplicateCodes.join(", ")}`,
      });

      return;
    }

    if (changedItems.length === 0) {
      showToast({
        type: "info",
        message: "No hay cambios para guardar",
      });

      return;
    }

    try {
      setSaving(true);

      await updateMatchesCodesBatch(changedItems);

      showToast({
        type: "success",
        message: `Códigos guardados (${changedItems.length} cambio${
          changedItems.length === 1 ? "" : "s"
        })`,
      });
    } catch (err) {
      console.error("Error guardando códigos de partido", err);

      showToast({
        type: "error",
        message: "Error guardando códigos de partido",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!sortedMatches.length) {
    return (
      <section className={styles.wrapper}>
        <div className={styles.empty}>
          No hay partidos de eliminación directa cargados.
        </div>
      </section>
    );
  }

  return (
    <section className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Cargar códigos de partido</h2>

          <p className={styles.description}>
            Asigná el código oficial M73–M104 a cada partido de eliminación
            directa. Esto permite conectar el cuadro de cruces con la fecha,
            hora, canal, estado y resultado real del partido.
          </p>
        </div>

        <div className={styles.summary}>
          <span>{selectedCount} con código</span>
          <span>{dirtyCount} cambios</span>
          {hasDuplicateCodes && (
            <span className={styles.duplicateSummary}>
              Repetidos: {duplicateCodes.join(", ")}
            </span>
          )}
        </div>
      </div>

      <div className={styles.list}>
        {sortedMatches.map((match) => {
          const selectedCode = codesByMatchId[match.id] ?? "";
          const savedCode = match.matchCode ?? "";
          const isDirty = selectedCode !== savedCode;
          const duplicated = selectedCode
            ? (codeUsage.get(selectedCode)?.length ?? 0) > 1
            : false;

          const formattedDate = match.startTime
            ? formatMatchDate(match.startTime.toDate())
            : "-";

          return (
            <article
              key={match.id}
              className={[
                styles.row,
                isDirty ? styles.dirty : "",
                duplicated ? styles.duplicated : "",
                match.status === "finished" ? styles.finished : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className={styles.matchInfo}>
                <div className={styles.teams}>
                  <span>{match.homeTeam}</span>
                  <strong>vs</strong>
                  <span>{match.awayTeam}</span>
                </div>

                <div className={styles.meta}>
                  <span>{getRoundLabel(match.round)}</span>
                  <span>{formattedDate}</span>
                  <span>{match.status}</span>
                  {savedCode && <span>Actual: {savedCode}</span>}
                </div>
              </div>

              <div className={styles.codeControl}>
                <select
                  className={styles.select}
                  value={selectedCode}
                  onChange={(event) =>
                    handleSelectCode(match.id, event.target.value)
                  }
                >
                  <option value="">Sin código</option>

                  {MATCH_CODES.map((code) => {
                    const usedBy = codeUsage.get(code) ?? [];
                    const usedByAnotherMatch =
                      usedBy.length > 0 && !usedBy.includes(match.id);

                    return (
                      <option key={code} value={code}>
                        {code}
                        {usedByAnotherMatch ? " — usado" : ""}
                      </option>
                    );
                  })}
                </select>

                {duplicated && (
                  <span className={styles.duplicateBadge}>Repetido</span>
                )}

                {isDirty && !duplicated && (
                  <span className={styles.dirtyBadge}>Cambio</span>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className={styles.footer}>
        <button
          type="button"
          className="button button--success"
          onClick={handleSave}
          disabled={saving || dirtyCount === 0 || hasDuplicateCodes}
        >
          {saving
            ? "Guardando..."
            : hasDuplicateCodes
              ? "Corregí repetidos"
              : dirtyCount === 0
                ? "Sin cambios"
                : `Guardar códigos (${dirtyCount})`}
        </button>
      </div>
    </section>
  );
}