// import { Outlet } from "react-router-dom";
// import styles from "./AppLayout.module.scss";

// export default function AppLayout() {
//   return (
//     <div className={styles.layout}>
//       <Outlet />
//     </div>
//   );
// }
import { Outlet, useLocation } from "react-router-dom";
import styles from "./AppLayout.module.scss";

export default function AppLayout() {
  const { pathname } = useLocation();

  // Definimos layout según ruta
  let size = "md";

  if (pathname.startsWith("/auth")) size = "xs";
  if (pathname === "/") size = "sm";

  return (
    <div className={styles.layout}>
      <div className={`${styles.container} ${styles[size]}`}>
        <Outlet />
      </div>
    </div>
  );
}