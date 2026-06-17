import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useMatchesCached } from "@/hooks/useMatchesCached";
import { useLockedPredictionsSummaries } from "@/hooks/useLockedPredictionsSummaries";
import LocalProdeSimulatorPanel from "@/components/LocalProdeSimulatorPanel";
import { LuArrowLeft } from "react-icons/lu";
import styles from "./LocalProdeSimulatorScreen.module.scss";

export default function LocalProdeSimulatorScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const groupIdParam = searchParams.get("groupId") || "";
  const matchIdParam = searchParams.get("matchId") || "";

  const { matches, loading: matchesLoading } = useMatchesCached();
  const controller = useLockedPredictionsSummaries();

  const {
    groups,
    groupsLoading,
    summaries,
    loadingGroupIds,
    error,
    loadGroups,
    loadSummary,
  } = controller;

  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(groupIdParam);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      const loadedGroups = await loadGroups();

      if (cancelled) return;

      const fallbackGroupId = loadedGroups?.[0]?.id || "";
      const nextGroupId = groupIdParam || fallbackGroupId;

      setSelectedGroupId(nextGroupId);

      if (nextGroupId) {
        await loadSummary(nextGroupId);
      }

      if (!cancelled) {
        setInitialLoadDone(true);
      }
    }

    loadInitialData();

    return () => {
      cancelled = true;
    };
  }, [groupIdParam, loadGroups, loadSummary]);

  const selectedGroup = useMemo(() => {
    return groups.find((group) => group.id === selectedGroupId) || null;
  }, [groups, selectedGroupId]);

  const selectedSummary = selectedGroupId
    ? summaries[selectedGroupId]
    : null;

  const currentMatch = useMemo(() => {
    if (!matchIdParam) return null;

    return matches.find((match) => match.id === matchIdParam) || null;
  }, [matches, matchIdParam]);

  const isLoading =
    matchesLoading ||
    groupsLoading ||
    !initialLoadDone ||
    Boolean(selectedGroupId && loadingGroupIds[selectedGroupId]);

  const handleBack = () => {
    navigate("/pronosticos", {
      state: {
        scrollToMatchId: location.state?.returnMatchId || matchIdParam || null,
      },
    });
  };

  const handleSelectGroup = async (groupId) => {
    setSelectedGroupId(groupId);
    await loadSummary(groupId);
  };

  if (isLoading) {
    return (
      <section className={styles.wrapper}>
        <div className={styles.message}>
          Cargando simulador...
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.wrapper}>
        <button
          type="button"
          className={`button button--secondary ${styles.backButton}`}
          onClick={handleBack}
        >
            <LuArrowLeft aria-hidden="true" />
            Volver a pronósticos
        </button>

        <div className={styles.message}>
          {error}
        </div>
      </section>
    );
  }

  if (!groups.length) {
    return (
      <section className={styles.wrapper}>
        <button
          type="button"
          className={`button button--secondary ${styles.backButton}`}
          onClick={handleBack}
        >
          <LuArrowLeft aria-hidden="true" />
          Volver a pronósticos
        </button>

        <div className={styles.message}>
          No pertenecés a ningún grupo.
        </div>
      </section>
    );
  }

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>

        <div>
          <h1 className={styles.title}>
            Simulador de tabla local
          </h1>
        </div>

        <button
          type="button"
          className={`button button--tertiary ${styles.backButton}`}
          onClick={handleBack}
        >
          <LuArrowLeft aria-hidden="true" />
          Volver a pronósticos
        </button>

      </header>

      {groups.length > 1 && (
        <div className={styles.groupSelector}>
          {groups.map((group) => {
            const active = group.id === selectedGroupId;

            return (
              <button
                key={group.id}
                type="button"
                className={`${styles.groupChip} ${active ? styles.active : ""}`}
                onClick={() => handleSelectGroup(group.id)}
              >
                {group.name}
              </button>
            );
          })}
        </div>
      )}

      <LocalProdeSimulatorPanel
        currentMatch={currentMatch}
        group={selectedGroup}   
        summary={selectedSummary}
        matches={matches}
        />
    </section>
  );
}