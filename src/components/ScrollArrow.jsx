import { useEffect, useRef, useState } from "react";
import { FaCircleChevronUp } from "react-icons/fa6";
import styles from "./ScrollArrow.module.scss";

export default function ScrollArrow() {
  const [visible, setVisible] = useState(false);
  const sentinelRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Si el sentinel NO es visible, estamos lejos del final
        setVisible(entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0,
      }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Elemento invisible al final */}
      <div ref={sentinelRef} className={styles.sentinel} />

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
