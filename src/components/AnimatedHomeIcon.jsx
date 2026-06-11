import { motion } from "framer-motion";
import styles from "./AnimatedHomeIcon.module.scss";

const ICONS = {
  scoreboard: {
    viewBox: "0 0 24 24",
    strokeIcon: true,
    paths: [
      { d: "M3 5m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z" },
      { d: "M12 5v2" },
      { d: "M12 10v1" },
      { d: "M12 14v1" },
      { d: "M12 18v1" },
      { d: "M7 3v2" },
      { d: "M17 3v2" },
      { d: "M15 10.5v3a1.5 1.5 0 0 0 3 0v-3a1.5 1.5 0 0 0 -3 0z" },
      { d: "M6 9h1.5a1.5 1.5 0 0 1 0 3h-.5h.5a1.5 1.5 0 0 1 0 3h-1.5" },
    ],
  },

  trophy: {
    viewBox: "0 0 24 24",
    strokeIcon: true,
    paths: [
      { d: "M8 21l8 0" },
      { d: "M12 17l0 4" },
      { d: "M7 4l10 0" },
      { d: "M17 4v8a5 5 0 0 1 -10 0v-8" },
      { d: "M5 9m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" },
      { d: "M19 9m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" },
    ],
  },

  strategy: {
    viewBox: "0 0 24 24",
    strokeIcon: true,
    paths: [
      { d: "M19 4v16h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12z" },
      { d: "M19 16h-12a2 2 0 0 0 -2 2" },
      { d: "M9 8h6" },
    ],
  },

  calculator: {
    viewBox: "0 0 24 24",
    strokeIcon: true,
    paths: [
      { d: "M4 3m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" },
      { d: "M8 7m0 1a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1v1a1 1 0 0 1 -1 1h-6a1 1 0 0 1 -1 -1z" },
      { d: "M8 14l0 .01" },
      { d: "M16 17l0 .01" },
      { d: "M12 14l0 .01" },
      { d: "M16 14l0 .01" },
      { d: "M8 17l0 .01" },
      { d: "M12 17l0 .01" },
    ],
  },
};

const containerVariants = {
  rest: {},
  hover: {
    transition: {
      staggerChildren: 0.045,
      delayChildren: 0.02,
    },
  },
};

const glowVariants = {
  rest: {
    opacity: 0,
    scale: 0.72,
  },
  hover: {
    opacity: [0, 0.18, 0],
    scale: [0.72, 1.08, 1.22],
    transition: {
      duration: 0.55,
      ease: "easeOut",
    },
  },
};

/**
 * Estrella fugaz:
 * - el path base queda siempre completo;
 * - esta capa blanca es un tramo corto;
 * - pathOffset lo hace recorrer el trazado.
 */
const comet = (delay = 0, duration = 0.62) => ({
  rest: {
    opacity: 0,
    pathLength: 0.001,
    pathOffset: 0,
  },
  hover: {
    opacity: [0, 1, 1, 0],
    pathLength: [0.001, 0.13, 0.13, 0.001],
    pathOffset: [0, 0.2, 0.82, 1],
    transition: {
      opacity: {
        delay,
        duration,
        times: [0, 0.12, 0.82, 1],
        ease: "easeOut",
      },
      pathLength: {
        delay,
        duration,
        times: [0, 0.18, 0.76, 1],
        ease: [0.65, 0, 0.35, 1],
      },
      pathOffset: {
        delay,
        duration,
        ease: [0.65, 0, 0.35, 1],
      },
    },
  },
});

function IconGlow() {
  return (
    <motion.circle
      cx="12"
      cy="12"
      r="8.5"
      fill="currentColor"
      variants={glowVariants}
    />
  );
}

function StrokeIcon({ icon }) {
  return (
    <>
      <IconGlow />

      {/* Base siempre visible */}
        <g
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        >
        {icon.paths.map((path) => (
            <path
            key={`base-${path.d}`}
            d={path.d}
            />
        ))}
        </g>

      {/* Halo suave de la estrella */}
        <g
        fill="none"
        stroke="currentColor"
        strokeWidth="5.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.35"
        >
        {icon.paths.map((path, index) => (
            <motion.path
            key={`comet-glow-${path.d}`}
            d={path.d}
            variants={comet(index * 0.07, 0.52)}
            />
        ))}
        </g>

        {/* Núcleo blanco de la estrella */}
        <g
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        >
        {icon.paths.map((path, index) => (
            <motion.path
            key={`comet-core-${path.d}`}
            d={path.d}
            variants={comet(index * 0.07, 0.52)}
            />
        ))}
        </g>
    </>
  );
}

function IconSvg({ icon }) {
  return <StrokeIcon icon={icon} />;
}

export default function AnimatedHomeIcon({
  type,
  size = 32,
  className = "",
}) {
  const icon = ICONS[type];

  if (!icon) return null;

  return (
    <motion.span
      className={`${styles.root} ${className}`.trim()}
      style={{ width: size, height: size }}
      variants={containerVariants}
      aria-hidden="true"
    >
      <svg
        className={styles.svg}
        viewBox={icon.viewBox}
        fill="none"
        focusable="false"
      >
        <IconSvg icon={icon} />
      </svg>
    </motion.span>
  );
}