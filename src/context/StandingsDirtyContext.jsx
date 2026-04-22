import { createContext, useContext } from "react";
import { useStandingsDirtyFlag } from "@/hooks/useStandingsDirtyFlag";

const StandingsDirtyContext = createContext(null);

export function StandingsDirtyProvider({ children }) {
  const { dirty, clearDirty, changes } = useStandingsDirtyFlag();

  return (
    <StandingsDirtyContext.Provider value={{ dirty, clearDirty, changes }}>
      {children}
    </StandingsDirtyContext.Provider>
  );
}

export function useStandingsDirty() {
  return useContext(StandingsDirtyContext);
}