import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useMatches } from "@/hooks/useMatches";
import { usePredictions } from "@/hooks/usePredictions";
import { recomputeStandings } from "@/services/firebase/standingsService";

export const useStandingsWorker = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();

  const { matches } = useMatches();
  const { predictions } = usePredictions();

  useEffect(() => {
    if (!user || !isAdmin) return;

    // se dispara automáticamente cuando cambia algo
    recomputeStandings();
  }, [matches, predictions, user, isAdmin]);
};