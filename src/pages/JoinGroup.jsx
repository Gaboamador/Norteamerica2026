import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/services/firebase/firebase";
import { useAuth } from "@/hooks/useAuth";
import { joinGroup } from "@/services/firebase/firebaseGroups";
import { useToast } from "@/context/ToastContext";
import styles from "./JoinGroup.module.scss"

export default function JoinGroup() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { showToast } = useToast();

  const [group, setGroup] = useState(null);
  const [checking, setChecking] = useState(true);
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [password, setPassword] = useState("");
  const [loadingJoin, setLoadingJoin] = useState(false);

  const groupId = params.get("group");
  const token = params.get("token");

  useEffect(() => {
    if (loading) return;

    if (!user) {
      sessionStorage.setItem(
        "na2026_post_auth_redirect",
        window.location.pathname + window.location.search
      );

      navigate("/auth", { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const run = async () => {
      if (loading) return;

      if (!groupId || !token) {
        setGroup(null);
        setChecking(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "groups", groupId));

        if (!snap.exists()) {
          setGroup(null);
          return;
        }

        const data = snap.data();
        setGroup(data);
        setAlreadyMember(
          Boolean(user && Array.isArray(data.members) && data.members.includes(user.uid))
        );
      } catch (err) {
        console.error("Error cargando grupo:", err);
        setGroup(null);
        showToast({
          type: "error",
          message: "Error cargando grupo",
        });
      } finally {
        setChecking(false);
      }
    };

    run();
  }, [groupId, token, user, loading, showToast]);

  const handleJoin = async () => {
    if (!group || !user) return;

    if (group.password && !password.trim()) {
      showToast({
        type: "error",
        message: "Ingresá la contraseña del grupo",
      });
      return;
    }

    try {
      setLoadingJoin(true);

      await joinGroup({
        groupId,
        uid: user.uid,
        token,
        password: password.trim(),
      });

      showToast({
        type: "success",
        message: `Te uniste a ${group.name}`,
      });

      navigate("/standings");
    } catch (err) {
      showToast({
        type: "error",
        message: err?.message || "Error al unirse al grupo",
      });
    } finally {
      setLoadingJoin(false);
    }
  };

  /* ===== STATES ===== */
  if (loading || checking) {
    return (
      <section className={styles.wrapper}>
        <div className={styles.card}>
          <h2 className={styles.title}>Unirse al grupo</h2>
          <p className={styles.message}>Cargando...</p>
        </div>
      </section>
    );
  }

  if (!groupId || !token) {
    return (
      <section className={styles.wrapper}>
        <div className={styles.card}>
          <h2 className={styles.title}>Unirse al grupo</h2>
          <p className={styles.message}>Link inválido.</p>
        </div>
      </section>
    );
  }

  if (!group) {
    return (
      <section className={styles.wrapper}>
        <div className={styles.card}>
          <h2 className={styles.title}>Unirse al grupo</h2>
          <p className={styles.message}>Grupo no encontrado.</p>
        </div>
      </section>
    );
  }

  if (alreadyMember) {
    return (
      <section className={styles.wrapper}>
        <div className={styles.card}>
          <h2 className={styles.title}>Unirse al grupo</h2>

          <p className={styles.message}>
            Ya sos miembro de <strong>{group.name}</strong> ✔
          </p>

          <button
            className={styles.primaryButton}
            onClick={() => navigate("/standings")}
          >
            Ir a tabla
          </button>
        </div>
      </section>
    );
  }

  /* ===== NORMAL ===== */
  return (
    <section className={styles.wrapper}>
      <div className={styles.card}>
        <h2 className={styles.title}>Unirse al grupo</h2>

        <p className={styles.message}>
          Te estás uniendo a: <strong>{group.name}</strong>
        </p>

        {group.password && (
          <input
            className={styles.input}
            type="password"
            placeholder="Contraseña del grupo"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        )}

        <button
          className={styles.primaryButton}
          onClick={handleJoin}
          disabled={loadingJoin}
        >
          {loadingJoin ? "Uniéndose..." : "Unirse"}
        </button>
      </div>
    </section>
  );
}