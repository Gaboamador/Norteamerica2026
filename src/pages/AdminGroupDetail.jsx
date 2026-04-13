import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "@/services/firebase/firebase";
import { removeUserFromGroup, regenerateJoinToken, buildInviteLink } from "@/services/firebase/firebaseGroups";

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
        <div>
            <h2>{group.name}</h2>

            <div style={{ marginBottom: 20 }}>
                <button onClick={handleGenerateLink}>
                    Generar link de invitación
                </button>

                {inviteLink && (
                    <>
                    <input value={inviteLink} readOnly style={{ width: "100%", marginTop: 10 }} />
                    <button onClick={handleCopy} style={{ marginTop: 5 }}>
                        Copiar link
                    </button>
                    </>
                )}

                {copied && <p>Copiado ✔</p>}
            </div>

            <h3>Miembros</h3>

            {group.members?.map((uid) => {
                const u = users[uid];

                return (
                    <div key={uid} style={{ marginBottom: 10 }}>
                        <strong>{u?.displayName}</strong> — {u?.email}
                        <div style={{ fontSize: 12, color: "#666" }}>{uid}</div>

                        <button
                            style={{ marginTop: 5 }}
                            onClick={() => removeUserFromGroup(group.id, uid)}
                        >
                            Eliminar
                        </button>
                    </div>
                );
            })}
        </div>
    );
}