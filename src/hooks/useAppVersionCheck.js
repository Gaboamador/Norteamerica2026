import { useEffect, useRef, useState } from "react";

const VERSION_URL = "/version.json";

/**
 * No es polling.
 * Sólo chequea al cargar la app y cuando la pestaña vuelve a visible.
 *
 * 150 minutos = 2 horas y media.
 * Pensado para no molestar durante la ventana típica de uso de un partido.
 */
const MIN_CHECK_INTERVAL_MS = 150 * 60 * 1000;

async function fetchAppVersion() {
  const response = await fetch(`${VERSION_URL}?t=${Date.now()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`No se pudo leer ${VERSION_URL}`);
  }

  return response.json();
}

export function useAppVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const currentBuildIdRef = useRef(null);
  const lastCheckAtRef = useRef(0);
  const checkingRef = useRef(false);

  useEffect(() => {
    const checkVersion = async ({ force = false } = {}) => {
      if (checkingRef.current || updateAvailable) return;

      const now = Date.now();

      if (!force && now - lastCheckAtRef.current < MIN_CHECK_INTERVAL_MS) {
        return;
      }

      checkingRef.current = true;
      lastCheckAtRef.current = now;

      try {
        const version = await fetchAppVersion();
        const nextBuildId = version?.buildId;

        if (!nextBuildId) return;

        /**
         * Primera lectura:
         * guardamos la versión actual.
         * No mostramos aviso.
         */
        if (!currentBuildIdRef.current) {
          currentBuildIdRef.current = nextBuildId;
          return;
        }

        /**
         * Si hay build nuevo:
         * no recargamos automáticamente.
         * Sólo mostramos aviso persistente.
         */
        if (currentBuildIdRef.current !== nextBuildId) {
          setUpdateAvailable(true);
        }
      } catch (error) {
        console.warn("No se pudo verificar la versión de la app", error);
      } finally {
        checkingRef.current = false;
      }
    };

    checkVersion({ force: true });

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkVersion();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [updateAvailable]);

  const reloadApp = () => {
    window.location.reload();
  };

  return {
    updateAvailable,
    reloadApp,
  };
}