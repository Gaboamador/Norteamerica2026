import { useRef, useState } from "react";
import styles from "./Header.module.scss";
import pd3_logo_alt from "@/assets/pd3_logo_alt.svg";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "../hooks/useAdmin";
import { logout } from "@/services/firebase/firebaseAuth";
import NavMenu from "./NavMenu";
import HeaderMenuIcon from "./HeaderMenuIcon";
import { IoPersonCircleSharp } from "react-icons/io5";
import {
  LuWrench,
  LuFolderOpen,
  LuHouse
} from "react-icons/lu";

export default function Header() {
  const { isAuthenticated } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const user = useAuth();
  const location = useLocation();
  const pathname = location.pathname;
  const [menuOpen, setMenuOpen] = useState(false);
  const isHome = pathname === "/";
  const buttonRef = useRef(null);
  const headerRef = useRef(null);

  function handleLogout() {
    logout();
  }

  const SUBTITLE_ROUTES = [
    { match: "/matches", label: 'Cargar Pronósticos' },
    { match: "/standings", label: 'Tabla de Posiciones' },
    { match: "/auth", label: 'Autenticación' },
  ];

  const subtitle = SUBTITLE_ROUTES.find(r => pathname.startsWith(r.match))?.label ?? "";

  const navItems = [
    {
      to: "/",
      label: 'Inicio',
      icon: <LuHouse />,
      service: "home"
    },
    {
      to: "/matches",
      label: 'Cargar Pronósticos',
      icon: <LuWrench />,
      service: "editor"
    },
    {
      to: "/standings",
      label: 'Tabla de Posiciones',
      icon: <LuFolderOpen />,
      service: "explorer",
    },
    ...(isAdmin ? [
      {
        to: "/admin/matches",
        label: "Administrar Partidos",
        icon: <LuFolderOpen />,
      },
            {
        to: "/admin/groups",
        label: "Administrar Usuarios y Grupos",
        icon: <LuFolderOpen />,
      },
    ] : []),
  ];

  return (
    <header ref={headerRef} className={styles.header}>
      <div className={styles.inner}>

      {(isHome || !isAuthenticated) ? (
        // <img
        //   src={pd3_logo_alt}
        //   alt="Payday 3 Logo"
        //   className={styles.logo}
        // />
        <>
        <div className={styles.title}>
          <span>PRODE</span>
          <span>Norteamérica 2026</span>
        </div>
        </>
      ) : (
        <button
          ref={buttonRef}
          className={`${styles.logoButton} ${menuOpen ? styles.open : ""}`}
          onClick={() => setMenuOpen(true)}
        >
          <HeaderMenuIcon open={menuOpen} />
        </button>
      )}
        
      {subtitle && (
        <span className={styles.subtitle}>{subtitle}</span>
      )}

      {isAuthenticated ? (
        <>
        <div className={`${styles.authControls}`}>
          <div className={`${styles.userName} ${!isHome ? styles.smallerAuth : ""}`}>{user?.user?.displayName?.toUpperCase()}</div>
          <button className={`${styles.logoutButton} ${!isHome ? styles.smallerAuth : ""}`} onClick={handleLogout}>Cerrar sesión</button>
        </div>
        </>
      ) : (
        <Link to="/auth">
          <span>
            <IoPersonCircleSharp size={30} className={styles.authIcon}/>
          </span>
        </Link>
      )}
      </div>

      <NavMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={navItems}
        anchorRef={buttonRef}
        headerRef={headerRef}
      />

    </header>
  );
}