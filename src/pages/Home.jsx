import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import styles from "./Home.module.scss";

export default function Home() {

const { user, loading, isAuthenticated } = useAuth();

const Login = () => {
    if (isAuthenticated) {
        return (<div>
            <h2>Bienvenido de nuevo</h2>
            <p>Ya estás logueado, {user?.displayName}. Puedes ir a tu <Link to="/profile">perfil</Link>.</p>
        </div>);
    } else {
        return (<div>
            <h2>Bienvenido a la app de pronósticos</h2>
            <p>Por favor, <Link to="/auth">logueate o registrate</Link> para participar.</p>
        </div>);
    }
}

if (loading) {
  return <div>Cargando...</div>;
}

  return (
    <div className={styles.wrapper}>

      <Login />

     <nav className={styles.grid}>
        <Link to="/matches" className={styles.card}>
          <div className={styles.cardTitle}>
            <span className={styles.homeIcon} data-service="editor"></span>
            <span>Cargar Pronósticos</span>
            </div>
          {/* <div className={styles.cardDesc}>
            {t('home.build-editor.desc')}
          </div> */}
        </Link>

        <Link to="/standings" className={`${styles.card} ${!isAuthenticated ? styles.disabled : ""}`}>
          <div className={styles.cardTitle}>
            <span className={styles.homeIcon} data-service="explorer"></span>
            <span>Tabla de Posiciones</span>
            </div>
          {/* <div className={styles.cardDesc}>
            {!isAuthenticated ? `${t('home.library-explorer.desc.not-auth')}`:`${t('home.library-explorer.desc.auth')}`}
          </div> */}
        </Link>

        <Link to="/admin" className={styles.card}>
          <div className={styles.cardTitle}>
            <span className={styles.homeIcon} data-service="roulette"></span>
            <span>Administrador</span>
            </div>
          {/* <div className={styles.cardDesc}>
            {!isAuthenticated ? `${t('home.library-roulette.desc.not-auth')}`:`${t('home.library-roulette.desc.auth')}`}
          </div> */}
        </Link>
        
      </nav>


    </div>
  );
}
