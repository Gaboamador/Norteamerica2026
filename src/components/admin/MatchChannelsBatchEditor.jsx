import { useEffect, useMemo, useState } from "react";
import { updateMatchesChannelsBatch } from "@/services/firebase/firebaseUtils";
import { formatMatchDate } from "@/utils/dateFormat";
import { getRoundLabel } from "@/utils/matchRounds";
import { useToast } from "@/context/ToastContext";
import styles from "./MatchChannelsBatchEditor.module.scss";

const CHANNEL_OPTIONS = ["Telefé", "TyC Sports", "DGO"];

function getInitialChannels(matches) {
  return Object.fromEntries(
    matches.map((match) => [match.id, match.channel ?? null])
  );
}

export default function MatchChannelsBatchEditor({ matches = [] }) {
  const { showToast } = useToast();

  const [channelsByMatchId, setChannelsByMatchId] = useState({});
  const [saving, setSaving] = useState(false);

  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => {
      const aTime = a.startTime?.toMillis?.() ?? 0;
      const bTime = b.startTime?.toMillis?.() ?? 0;

      return aTime - bTime;
    });
  }, [matches]);

  useEffect(() => {
    setChannelsByMatchId((current) => {
      const initialChannels = getInitialChannels(sortedMatches);
      const next = { ...current };

      Object.entries(initialChannels).forEach(([matchId, channel]) => {
        if (!(matchId in next)) {
          next[matchId] = channel;
        }
      });

      return next;
    });
  }, [sortedMatches]);

  const changedItems = useMemo(() => {
    return sortedMatches
      .map((match) => {
        const savedChannel = match.channel ?? null;
        const draftChannel = channelsByMatchId[match.id] ?? null;

        return {
          matchId: match.id,
          channel: draftChannel,
          savedChannel,
        };
      })
      .filter((item) => item.savedChannel !== item.channel)
      .map(({ matchId, channel }) => ({
        matchId,
        channel,
      }));
  }, [sortedMatches, channelsByMatchId]);

  const dirtyCount = changedItems.length;

  const selectedCount = sortedMatches.reduce((count, match) => {
    return channelsByMatchId[match.id] ? count + 1 : count;
  }, 0);

  const handleSelectChannel = (matchId, channel) => {
    setChannelsByMatchId((current) => ({
      ...current,
      [matchId]: current[matchId] === channel ? null : channel,
    }));
  };

  const handleClearChannel = (matchId) => {
    setChannelsByMatchId((current) => ({
      ...current,
      [matchId]: null,
    }));
  };

  const handleSave = async () => {
    if (changedItems.length === 0) {
      showToast({
        type: "info",
        message: "No hay cambios para guardar",
      });

      return;
    }

    try {
      setSaving(true);

      await updateMatchesChannelsBatch(changedItems);

      showToast({
        type: "success",
        message: `Canales guardados (${changedItems.length} cambio${
          changedItems.length === 1 ? "" : "s"
        })`,
      });
    } catch (err) {
      console.error("Error guardando canales", err);

      showToast({
        type: "error",
        message: "Error guardando canales",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!sortedMatches.length) {
    return (
      <section className={styles.wrapper}>
        <div className={styles.empty}>No hay partidos cargados.</div>
      </section>
    );
  }

  return (
    <section className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Cargar canales</h2>

          <p className={styles.description}>
            Seleccioná la transmisión de cada partido. Si no elegís ninguna
            opción, se guarda como null.
          </p>
        </div>

        <div className={styles.summary}>
          <span>{selectedCount} con canal</span>
          <span>{dirtyCount} cambios</span>
        </div>
      </div>

      <div className={styles.list}>
        {sortedMatches.map((match) => {
          const selectedChannel = channelsByMatchId[match.id] ?? null;
          const savedChannel = match.channel ?? null;
          const isDirty = selectedChannel !== savedChannel;
          const isFinished = match.status === "finished";

          return (
            <article
              key={match.id}
              className={`${styles.row} ${isFinished ? styles.finished : ""} ${
                isDirty ? styles.dirty : ""
              }`}
            >
              <div className={styles.matchInfo}>
                <div className={styles.teams}>
                  <span>{match.homeTeam}</span>
                  <strong>vs</strong>
                  <span>{match.awayTeam}</span>
                </div>

                <div className={styles.meta}>
                  {match.group && <span>Grupo {match.group}</span>}
                  <span>{getRoundLabel(match.round)}</span>
                  {match.startTime && (
                    <span>{formatMatchDate(match.startTime.toDate())}</span>
                  )}
                  <span>{match.status}</span>
                </div>
              </div>

              <div className={styles.channels}>
                {CHANNEL_OPTIONS.map((channel) => {
                  const active = selectedChannel === channel;

                  return (
                    <button
                      key={channel}
                      type="button"
                      className={`${styles.channelPill} ${
                        active ? styles.active : ""
                      }`}
                      onClick={() => handleSelectChannel(match.id, channel)}
                    >
                      {channel}
                    </button>
                  );
                })}

                <button
                  type="button"
                  className={`${styles.channelPill} ${
                    selectedChannel === null ? styles.nullActive : ""
                  }`}
                  onClick={() => handleClearChannel(match.id)}
                >
                  Sin dato
                </button>
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
          disabled={saving || dirtyCount === 0}
        >
          {saving
            ? "Guardando..."
            : dirtyCount === 0
              ? "Sin cambios"
              : `Guardar canales (${dirtyCount})`}
        </button>
      </div>
    </section>
  );
}