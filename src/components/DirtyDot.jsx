import { useNavigate } from "react-router-dom";
import { useStandingsDirty } from "@/context/StandingsDirtyContext";
import styles from './DirtyDot.module.scss'

export function DirtyDot() {
  const ctx = useStandingsDirty();
  const navigate = useNavigate();

  if (!ctx?.dirty) return null;

  return (
    <span
        className={styles.dirtyDot}
        onClick={() => navigate("/admin/groups")}
    />
  );
}