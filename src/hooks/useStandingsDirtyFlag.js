// import { useEffect, useRef, useState } from "react";
// import { collection, doc, onSnapshot } from "firebase/firestore";
// import { db } from "@/services/firebase/firebase";
// import { useAuth } from "@/hooks/useAuth";
// import { useAdmin } from "@/hooks/useAdmin";
// import { computeGroupsSig, computeUsersSig } from "@/services/firebase/standingsService";

// export const useStandingsDirtyFlag = () => {
//   const { user } = useAuth();
//   const { isAdmin, loading } = useAdmin();

//   const [dirty, setDirty] = useState(false);

//   const baselineRef = useRef(null);       // { groupsSig, usersSig } leído de Firestore
//   const lastGroupsSigRef = useRef(null);
//   const lastUsersSigRef = useRef(null);

//   useEffect(() => {
//     if (!user || loading || !isAdmin) return;

//     // Reseteamos al remontar
//     baselineRef.current = null;
//     lastGroupsSigRef.current = null;
//     lastUsersSigRef.current = null;
//     setDirty(false);

//     const check = () => {
//       if (
//         !baselineRef.current ||
//         lastGroupsSigRef.current === null ||
//         lastUsersSigRef.current === null
//       ) return;

//       const isDirty =
//         lastGroupsSigRef.current !== baselineRef.current.groupsSig ||
//         lastUsersSigRef.current !== baselineRef.current.usersSig;

//       setDirty(isDirty);
//     };

//     // Listener del baseline guardado en Firestore
//     const unsubBaseline = onSnapshot(doc(db, "standings", "baseline"), (snap) => {
//       if (snap.exists()) {
//         baselineRef.current = {
//           groupsSig: snap.data().groupsSig,
//           usersSig: snap.data().usersSig,
//         };
//       } else {
//         // Nunca se hizo recompute: tomamos el estado actual como baseline limpio
//         baselineRef.current = {
//           groupsSig: lastGroupsSigRef.current,
//           usersSig: lastUsersSigRef.current,
//         };
//       }
//       check();
//     });

//     const unsubGroups = onSnapshot(collection(db, "groups"), (snap) => {
//       lastGroupsSigRef.current = computeGroupsSig(snap.docs);
//       check();
//     });

//     const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
//       lastUsersSigRef.current = computeUsersSig(snap.docs);
//       check();
//     });

//     return () => {
//       unsubBaseline();
//       unsubGroups();
//       unsubUsers();
//     };
//   }, [user, isAdmin, loading]);

//   // clearDirty ya no necesita hacer nada extra:
//   // recomputeStandings escribe el baseline en Firestore,
//   // el listener lo recibe y check() pone dirty = false solo.
//   const clearDirty = () => setDirty(false);

//   return { dirty, clearDirty };
// };
import { useEffect, useRef, useState } from "react";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { db } from "@/services/firebase/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";

// Helpers locales — reciben objetos planos { id, members } o { id, displayName }
function sigFromGroupDocs(docs) {
  return JSON.stringify(
    docs
      .map((d) => ({ id: d.id, members: d.members }))
      .sort((a, b) => a.id.localeCompare(b.id))
  );
}

function sigFromUserDocs(docs) {
  return JSON.stringify(
    docs
      .map((d) => ({ id: d.id, displayName: d.displayName }))
      .sort((a, b) => a.id.localeCompare(b.id))
  );
}

function computeGroupsDiff(baselineSig, currentDocs, usersMap) {
  if (!baselineSig) return [];
  const baseline = JSON.parse(baselineSig);
  const baselineMap = Object.fromEntries(baseline.map((g) => [g.id, g.members]));
  const changes = [];

  for (const { id, members } of currentDocs) {
    const prev = baselineMap[id];
    if (!prev) continue;

    const added = members.filter((m) => !prev.includes(m));
    const removed = prev.filter((m) => !members.includes(m));

    if (added.length || removed.length) {
      changes.push({
        groupId: id,
        added: added.map((uid) => usersMap[uid] || uid),
        removed: removed.map((uid) => usersMap[uid] || uid),
      });
    }
  }

  return changes;
}

function computeUsersDiff(baselineSig, currentDocs) {
  if (!baselineSig) return [];
  const baseline = JSON.parse(baselineSig);
  const baselineMap = Object.fromEntries(baseline.map((u) => [u.id, u.displayName]));
  const changes = [];

  for (const { id, displayName } of currentDocs) {
    const prev = baselineMap[id];
    if (prev !== undefined && prev !== displayName) {
      changes.push({ userId: id, from: prev, to: displayName });
    }
  }

  return changes;
}

export const useStandingsDirtyFlag = () => {
  const { user } = useAuth();
  const { isAdmin, loading } = useAdmin();

  const [dirty, setDirty] = useState(false);
  const [changes, setChanges] = useState({ groups: [], users: [] });

  const baselineRef = useRef(null);
  const lastGroupsDocsRef = useRef(null); // [{ id, members }]
  const lastUsersDocsRef = useRef(null);  // [{ id, displayName }]
  const usersMapRef = useRef({});         // { uid: displayName }

  useEffect(() => {
    if (!user || loading || !isAdmin) return;

    baselineRef.current = null;
    lastGroupsDocsRef.current = null;
    lastUsersDocsRef.current = null;
    usersMapRef.current = {};
    setDirty(false);
    setChanges({ groups: [], users: [] });

    const check = () => {
      if (
        !baselineRef.current ||
        lastGroupsDocsRef.current === null ||
        lastUsersDocsRef.current === null
      ) return;

      const groupsSig = sigFromGroupDocs(lastGroupsDocsRef.current);
      const usersSig = sigFromUserDocs(lastUsersDocsRef.current);

      const isDirty =
        groupsSig !== baselineRef.current.groupsSig ||
        usersSig !== baselineRef.current.usersSig;

      setChanges(
        isDirty
          ? {
              groups: computeGroupsDiff(
                baselineRef.current.groupsSig,
                lastGroupsDocsRef.current,
                usersMapRef.current
              ),
              users: computeUsersDiff(
                baselineRef.current.usersSig,
                lastUsersDocsRef.current
              ),
            }
          : { groups: [], users: [] }
      );

      setDirty(isDirty);
    };

    const unsubBaseline = onSnapshot(doc(db, "standings", "baseline"), (snap) => {
      baselineRef.current = snap.exists()
        ? { groupsSig: snap.data().groupsSig, usersSig: snap.data().usersSig }
        : {
            groupsSig: lastGroupsDocsRef.current
              ? sigFromGroupDocs(lastGroupsDocsRef.current)
              : null,
            usersSig: lastUsersDocsRef.current
              ? sigFromUserDocs(lastUsersDocsRef.current)
              : null,
          };
      check();
    });

    const unsubGroups = onSnapshot(collection(db, "groups"), (snap) => {
      lastGroupsDocsRef.current = snap.docs.map((d) => ({
        id: d.id,
        members: (d.data().members || []).slice().sort(),
      }));
      check();
    });

    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      lastUsersDocsRef.current = snap.docs.map((d) => ({
        id: d.id,
        displayName: d.data().displayName || "",
      }));
      usersMapRef.current = Object.fromEntries(
        snap.docs.map((d) => [d.id, d.data().displayName || d.id])
      );
      check();
    });

    return () => {
      unsubBaseline();
      unsubGroups();
      unsubUsers();
    };
  }, [user, isAdmin, loading]);

  const clearDirty = () => setDirty(false);

  return { dirty, clearDirty, changes };
};