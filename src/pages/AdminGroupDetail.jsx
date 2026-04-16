import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "@/services/firebase/firebase";
import { removeUserFromGroup, regenerateJoinToken, buildInviteLink } from "@/services/firebase/firebaseGroups";
import styles from "./AdminGroupDetail.module.scss";

export default function AdminGroupDetail() {
    const { groupId } = useParams();
    const [group, setGroup] = useState(null);
    const [users, setUsers] = useState({});
    const [inviteLink, setInviteLink] = useState("");
    const [copied, setCopied] = useState(false);

    const handleGenerateLink = async () => {
        const token = await regenerateJoinToken(group.id);
        const link = buildInviteLink(group.id, token);
        setInviteLink(link);
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    useEffect(() => {
        const ref = doc(db, "groups", groupId);

        const unsub = onSnapshot(ref, async (snap) => {
            if (!snap.exists()) return;

            const data = { id: snap.id, ...snap.data() };
            setGroup(data);

            // 🔥 traer users
            const userMap = {};

            await Promise.all(
                (data.members || []).map(async (uid) => {
                    const userSnap = await getDoc(doc(db, "users", uid));

                    if (userSnap.exists()) {
                        userMap[uid] = userSnap.data();
                    } else {
                        userMap[uid] = { uid, displayName: "Unknown", email: "-" };
                    }
                })
            );

            setUsers(userMap);
        });

        return () => unsub();
    }, [groupId]);

    if (!group) return <div>Cargando...</div>;

    return (
    <section className={styles.wrapper}>
      
      {/* HEADER */}
      <div className={styles.header}>
        <h2 className={styles.title}>{group.name}</h2>
      </div>

      {/* INVITE */}
      <div className={styles.inviteBox}>
        <button
          className={styles.primaryButton}
          onClick={handleGenerateLink}
        >
          Generar link de invitación
        </button>

        {inviteLink && (
          <>
            <input
              className={styles.input}
              value={inviteLink}
              readOnly
            />

            <button
              className={styles.secondaryButton}
              onClick={handleCopy}
            >
              Copiar link
            </button>
          </>
        )}

        {copied && (
          <span className={styles.copied}>Copiado ✔</span>
        )}
      </div>

      {/* MEMBERS */}
      <div className={styles.members}>
        <h3 className={styles.sectionTitle}>Miembros</h3>

        {group.members?.map((uid) => {
          const u = users[uid];

          return (
            <div key={uid} className={styles.member}>
              
              <div className={styles.memberInfo}>
                <span className={styles.name}>
                  {u?.displayName}
                </span>
                <span className={styles.email}>
                  {u?.email}
                </span>
                <span className={styles.uid}>
                  {uid}
                </span>
              </div>

              <button
                className={styles.dangerButton}
                onClick={() =>
                  removeUserFromGroup(group.id, uid)
                }
              >
                Eliminar
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}