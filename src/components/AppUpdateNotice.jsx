import styles from "./AppUpdateNotice.module.scss";

export default function AppUpdateNotice({ open, onUpdateNow }) {
  if (!open) return null;

  return (
    <div className={styles.notice} role="status" aria-live="polite">
      <div className={styles.content}>
        <span className={styles.kicker}>Actualización</span>
        <strong className={styles.title}>Nueva versión disponible</strong>
      </div>

      <button
        type="button"
        className={`button button--small ${styles.button}`}
        onClick={onUpdateNow}
      >
        Actualizar
      </button>
    </div>
  );
}