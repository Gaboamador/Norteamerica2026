import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "../context/ToastContext";
import { useConfirm } from "../context/ConfirmProvider";
import { createGroup, deleteGroup } from "@/services/firebase/firebaseGroups";
import { useAllGroups } from "@/hooks/useAllGroups";
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

  return (
    <section className={styles.wrapper}>
      
      {/* HEADER */}
      <div className={styles.header}>
        <h2 className={styles.title}>Administrar Grupos y Miembros</h2>
      </div>

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