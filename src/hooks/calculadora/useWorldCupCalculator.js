import { useEffect, useMemo, useState } from "react";
import { useCalculatorMatches } from "@/hooks/calculadora/useCalculatorMatches";
import { buildGroupTable } from "@/utils/calculadora/buildGroupTable";
import { buildBestThirdsTable } from "@/utils/calculadora/buildBestThirdsTable";
import { buildKnockoutBracket } from "@/utils/calculadora/buildKnockoutBracket";
import { buildThirdPlacePossibilities } from "@/utils/calculadora/thirdPlacePossibilities";
import {
  WORLD_CUP_GROUPS,
  getAvailableGroups,
  getGroupMatches,
  isValidGoalValue,
} from "@/utils/calculadora/matchResultUtils";
import {
  clearCalculatorKnockoutPicks,
  clearCalculatorStorage,
  readCalculatorKnockoutPicks,
  readCalculatorManualTiebreakers,
  readCalculatorSandboxResults,
  saveCalculatorKnockoutPicks,
  saveCalculatorManualTiebreakers,
  saveCalculatorSandboxResults,
} from "@/utils/calculadora/calculatorStorage";

export function useWorldCupCalculator() {

  const {
    matches,
    loading,
    hasCachedOfficialMatches,
    officialMatchesUpdatedAt,
    officialMatchesError,
    refreshingOfficialMatches,
    refreshOfficialMatches,
  } = useCalculatorMatches();

  const availableGroups = useMemo(() => {
    const groups = getAvailableGroups(matches);

    return groups.length ? groups : WORLD_CUP_GROUPS;
  }, [matches]);

  const [selectedGroup, setSelectedGroup] = useState("A");

  const [sandboxResults, setSandboxResults] = useState(() =>
    readCalculatorSandboxResults()
  );

  const [manualTiebreakers, setManualTiebreakers] = useState(() =>
    readCalculatorManualTiebreakers()
  );

  const [knockoutPicks, setKnockoutPicks] = useState(() =>
    readCalculatorKnockoutPicks()
  );

  useEffect(() => {
    saveCalculatorSandboxResults(sandboxResults);
  }, [sandboxResults]);

  useEffect(() => {
    saveCalculatorManualTiebreakers(manualTiebreakers);
  }, [manualTiebreakers]);

  useEffect(() => {
    saveCalculatorKnockoutPicks(knockoutPicks);
  }, [knockoutPicks]);

  const groupMatches = useMemo(() => {
    return getGroupMatches(matches, selectedGroup);
  }, [matches, selectedGroup]);

  const groupTablesByGroup = useMemo(() => {
    return availableGroups.reduce((acc, group) => {
      const currentGroupMatches = getGroupMatches(matches, group);

      acc[group] = buildGroupTable({
        group,
        groupMatches: currentGroupMatches,
        sandboxResults,
        manualTiebreakers,
      });

      return acc;
    }, {});
  }, [availableGroups, matches, sandboxResults, manualTiebreakers]);

  const groupTable = useMemo(() => {
    return groupTablesByGroup[selectedGroup] ?? [];
  }, [groupTablesByGroup, selectedGroup]);

const bestThirdsTable = useMemo(() => {
  return buildBestThirdsTable({
    groupTablesByGroup,
    manualTiebreakers,
  });
}, [groupTablesByGroup, manualTiebreakers]);

const thirdPlacePossibilities = useMemo(() => {
  return buildThirdPlacePossibilities({
    matches,
    sandboxResults,
    bestThirdsTable,
  });
}, [matches, sandboxResults, bestThirdsTable]);

const knockoutBracket = useMemo(() => {
  return buildKnockoutBracket({
    matches,
    groupTablesByGroup,
    bestThirdsTable,
    sandboxResults,
    knockoutPicks,
    thirdPlacePossibilities,
  });
}, [
  matches,
  groupTablesByGroup,
  bestThirdsTable,
  sandboxResults,
  knockoutPicks,
  thirdPlacePossibilities,
]);

  const setSandboxMatchResult = (matchId, field, value) => {
    setSandboxResults((current) => {
      const previousResult = current[matchId] ?? {
        homeGoals: "",
        awayGoals: "",
      };

      const nextResult = {
        ...previousResult,
        [field]: value,
      };

      const bothEmpty =
        String(nextResult.homeGoals ?? "") === "" &&
        String(nextResult.awayGoals ?? "") === "";

      if (bothEmpty) {
        const next = { ...current };
        delete next[matchId];

        return next;
      }

      return {
        ...current,
        [matchId]: nextResult,
      };
    });

    // Si cambia una tabla base, el cuadro puede quedar inválido.
    setKnockoutPicks({});
    clearCalculatorKnockoutPicks();
  };

  const clearSandboxMatchResult = (matchId) => {
    setSandboxResults((current) => {
      const next = { ...current };
      delete next[matchId];

      return next;
    });

    setKnockoutPicks({});
    clearCalculatorKnockoutPicks();
  };

const clearSelectedGroupSandbox = () => {
  const groupMatchIds = new Set(groupMatches.map((match) => match.id));
  const selectedGroupTiebreakerPrefix = `group-${selectedGroup}-tie-`;

  setSandboxResults((current) => {
    const next = { ...current };

    groupMatchIds.forEach((matchId) => {
      delete next[matchId];
    });

    return next;
  });

  setManualTiebreakers((current) => {
    const next = { ...current };

    Object.keys(next).forEach((unresolvedGroupId) => {
      if (unresolvedGroupId.startsWith(selectedGroupTiebreakerPrefix)) {
        delete next[unresolvedGroupId];
      }
    });

    return next;
  });

  setKnockoutPicks({});
  clearCalculatorKnockoutPicks();
};

  const clearAllSandbox = () => {
    setSandboxResults({});
    setManualTiebreakers({});
    setKnockoutPicks({});
    clearCalculatorStorage();
  };

  const setManualTiebreakerRank = (unresolvedGroupId, teamKey, rank) => {
    setManualTiebreakers((current) => {
      const currentGroup = current[unresolvedGroupId] ?? {};

      return {
        ...current,
        [unresolvedGroupId]: {
          ...currentGroup,
          [teamKey]: rank === "" ? null : Number(rank),
        },
      };
    });

    setKnockoutPicks({});
    clearCalculatorKnockoutPicks();
  };

  const clearManualTiebreakerGroup = (unresolvedGroupId) => {
    setManualTiebreakers((current) => {
      const next = { ...current };
      delete next[unresolvedGroupId];

      return next;
    });

    setKnockoutPicks({});
    clearCalculatorKnockoutPicks();
  };

  const setKnockoutWinner = (matchId, side) => {
    setKnockoutPicks((current) => ({
      ...current,
      [matchId]: side,
    }));
  };

  const clearKnockoutWinner = (matchId) => {
    setKnockoutPicks((current) => {
      const next = { ...current };
      delete next[matchId];

      return next;
    });
  };

  const clearAllKnockoutPicks = () => {
    setKnockoutPicks({});
    clearCalculatorKnockoutPicks();
  };

  const hasSandboxForSelectedGroup = groupMatches.some((match) => {
    const result = sandboxResults[match.id];

    return (
      isValidGoalValue(result?.homeGoals) ||
      isValidGoalValue(result?.awayGoals)
    );
  });

  const hasAnySandboxData =
    Object.keys(sandboxResults).length > 0 ||
    Object.keys(manualTiebreakers).length > 0 ||
    Object.keys(knockoutPicks).length > 0;

  const hasAnyKnockoutPicks = Object.keys(knockoutPicks).length > 0;

  return {
    loading,
    matches,

    hasCachedOfficialMatches,
    officialMatchesUpdatedAt,
    officialMatchesError,
    refreshingOfficialMatches,
    refreshOfficialMatches,

    groups: availableGroups,
    selectedGroup,
    setSelectedGroup,

    groupMatches,
    groupTable,
    groupTablesByGroup,
    bestThirdsTable,
    thirdPlacePossibilities,
    knockoutBracket,

    sandboxResults,
    setSandboxMatchResult,
    clearSandboxMatchResult,
    clearSelectedGroupSandbox,
    clearAllSandbox,
    hasSandboxForSelectedGroup,
    hasAnySandboxData,

    manualTiebreakers,
    setManualTiebreakerRank,
    clearManualTiebreakerGroup,

    knockoutPicks,
    setKnockoutWinner,
    clearKnockoutWinner,
    clearAllKnockoutPicks,
    hasAnyKnockoutPicks,
  };
}