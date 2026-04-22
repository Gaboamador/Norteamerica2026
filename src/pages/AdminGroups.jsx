import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/context/ToastContext";
import { useConfirm } from "@/context/ConfirmProvider";
import { createGroup, deleteGroup } from "@/services/firebase/firebaseGroups";
import { useAllGroups } from "@/hooks/useAllGroups";
import { useStandingsDirtyFlag } from "@/hooks/useStandingsDirtyFlag";
import { recomputeStandings } from "@/services/firebase/standingsService";
import { DirtyBanner } from "@/components/DirtyBanner";
import styles from "./AdminGroups.module.scss";

export default function AdminGroups() {
  const { user } = useAuth();
  const { isAdmin, loading } = useAdmin();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  
  const navigate = useNavigate();

  const groups = useAllGroups();
  
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [link, setLink] = useState("");
  const { dirty, clearDirty } = useStandingsDirtyFlag();

  if (!loading && !isAdmin) {
    navigate("/", { replace: true });
    return null;
  }

  const handleCreate = async (e) => {
    e.preventDefault();

    const groupId = crypto.randomUUID();

    const { joinToken } = await createGroup({
      groupId,
      name,
      ownerUid: user.uid,
      password,
    });

    const inviteLink = `${window.location.origin}/join?group=${groupId}&token=${joinToken}`;

    setLink(inviteLink);
    setName("");
    setPassword("");
  };

  const handleDelete = async (groupId) => {
    
    const confirmed = await confirm({
      title: "Eliminar grupo",
      message: "¿Eliminar grupo vacío?",
    });

    if (!confirmed) return;

    try {
      await deleteGroup(groupId);

      showToast({
        type: "success",
        message: "Grupo eliminado",
      });

    } catch (e) {
      console.error(e);

      showToast({
        type: "error",
        message: "No se pudo eliminar el grupo",
      });
    }
  };

    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    };

    const handleRecompute = async () => {
      try {
        await recomputeStandings();

        clearDirty();

        showToast({
          type: "success",
          message: "Tabla actualizada",
        });
      } catch (err) {
        console.error(err);

        showToast({
          type: "error",
          message: "Error al actualizar la tabla",
        });
      }
    };

    const formatTime = (ts) => {
      if (!ts) return "";
      const d = new Date(ts);
      return d.toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    };

  return (
    <section className={styles.wrapper}>
      
      {/* HEADER */}
      <div className={styles.header}>
        <h2 className={styles.title}>Administrar Grupos y Miembros</h2>
      </div>

      <DirtyBanner/>
      {/* {dirty && (
  <div style={{
    padding: "12px",
    borderRadius: 8,
    marginBottom: 16,
    background: "rgba(255, 193, 7, 0.10)",
    border: "1px solid rgba(255, 193, 7, 0.4)",
    color: "#ffc107",
    fontSize: "0.9rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12
  }}>
    <span style={{ fontWeight: 600 }}>
      ⚠️ Hay cambios en grupos o usuarios. Actualizar tabla.
    </span>

    <button
      onClick={handleRecompute}
      style={{
        padding: "6px 10px",
        borderRadius: 6,
        border: "none",
        background: "#ffc107",
        color: "#000",
        fontWeight: 600,
        cursor: "pointer"
      }}
    >
      Actualizar
    </button>
  </div>
)} */}

      {/* CREATE */}
      <form onSubmit={handleCreate} className={styles.form}>
        <input
          className={styles.input}
          placeholder="Nombre del grupo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          className={styles.input}
          placeholder="Contraseña (opcional)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className={styles.primaryButton}>
          Crear grupo
        </button>
      </form>

      {/* INVITE LINK */}
      {link && (
        <div className={styles.linkBox}>
          <p className={styles.label}>Link de invitación</p>

          <input
            className={styles.input}
            value={link}
            readOnly
          />

          <button
            className={styles.secondaryButton}
            onClick={handleCopy}
          >
            Copiar link
          </button>

          {copied && (
            <span className={styles.copied}>Copiado ✔</span>
          )}
        </div>
      )}

      {/* LIST */}
      <div className={styles.list}>
        <h3 className={styles.sectionTitle}>Grupos existentes</h3>
        {groups.map((g) => {
          const isEmpty = !g.members || g.members.length === 0;

          return (
            <div key={g.id} className={styles.groupItem}>
              <span className={styles.groupName}>
                {g.name}
              </span>

              <div className={styles.actions}>
                {isEmpty && (
                  <button
                    className={styles.dangerButton}
                    onClick={() => handleDelete(g.id)}
                  >
                    Eliminar
                  </button>
                )}

                <button
                  className={styles.secondaryButton}
                  onClick={() =>
                    navigate(`/admin/groups/${g.id}`)
                  }
                >
                  Ver
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}