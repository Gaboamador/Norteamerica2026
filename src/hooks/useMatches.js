import { useEffect, useState } from "react";
import { getAllMatches } from "@/services/firebase/firebaseUtils";

export const useMatches = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await getAllMatches();
    setMatches(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return {
    matches,
    loading,
    reload: load,
  };
};