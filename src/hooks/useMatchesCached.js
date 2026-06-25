import { useEffect, useState } from "react";
import {
  getMatchesSessionSnapshot,
  startMatchesSession,
  subscribeMatchesSession,
} from "@/stores/matchesSessionStore";

export function useMatchesCached() {
  const [sessionState, setSessionState] = useState(() =>
    getMatchesSessionSnapshot()
  );

  useEffect(() => {
    const unsubscribe = subscribeMatchesSession(setSessionState);

    return unsubscribe;
  }, []);

  useEffect(() => {
    startMatchesSession();
  }, []);

  return {
    matches: sessionState.matches,
    loading: sessionState.loading,
  };
}