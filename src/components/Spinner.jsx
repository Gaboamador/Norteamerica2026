import styles from "./Spinner.module.scss";

export default function Spinner({
  size = "md",
  label = "Cargando...",
}) {
  return (
    <div className={styles.wrapper}>
      <div className={`${styles.spinner} ${styles[size]}`} />
      {label && (
        <div className={styles.label}>
          {label}
        </div>
      )}
    </div>
  );
}
