import { useRef, useState } from "react";
import styles from "./Header.module.scss";
import logo from "@/assets/logo.png";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "../hooks/useAdmin";
import { logout } from "@/services/firebase/firebaseAuth";
import NavMenu from "./NavMenu";
import HeaderMenuIcon from "./HeaderMenuIcon";
import { IoPersonCircleSharp } from "react-icons/io5";
import { LuFolderOpen, LuHouse } from "react-icons/lu";
import { CiViewTable, CiEdit } from "react-icons/ci";

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
    { match: "/admin/matches", label: 'Administrar Partidos Oficiales' },
    { match: "/admin/groups", label: 'Administrar Grupos y Miembros' },
  ];

  const subtitle = SUBTITLE_ROUTES.find(r => pathname.startsWith(r.match))?.label ?? "";

  const navItems = [
    {
      to: "/",
      label: 'Inicio',
      icon: <LuHouse />,
    },
    {
      to: "/matches",
      label: 'Cargar Pronósticos',
      icon: <CiEdit />,
    },
    {
      to: "/standings",
      label: 'Tabla de Posiciones',
      icon: <CiViewTable />,
    },
    ...(isAdmin ? [
      {
        to: "/admin/matches",
        label: "Administrar Partidos",
        icon: <LuFolderOpen />,
      },
            {
        to: "/admin/groups",
        label: "Administrar Grupos y Miembros",
        icon: <LuFolderOpen />,
      },
    ] : []),
  ];

  return (
    <header ref={headerRef} className={styles.header}>

      <div className={styles.inner}>
        
        {/* LEFT */}
        <div className={styles.left}>
          {(!isHome && isAuthenticated) && (
          <button
            ref={buttonRef}
            className={`${styles.logoButton} ${menuOpen ? styles.open : ""}`}
            onClick={() => setMenuOpen(true)}
          >
            <HeaderMenuIcon open={menuOpen} />
          </button>
          )}
          

          <div className={styles.titleWrapper}>
            {(isHome || !isAuthenticated) && 
            <div>
              <img src={logo} alt="Logo" className={styles.logo} />
            </div>
            }
            <div className={styles.title}>
              <span>PRODE</span>
              <span>Norteamérica 2026</span>
            </div>
          </div>
        </div>

        {/* CENTER */}
        {/* <div className={styles.center}>
          {!isHome && subtitle && (
            <span className={styles.subtitle}>{subtitle}</span>
          )}
        </div> */}

        {/* RIGHT */}
        <div className={styles.right}>
          {isAuthenticated ? (
            <div className={styles.authControls}>
              <div className={`${styles.userName} ${!isHome ? styles.smallerAuth : ""}`}>
                {user?.user?.displayName?.toUpperCase()}
              </div>
              <button
                className={`${styles.logoutButton} ${!isHome ? styles.smallerAuth : ""}`}
                onClick={handleLogout}
              >
                Cerrar sesión
              </button>
            </div>
          ) : (
            <Link to="/auth">
              <IoPersonCircleSharp size={30} className={styles.authIcon} />
            </Link>
          )}
        </div>

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