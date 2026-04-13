import { motion } from "framer-motion";
import styles from "./HeaderMenuIcon.module.scss";

export default function HeaderMenuIcon({ open }) {
  return (
    <div className={styles.wrapper}>
      
      {/* Hamburger */}
      <motion.div
        className={styles.hamburger}
        animate={open ? "open" : "closed"}
      >
        <motion.span variants={line1} />
        <motion.span variants={line2} />
        <motion.span variants={line3} />
      </motion.div>

      {/* PD3 Icon */}
      <motion.img
        src="/icons/icon-512.png"
        className={styles.logo}
        initial={false}
        animate={{
          opacity: open ? 1 : 0,
          scale: open ? 1 : 0.8,
          rotate: open ? 0 : -10
        }}
        transition={{ duration: 0.2 }}
      />
    </div>
  );
}

const line1 = {
  closed: { y: -6, rotate: 0, opacity: 1 },
  open: { y: 0, rotate: 45, opacity: 0 }
};

const line2 = {
  closed: { opacity: 1 },
  open: { opacity: 0 }
};

const line3 = {
  closed: { y: 6, rotate: 0, opacity: 1 },
  open: { y: 0, rotate: -45, opacity: 0 }
};