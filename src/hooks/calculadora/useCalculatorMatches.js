import { useMatchesCached } from "@/hooks/useMatchesCached";

export function useCalculatorMatches() {
  const { matches, loading } = useMatchesCached();

  return {
    matches,
    loading,
    hasCachedOfficialMatches: matches.length > 0,

    // Se conservan por compatibilidad con useWorldCupCalculator / WorldCup.jsx.
    // Ya no hay refresh manual: la sincronización la maneja useMatchesCached.
    officialMatchesUpdatedAt: null,
    officialMatchesError: null,
    refreshingOfficialMatches: false,
    refreshOfficialMatches: null,
  };
}