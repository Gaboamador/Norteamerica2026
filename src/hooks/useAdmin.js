import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/services/firebase/firebase";
import { useAuth } from "@/hooks/useAuth";

export const useAdmin = () => {
  const { user, loading: authLoading } = useAuth();

  const [isAdmin, setIsAdmin] = useState(false);
  const [canCreateMatches, setCanCreateMatches] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setIsAdmin(false);
      setCanCreateMatches(false);
      setLoading(false);
      return;
    }

    const checkAdmin = async () => {
      try {
        setLoading(true);

        const ref = doc(db, "admins", user.uid);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setIsAdmin(false);
          setCanCreateMatches(false);
          return;
        }

        const data = snap.data();

        setIsAdmin(data.role === "admin");
        setCanCreateMatches(data.canCreateMatches === true);
      } catch (err) {
        console.error("Error checking admin:", err);
        setIsAdmin(false);
        setCanCreateMatches(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [user, authLoading]);

  return {
    isAdmin,
    canCreateMatches,
    loading: authLoading || loading,
  };
};