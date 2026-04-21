import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export const ensureUserDoc = async (user) => {
  if (!user) return;

  // 🔥 SIEMPRE refrescar primero
  await user.reload?.();

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  // 🔥 SIEMPRE calcular displayName una sola vez
  const displayName =
    user.displayName ||
    user.email?.split("@")[0] ||
    null;

  // 🔴 si no hay nombre usable → cortar
  if (!displayName) return;

  // 🔵 crear user si no existe
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      displayName,
      email: user.email,
      createdAt: serverTimestamp(),
    });
  }

  // 🔵 asegurar username SIEMPRE (independiente de users)
  const usernameRef = doc(db, "usernames", displayName);
  const usernameSnap = await getDoc(usernameRef);

  if (!usernameSnap.exists()) {
    await setDoc(usernameRef, {
      uid: user.uid,
    });
  }
};