import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  arrayUnion,
  serverTimestamp,
  getDoc,
  arrayRemove
} from "firebase/firestore";
import { db } from "./firebase";

// import { getAllPredictions } from "./firebaseUtils";
// import { buildStandings } from "@/utils/buildStandings";
// import { filterStandingsByGroup } from "@/utils/filterStandingsByGroup";
// import { saveGroupStandings } from "./firebaseStandings";

/**
 * ===============================
 * HELPERS
 * ===============================
 */

export const generateJoinToken = () => {
  return Math.random().toString(36).substring(2, 8);
};

/**
 * ===============================
 * CREATE GROUP
 * ===============================
 */

export const createGroup = async ({
  groupId,
  name,
  ownerUid,
  password,
}) => {
  const ref = doc(db, "groups", groupId);

  const joinToken = generateJoinToken();

  await setDoc(ref, {
    name,
    ownerUid,
    members: [ownerUid],
    password: password || null,
    joinToken,
    createdAt: serverTimestamp(),
  });

  // standings inicial
  const standingsRef = doc(db, "groups", groupId, "standings", "main");

  await setDoc(standingsRef, {
    table: [],
    updatedAt: null,
  });

    // recalcular standings iniciales del grupo
  // const allPredictions = await getAllPredictions();
  // const globalStandings = buildStandings(allPredictions);

  // const groupStandings = filterStandingsByGroup(
  //   globalStandings,
  //   [ownerUid]
  // );

  // await saveGroupStandings(groupId, groupStandings);

  return { groupId, joinToken };
};


/**
 * ===============================
 * DELETE GROUP
 * ===============================
 */
export const deleteGroup = async (groupId) => {
  const ref = doc(db, "groups", groupId);

  const snap = await getDoc(ref);

  if (!snap.exists()) {
    throw new Error("Grupo no existe");
  }

  const data = snap.data();

  if ((data.members || []).length > 0) {
    throw new Error("No se puede eliminar un grupo con miembros");
  }

  // 1. borrar subcolección standings
  const standingsRef = collection(db, "groups", groupId, "standings");
  const snaps = await getDocs(standingsRef);

  await Promise.all(snaps.docs.map((d) => deleteDoc(d.ref)));

  // 2. borrar el grupo
  await deleteDoc(ref);
};


/**
 * ===============================
 * JOIN GROUP
 * ===============================
 */

export const joinGroup = async ({
  groupId,
  uid,
  token,
  password,
}) => {
  const ref = doc(db, "groups", groupId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    throw new Error("Grupo no existe");
  }

  const group = snap.data();

  if (group.joinToken !== token) {
    throw new Error("Invitación inválida");
  }

  if (group.password && group.password !== password) {
    throw new Error("Contraseña incorrecta");
  }

  await updateDoc(ref, {
    members: arrayUnion(uid),
  });

  // volver a leer el grupo ya actualizado
  // const updatedSnap = await getDoc(ref);
  // const updatedGroup = updatedSnap.data();

  // // recalcular standings del grupo con sus miembros actuales
  // const allPredictions = await getAllPredictions();
  // const globalStandings = buildStandings(allPredictions);

  // const groupStandings = filterStandingsByGroup(
  //   globalStandings,
  //   updatedGroup.members || []
  // );

  // await saveGroupStandings(groupId, groupStandings);
};

/**
 * ===============================
 * ADMIN (opcional)
 * ===============================
 */

export const addUserToGroup = async (groupId, uid) => {
  const ref = doc(db, "groups", groupId);

  await updateDoc(ref, {
    members: arrayUnion(uid),
  });
};

/**
 * ===============================
 * REMOVE MEMBER (ADMIN)
 * ===============================
 */
export const removeUserFromGroup = async (groupId, uid) => {
  const ref = doc(db, "groups", groupId);

  await updateDoc(ref, {
    members: arrayRemove(uid),
  });
};

/**
 * ===============================
 * GENERAR LINK DE INVITACIÓN A GRUPO
 * ===============================
 */
export const buildInviteLink = (groupId, token) => {
  return `${window.location.origin}/join?group=${groupId}&token=${token}`;
};

/**
 * ===============================
 * REGENERAR LINK DE INVITACIÓN A GRUPO EXISTENTE
 * ===============================
 */
export const regenerateJoinToken = async (groupId) => {
  const ref = doc(db, "groups", groupId);

  const newToken = generateJoinToken();

  await updateDoc(ref, {
    joinToken: newToken,
  });

  return newToken;
};