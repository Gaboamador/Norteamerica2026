import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  loginWithEmail,
  registerWithEmail,
  recoverPassword,
  firebaseErrorMessages,
  resendVerificationEmail,
  reloadCurrentUser,
} from "@/services/firebase/firebaseAuth";
import { FiEye, FiEyeOff } from "react-icons/fi";
import styles from "./AuthScreen.module.scss";

export default function AuthScreen() {
  const [mode, setMode] = useState("login"); 
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const resetErrors = () => setError("");

  useEffect(() => {
    if (location.state?.mode === "verify") {
      setMode("verify");
      setMessage("Tenés que verificar tu correo para continuar.");
    }
  }, [location.state]);

  function redirectAfterAuth() {
    const redirect =
      sessionStorage.getItem("na2026_post_auth_redirect");

    if (redirect) {
      sessionStorage.removeItem("na2026_post_auth_redirect");
      navigate(redirect, { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    resetErrors();
    setMessage("");

    try {
      setLoading(true);
      await loginWithEmail(email, password);
      redirectAfterAuth();
    } catch (err) {
      if (err.code === "auth/email-not-verified") {
        setMode("verify");
        setMessage(
          "Tenés que verificar tu correo antes de ingresar."
        );
        return;
      }

      setError(
        firebaseErrorMessages[err.code] ??
        err?.message ??
        "Error logging in"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    resetErrors();
    setMessage("");

    if (password !== repeatPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    try {
      setLoading(true);

      const result = await registerWithEmail({
        email,
        password,
        firstName,
        lastName,
      });

      if (result?.requiresEmailVerification) {
        setMode("verify");
        setMessage(
          "Te enviamos un correo de verificación. Verificá tu email antes de iniciar sesión."
        );

        setMode("login");
        setPassword("");
        setRepeatPassword("");
        return;
      }

      redirectAfterAuth();
    } catch (err) {
      setError(
        firebaseErrorMessages[err.code] ??
        err?.message ??
        "Error creando la cuenta"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = async (e) => {
    e.preventDefault();
    resetErrors();
    setMessage("");

    try {
      setLoading(true);
      await recoverPassword(email);
      setMessage(
        "Si el email existe, recibirás un mensaje de recuperación"
      );
    } catch (err) {
      setError(
        firebaseErrorMessages[err.code] ??
        "Error enviando mensaje de recuperación"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authScreen}>
      <h2 className={styles.title}>
        {mode === "login" && "Iniciar sesión"}
        {mode === "register" && "Crear cuenta"}
        {mode === "recovery" && "Recuperar contraseña"}
      </h2>

      {mode === "login" && (
        <form
          onSubmit={handleLogin}
          className={styles.form}
        >
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            required
          />

          <div className={styles.passwordWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              required
            />
            <button
              type="button"
              className={styles.eyeButton}
              onClick={() => setShowPassword(v => !v)}
              tabIndex={-1}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          <div className={styles.loginButtonWrapper}>
            <button
              disabled={loading}
              className={styles.loginButton}
            >
              Iniciar sesión
            </button>
          </div>

          <div className={styles.authLinks}>
            <button
              type="button"
              className={styles.linkButton}
              onClick={() => {
                resetErrors();
                setMode("register");
              }}
            >
              Crear cuenta
            </button>

            <button
              type="button"
              className={styles.linkButton}
              onClick={() => {
                resetErrors();
                setMode("recovery");
              }}
            >
              Olvidé mi contraseña
            </button>
          </div>
        </form>
      )}

      {mode === "register" && (
        <form
          onSubmit={handleRegister}
          className={styles.form}
        >
          <input
            type="text"
            placeholder="Nombre"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={styles.input}
            required
          />

          <input
            type="text"
            placeholder="Apellido"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={styles.input}
            required
          />

          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            required
          />

          <div className={styles.passwordWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              required
            />
            <button
              type="button"
              className={styles.eyeButton}
              onClick={() => setShowPassword(v => !v)}
              tabIndex={-1}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          <div className={styles.passwordWrapper}>
            <input
              type={showRepeatPassword ? "text" : "password"}
              placeholder="Repetir contraseña"
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              className={styles.input}
              required
            />
            <button
              type="button"
              className={styles.eyeButton}
              onClick={() => setShowRepeatPassword(v => !v)}
              tabIndex={-1}
            >
              {showRepeatPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          <button
            className={styles.primaryButton}
            disabled={loading}
          >
            Crear cuenta
          </button>

          <div className={styles.authLinks}>
            <button
              type="button"
              className={styles.linkButton}
              onClick={() => {
                resetErrors();
                setMode("login");
              }}
            >
              Ya tengo una cuenta
            </button>
          </div>
        </form>
      )}

      {mode === "recovery" && (
        <form
          onSubmit={handleRecovery}
          className={styles.form}
        >
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            required
          />

          <button
            className={styles.primaryButton}
            disabled={loading}
          >
            Enviar correo de recuperación de contraseña
          </button>

          <div className={styles.authLinks}>
            <button
              type="button"
              className={styles.linkButton}
              onClick={() => {
                resetErrors();
                setMode("login");
              }}
            >
              Volver a la pantalla de inicio de sesión
            </button>
          </div>
        </form>
      )}

      {mode === "verify" && (
        <div className={styles.verifyContainer}>
          <p className={styles.verifyText}>
            Necesitás verificar tu correo electrónico para continuar.
          </p>

          <button
            className={styles.primaryButton}
            disabled={loading}
            onClick={async () => {
              try {
                setLoading(true);
                setMessage("");
                await resendVerificationEmail();
                setMessage("Te reenviamos el correo de verificación.");
              } catch (err) {
                setError(
                  firebaseErrorMessages[err.code] ??
                  err?.message ??
                  "No se pudo reenviar el correo"
                );
              } finally {
                setLoading(false);
              }
            }}
          >
            Reenviar correo
          </button>

          <button
            className={styles.secondaryButton}
            disabled={loading}
            onClick={async () => {
              try {
                setLoading(true);
                setError("");
                setMessage("");

                const user = await reloadCurrentUser();

                if (user?.emailVerified) {
                  redirectAfterAuth();
                } else {
                  setMessage("Todavía no aparece como verificado.");
                }

              } catch (err) {
                setError(
                  firebaseErrorMessages[err.code] ??
                  err?.message ??
                  "No se pudo verificar el estado del usuario"
                );
              } finally {
                setLoading(false);
              }
            }}
          >
            Ya verifiqué mi correo
          </button>

          <button
            className={styles.linkButton}
            onClick={() => {
              resetErrors();
              setMode("login");
            }}
          >
            Volver al login
          </button>
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}

      {message && <div className={styles.success}>{message}</div>}
    </div>
  );
}
