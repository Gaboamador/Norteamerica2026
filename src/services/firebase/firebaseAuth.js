import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

import { auth } from "./firebase";

/**
 * ===============================
 * MENSAJES DE ERROR CUSTOM
 * ===============================
 */

export const firebaseErrorMessages = {
  "auth/email-already-in-use": "Este correo ya está registrado.",
  "auth/invalid-email": "El correo electrónico no es válido.",
  "auth/user-not-found": "No se encontró un usuario con ese correo.",
  "auth/wrong-password": "La contraseña es incorrecta.",
  "auth/invalid-credential": "Correo o contraseña incorrectos.",
  "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
  "auth/missing-password": "Por favor, ingresá una contraseña.",
  "auth/network-request-failed": "Error de conexión. Verificá tu red.",
};

/**
 * ===============================
 * LOGIN
 * ===============================
 */

export const loginWithEmail = async (email, password) => {
  if (!email || !password) {
    throw {
      code: "auth/missing-fields",
      message: "Email y contraseña requeridos",
    };
  }

  return await signInWithEmailAndPassword(auth, email, password);
};

/**
 * ===============================
 * REGISTRO
 * ===============================
 */

export const registerWithEmail = async ({
  email,
  password,
  firstName,
}) => {
  if (!email || !password || !firstName) {
    throw {
      code: "auth/missing-fields",
      message: "Faltan campos obligatorios",
    };
  }

  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  const user = userCredential.user;

  // displayName = "Nombre Apellido"
  const displayName = `${firstName.trim()}`;
  await updateProfile(user, { displayName });

  // mail de verificación
  await sendEmailVerification(user);

  return userCredential;
};

/**
 * ===============================
 * RECUPERAR CONTRASEÑA
 * ===============================
 */

export const recoverPassword = async (email) => {
  if (!email) {
    throw {
      code: "auth/missing-email",
      message: "Email requerido",
    };
  }

  await sendPasswordResetEmail(auth, email);
};

/**
 * ===============================
 * LOGOUT
 * ===============================
 */

export const logout = async () => {
  await signOut(auth);
};

/**
 * ===============================
 * OBSERVER DE AUTH
 * ===============================
 * Útil para:
 * - bootstrap de la app
 * - sync con store / context
 */

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};
