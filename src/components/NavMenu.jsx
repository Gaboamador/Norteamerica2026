import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import useIsMobile from "../hooks/useIsMobile";
import { BREAKPOINTS } from "../constants/breakpoints";
import styles from "./NavMenu.module.scss";

export default function NavMenu({ open, onClose, items = [], anchorRef, headerRef }) {

    const location = useLocation();
    const menuRef = useRef(null);
    const isMobile = useIsMobile(BREAKPOINTS.mobile);
    const [pos, setPos] = useState({ top: 0, left: 0 });

    useEffect(() => {
      if (!open) return;

      // MOBILE → anclado al header
      if (isMobile && headerRef?.current) {
        const rect = headerRef.current.getBoundingClientRect();

        setPos({
          top: rect.bottom,
          left: 0
        });

        return;
      }

      // DESKTOP → anclado al botón
      if (!isMobile && anchorRef?.current) {
        const rect = anchorRef.current.getBoundingClientRect();

        setPos({
          top: rect.bottom + 8,
          left: rect.left
        });
      }
    }, [open, isMobile, anchorRef, headerRef]);

    useEffect(() => {
      if (!open) return;

      function handlePointerDown(e) {
        const menuEl = menuRef.current;
        const anchorEl = anchorRef?.current;

        const clickedInsideMenu = menuEl?.contains(e.target);
        const clickedAnchor = anchorEl?.contains(e.target);

        if (!clickedInsideMenu && !clickedAnchor) {
          onClose();
        }
      }

      document.addEventListener("pointerdown", handlePointerDown);

      return () => {
        document.removeEventListener("pointerdown", handlePointerDown);
      };
    }, [open, onClose, anchorRef]);


  return (
    createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className={`${styles.backdrop} ${isMobile ? styles.mobile : ""}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            ref={menuRef}
            className={`${styles.menu} ${isMobile ? styles.mobile : styles.desktop}`}
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              transformOrigin: "top left"
            }}
            initial={{
              opacity: 0,
              y: -6,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -4,
              scale: 0.99,
            }}
            transition={{
              duration: 0.28,
              ease: [0.16, 1, 0.3, 1]
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.ul
              className={styles.list}
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0, y: 4 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    staggerChildren: 0.035,
                    delayChildren: 0.04
                  }
                }
              }}
            >
              {items.map((item, i) => {
                const isActive = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
                return (
                  <motion.li
                    key={i}
                    className={styles.item}
                    variants={{
                      hidden: { opacity: 0, y: -4 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] }
                      }
                    }}
                  >
                    <Link
                      to={item.disabled ? "#" : item.to}
                      className={`${styles.link} ${isActive ? styles.active : ""} ${isMobile ? styles.mobile : ""} ${item.disabled ? styles.disabled : ""}`}
                      onClick={onClose}
                    >
                      <span className={styles.icon}>
                        {item.icon}
                      </span>

                      <span className={styles.label}>
                        {item.label}
                      </span>
                    </Link>
                  </motion.li>
                )
              })}
            </motion.ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body)
  );
}