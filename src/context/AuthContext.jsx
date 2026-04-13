import { createContext, useEffect, useState } from "react";
import {
  onAuthChange,
  loginWithEmail,
  registerWithEmail,
  logout,
} from "@/services/firebase/firebaseAuth";
import { ensureUserDoc } from "@/services/firebase/firebaseUsers";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        // 🔥 wrapper async
        (async () => {
          try {
            await ensureUserDoc(firebaseUser);
          } catch (err) {
            console.error("Error ensureUserDoc:", err);
          }
        })();
      }
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,

    login: loginWithEmail,
    register: registerWithEmail,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};