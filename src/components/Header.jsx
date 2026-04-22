import { useRef, useState, useEffect } from "react";
import styles from "./Header.module.scss";
import logo from "@/assets/logo.png";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { logout } from "@/services/firebase/firebaseAuth";
import { formatDisplayName } from "@/utils/formatDisplayName";
import NavMenu from "./NavMenu";
import HeaderMenuIcon from "./HeaderMenuIcon";
import { DirtyDot } from "./DirtyDot";
import { IoPersonCircleSharp } from "react-icons/io5";
import { LuFolderOpen, LuHouse } from "react-icons/lu";
import { CiViewTable, CiEdit } from "react-icons/ci";
import { IoMdLogOut } from "react-icons/io";


export default function Header() {
  const { isAuthenticated, user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const location = useLocation();
  const pathname = location.pathname;
  const [menuOpen, setMenuOpen] = useState(false);
  const isHome = pathname === "/";
  const buttonRef = useRef(null);
  const headerRef = useRef(null);
  
  const [imgError, setImgError] = useState(false);
  const photo = user?.photoURL || user?.providerData?.[0]?.photoURL;

  useEffect(() => {
    setImgError(false);
  }, [photo]);
  

  //FUNCIONES 
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

  const userItems = isAuthenticated
  ? [
      {
        label: "Mi perfil",
        to: "/user",
        icon: <IoPersonCircleSharp />,
        isUserSectionStart: true
      },
      {
        label: "Cerrar sesión",
        action: handleLogout,
        icon: <IoMdLogOut />,
      },
    ]
  : [];

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
            <DirtyDot />
          </div>
        </div>

        {/* RIGHT */}
        <div className={styles.right}>
          {isAuthenticated ? (
            <div className={styles.authControls}>
              {/* <div className={styles.userName}>
                {formatDisplayName(user?.displayName, user?.email)?.toUpperCase()}
              </div> */}
{/* <div
  className={styles.userInfo}
  onClick={() => setMenuOpen(true)}
>
  {user?.photoURL ? (
    <img
      src={user.photoURL}
      alt="avatar"
      className={styles.avatar}
    />
  ) : (
    <div className={styles.avatarFallback}>
      {formatDisplayName(user?.displayName, user?.email)
        ?.charAt(0)
        ?.toUpperCase()}
    </div>
  )}

  <div className={styles.userName}>
    {formatDisplayName(user?.displayName, user?.email)?.toUpperCase()}
  </div>
</div> */}
<div className={styles.userInfo}>
  <div className={styles.userName}>
    {formatDisplayName(user?.displayName, user?.email)?.toUpperCase()}
  </div>

<button
  type="button"
  className={styles.avatarButton}
  onClick={() => setMenuOpen(true)}
>
  {photo && !imgError ? (
    <img
      src={photo}
      alt="avatar"
      className={styles.avatar}
      onError={() => setImgError(true)}
    />
  ) : (
    <div className={styles.avatarFallback}>
      {formatDisplayName(user?.displayName, user?.email)
        ?.charAt(0)
        ?.toUpperCase()}
    </div>
  )}
</button>
</div>

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
        items={[...navItems, ...userItems]}
        anchorRef={buttonRef}
        headerRef={headerRef}
      />

    </header>
  );
}