import { useEffect, useRef, useState } from "react";
import { FaCircleChevronUp } from "react-icons/fa6";
import styles from "./ScrollArrow.module.scss";

export default function ScrollArrow() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;

      // Mostrar flecha si bajó más de X px (ej: 200)
      setVisible(scrolled > 200);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Elemento invisible al final */}
      <div className={styles.sentinel} />

      {visible && (
        <button
          className={styles.arrow}
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            })
          }
        >
          <FaCircleChevronUp size={32}/>
        </button>
      )}
    </>
  );
}
