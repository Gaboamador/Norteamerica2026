import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  onAuthStateChanged,
  reload,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

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

// export const loginWithEmail = async (email, password) => {
//   if (!email || !password) {
//     throw {
//       code: "auth/missing-fields",
//       message: "Email y contraseña requeridos",
//     };
//   }

//   return await signInWithEmailAndPassword(auth, email, password);
// };
  export const loginWithEmail = async (email, password) => {
    if (!email || !password) {
      throw {
        code: "auth/missing-fields",
        message: "Email y contraseña requeridos",
      };
    }

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;

    // Refresca el estado real del usuario en Firebase Auth
    await reload(user);

    if (!auth.currentUser?.emailVerified) {
      // await signOut(auth);

      throw {
        code: "auth/email-not-verified",
        message: "Tenés que verificar tu correo antes de ingresar.",
      };
    }

    return userCredential;
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
  lastName,
}) => {
  if (!email || !password || !firstName|| !lastName) {
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
  const displayName = `${firstName.trim()} ${lastName.trim()}`;
  await updateProfile(user, { displayName });

  // agregar usuario a colección 'users'
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    displayName,
    email: user.email,
    createdAt: serverTimestamp(),
  });

  // mail de verificación
  await sendEmailVerification(user);

   // Muy importante: no dejar sesión abierta
  await signOut(auth);

  // return userCredential;
    return {
      success: true,
      requiresEmailVerification: true,
    };
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


/**
 * ===============================
 * REENVIAR VERIFICACIÓN
 * ===============================
 */

export const resendVerificationEmail = async () => {
  const user = auth.currentUser;

  if (!user) {
    throw {
      code: "auth/no-current-user",
      message: "No hay usuario autenticado",
    };
  }

  await sendEmailVerification(user);
};

/**
 * ===============================
 * REFRESCAR USUARIO
 * ===============================
 */

export const reloadCurrentUser = async () => {
  const user = auth.currentUser;

  if (!user) {
    throw {
      code: "auth/no-current-user",
      message: "No hay usuario autenticado",
    };
  }

  await reload(user);

  return auth.currentUser;
};