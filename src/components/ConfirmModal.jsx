import styles from "./ConfirmModal.module.scss";

const ConfirmModal = ({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        {title && <div className={styles.title}>{title}</div>}

        <div className={styles.message}>{message}</div>

        <div className={styles.actions}>
          <button
            className={`button button--danger`}
            onClick={onCancel}
          >
            Cancelar
          </button>

          <button
            className={`button button--success`}
            onClick={onConfirm}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;