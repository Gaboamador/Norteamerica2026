import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "../hooks/useAdmin";
import styles from "./Home.module.scss";
import { LuFolderOpen, LuChevronDown } from "react-icons/lu";
import { CiViewTable, CiEdit } from "react-icons/ci";

export default function Home() {
  const { loading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [adminOpen, setAdminOpen] = useState(false);

  if (loading || adminLoading) {
    return <div className={styles.loading}>Cargando...</div>;
  }

  return (
    <section className={styles.wrapper}>
      <div className={styles.titleWrapper}>
        <h1 className={styles.title}>Norteamérica 2026</h1>
        <p className={styles.subtitle}>
          Cargá tus pronósticos y seguí la tabla de posiciones del grupo.
        </p>
      </div>

      <nav className={styles.actions}>
        <Link to="/matches" className={`${styles.card} ${styles.cardAccentBlue}`}>
          <div className={styles.cardTitle}>
            <span className={styles.homeIcon}>
              <CiEdit size={24} />
            </span>
            <span>Cargar Pronósticos</span>
          </div>

          <p className={styles.cardDesc}>
            Ingresá tus resultados antes de que empiecen los partidos.
          </p>
        </Link>

        <Link to="/standings" className={`${styles.card} ${styles.cardAccentGreen}`}>
          <div className={styles.cardTitle}>
            <span className={styles.homeIcon}>
              <CiViewTable size={24} />
            </span>
            <span>Tabla de Posiciones</span>
          </div>

          <p className={styles.cardDesc}>
            Mirá el puntaje acumulado y cómo va el ranking del grupo.
          </p>
        </Link>

        {isAdmin && (
          <motion.div
            className={styles.adminBlock}
            layout
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <button
              type="button"
              className={`${styles.adminToggle} ${adminOpen ? styles.open : ""}`}
              onClick={() => setAdminOpen(prev => !prev)}
              aria-expanded={adminOpen}
              aria-controls="admin-links"
            >
              <div className={styles.cardTitle}>
                <span className={`${styles.homeIcon} ${styles.adminIcon}`}>
                  <LuFolderOpen size={22} />
                </span>
                <div className={styles.adminCard}>
                  <span>Administración</span>
                  <p className={styles.cardDesc}>
                    Gestionar partidos oficiales y grupos del sistema.
                  </p>
                </div>
              </div>
                

              <motion.span
                className={styles.adminChevron}
                animate={{ rotate: adminOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <LuChevronDown size={18} />
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {adminOpen && (
                <motion.div
                  id="admin-links"
                  className={styles.adminLinks}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  <div className={styles.adminLinksInner}>
                    <Link
                      to="/admin/matches"
                      className={`${styles.card} ${styles.cardAccentRed} ${styles.adminCard}`}
                    >
                      <div className={styles.cardTitle}>
                        <span className={styles.homeIcon}>
                          <LuFolderOpen size={22} />
                        </span>
                        <div className={styles.adminCard}>
                          <span>Administrar Partidos</span>
                          <p className={`${styles.cardDesc} ${styles.adminDesc}`}>
                            Administrar partidos oficiales y sus resultados.
                          </p>
                        </div>
                      </div>
                        

                    </Link>

                    <Link
                      to="/admin/groups"
                      className={`${styles.card} ${styles.cardAccentRed} ${styles.adminCard}`}
                    >
                      <div className={styles.cardTitle}>
                        <span className={styles.homeIcon}>
                          <LuFolderOpen size={22} />
                        </span>
                        <div className={styles.adminCard}>
                          <span>Administrar Grupos</span>
                          <p className={`${styles.cardDesc} ${styles.adminDesc}`}>
                            Administrar grupos y sus participantes.
                          </p>
                        </div>
                      </div>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </nav>
    </section>
  );
}