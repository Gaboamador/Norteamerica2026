import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "../hooks/useAdmin";
import styles from "./Home.module.scss";

export default function Home() {

const { loading, isAuthenticated } = useAuth();
const { isAdmin, loading: adminLoading } = useAdmin();

if (loading) {
  return <div>Cargando...</div>;
}

  return (
    <div>
      <nav className={styles.grid}>

        <Link to="/matches" className={styles.card}>
          <div className={styles.cardTitle}>
            <span className={styles.homeIcon} data-service="editor"></span>
            <span>Cargar Pronósticos</span>
          </div>
        </Link>

        <Link to="/standings" className={`${styles.card} ${!isAuthenticated ? styles.disabled : ""}`}>
          <div className={styles.cardTitle}>
            <span className={styles.homeIcon} data-service="explorer"></span>
            <span>Tabla de Posiciones</span>
          </div>
        </Link>

        {isAdmin && (
          <>
          <Link to="/admin/matches" className={styles.card}>
            <div className={styles.cardTitle}>
              <span className={styles.homeIcon} data-service="roulette"></span>
              <span>Admin Matches</span>
            </div>
          </Link>
          <Link to="/admin/groups" className={styles.card}>
            <div className={styles.cardTitle}>
              <span className={styles.homeIcon} data-service="roulette"></span>
              <span>Admin Groups</span>
            </div>
          </Link>
          </>
        )}

      </nav>
    </div>
  );
}
