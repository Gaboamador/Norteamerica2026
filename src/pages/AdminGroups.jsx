import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { createGroup } from "@/services/firebase/firebaseGroups";
import { useAllGroups } from "@/hooks/useAllGroups";

export default function AdminGroups() {
  const { user } = useAuth();
  const { isAdmin, loading } = useAdmin();
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

    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    };

  return (
    <div>
      <h2>Admin - Grupos</h2>

      {/* CREATE */}
      <form onSubmit={handleCreate}>
        <input
          placeholder="Nombre del grupo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          placeholder="Contraseña (opcional)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button>Crear grupo</button>
      </form>

        {link && (
        <div style={{ marginTop: 20 }}>
            <p>Link de invitación:</p>

            <input value={link} readOnly style={{ width: "100%" }} />

            <button onClick={handleCopy} style={{ marginTop: 5 }}>
            Copiar link
            </button>
        </div>
        )}
        {copied && <p>Copiado ✔</p>}

      <hr />

      {/* LISTA DE GRUPOS */}
      <h3>Grupos existentes</h3>

      {groups.map((g) => (
        <div key={g.id} style={{ marginBottom: 10 }}>
          <strong>{g.name}</strong>

          <button
            style={{ marginLeft: 10 }}
            onClick={() => navigate(`/admin/groups/${g.id}`)}
          >
            Ver
          </button>
        </div>
      ))}
    </div>
  );
}