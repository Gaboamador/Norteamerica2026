import { Outlet } from "react-router-dom";
import styles from "./AppLayout.module.scss";

export default function AppLayout() {
  return (
    <div className={styles.layout}>
      <Outlet />
    </div>
  );
}