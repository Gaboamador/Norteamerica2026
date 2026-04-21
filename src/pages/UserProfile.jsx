import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/services/firebase/firebase";
import {
  doc,
  updateDoc,
  getDoc,
  serverTimestamp,
  setDoc,
  deleteDoc
} from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { recoverPassword } from "@/services/firebase/firebaseAuth";
import { useToast } from "@/context/ToastContext";
import styles from "./UserProfile.module.scss";

export default function UserProfile() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasChangedName, setHasChangedName] = useState(false);
  const [nameStatus, setNameStatus] = useState("idle");

  // avatar
  const [imgError, setImgError] = useState(false);
  const photo = user?.photoURL || null;

  useEffect(() => {
    setImgError(false);
  }, [photo]);

  // obtener estado del usuario
  useEffect(() => {
    const fetchUserDoc = async () => {
      if (!user) return;

      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      const data = snap.data();

      setHasChangedName(!!data?.displayNameUpdatedAt);
    };

    fetchUserDoc();
  }, [user]);

  // validación reactiva
  useEffect(() => {
    const newName = name.trim();

    if (!name) {
      setNameStatus("idle");
      return;
    }

    // si coincide con el actual → no mostramos nada
    if (newName === user?.displayName) {
      setNameStatus("idle");
      return;
    }

    if (newName.length < 3) {
      setNameStatus("invalid");
      return;
    }

    if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(newName)) {
      setNameStatus("invalid");
      return;
    }

    setNameStatus("checking");

    const timeout = setTimeout(async () => {
      const ref = doc(db, "usernames", newName);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        setNameStatus("available");
      } else {
        setNameStatus("taken");
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [name, user]);

  // guardar
  const handleSave = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      const userDoc = snap.data();

      const oldName = userDoc.displayName;
      const newName = name.trim();

      if (userDoc?.displayNameUpdatedAt) {
        showToast({
          type: "error",
          message: "Solo podés cambiar tu nombre una vez",
        });
        return;
      }

      if (nameStatus !== "available") {
        return;
      }

      await updateDoc(ref, {
        displayName: newName,
        displayNameUpdatedAt: serverTimestamp(),
      });

      await updateProfile(user, {
        displayName: newName,
      });

      // index usernames
      await setDoc(doc(db, "usernames", newName), {
        uid: user.uid,
      });

      if (oldName && oldName !== newName) {
        await deleteDoc(doc(db, "usernames", oldName));
      }

      showToast({
        type: "success",
        message: "Nombre actualizado correctamente",
      });

      setName(""); // limpiar input

    } catch (err) {
      showToast({
        type: "error",
        message: "Error al actualizar el nombre",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);

      await recoverPassword(user.email);

      showToast({
        type: "success",
        message: "Te enviamos un correo para cambiar tu contraseña",
      });
    } catch (err) {
      showToast({
        type: "error",
        message: "No se pudo enviar el correo",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.title}>Mi perfil</div>

      {/* Avatar */}
      <div className={styles.profileHeader}>
        {photo && !imgError ? (
          <img
            src={photo}
            alt="avatar"
            className={styles.avatar}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={styles.avatarFallback}>
            {user?.displayName?.charAt(0)?.toUpperCase()}
          </div>
        )}

        <div className={styles.email}>{user?.email}</div>
      </div>

      {/* Nombre actual */}
      <div className={styles.section}>
        <div className={styles.label}>Nombre actual</div>
        <div className={styles.currentName}>
          {user?.displayName}
        </div>
      </div>

      {/* Cambio de nombre */}
      <div className={styles.section}>
        <label className={styles.label}>
          Cambiar nombre de usuario
        </label>

        <input
          value={name}
          className={styles.input}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ingresar nuevo nombre"
          disabled={hasChangedName}
        />

        {nameStatus !== "idle" && (
          <p
            className={`${styles.validation} ${
              nameStatus === "available" ? styles.ok : styles.error
            }`}
          >
            {nameStatus === "invalid" && "El nombre es inválido"}
            {nameStatus === "checking" && "Verificando..."}
            {nameStatus === "available" && "Nombre disponible"}
            {nameStatus === "taken" && "Ese nombre ya está en uso"}
          </p>
        )}

        <p className={styles.hint}>
          {hasChangedName
            ? "Ya utilizaste tu cambio de nombre."
            : "Podés cambiar tu nombre solo una vez."}
        </p>

        <button
          onClick={handleSave}
          disabled={
            loading ||
            hasChangedName ||
            nameStatus !== "available"
          }
          className={styles.button}
        >
          Guardar cambios
        </button>
      </div>

      {/* Cuenta */}
      <div className={styles.section}>
        <div className={styles.label}>Cuenta</div>

        <div className={styles.infoRow}>
          <span>Email</span>
          <span>{user?.email}</span>
        </div>
      </div>

      {/* Password */}
      <div className={styles.section}>
        <button
          className={styles.secondaryButton}
          onClick={handlePasswordReset}
          disabled={loading}
        >
          Cambiar contraseña
        </button>
      </div>
    </div>
  );
}