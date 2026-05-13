import { Outlet, useLocation } from "react-router-dom";
import styles from "./AppLayout.module.scss";

export default function AppLayout() {
  const { pathname } = useLocation();

  // Definimos layout según ruta
  let size = "md";

  if (pathname.startsWith("/auth")) size = "xs";
  if (pathname === "/") size = "sm";
  if (pathname.startsWith("/matches")) size = "xl";
  if (pathname.startsWith("/admin/matches")) size = "xl";

  return (
    <div className={styles.layout}>
      <div className={`${styles.container} ${styles[size]}`}>
        <Outlet />
      </div>
    </div>
  );
}