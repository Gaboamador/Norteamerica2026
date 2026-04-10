import { useEffect, useState } from "react";
import { getAllPredictions } from "@/services/firebase/firebaseUtils";
import { buildStandings } from "@/utils/buildStandings";

export const useStandings = () => {
  const [table, setTable] = useState([]);

  useEffect(() => {
    const load = async () => {
      const preds = await getAllPredictions();
      setTable(buildStandings(preds));
    };

    load();
  }, []);

  return table;
};