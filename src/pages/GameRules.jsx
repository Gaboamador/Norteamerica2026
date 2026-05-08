import styles from "./GameRules.module.scss";

const exampleResult = {
  homeTeam: "Argentina",
  awayTeam: "Canadá",
  homeGoals: 2,
  awayGoals: 1,
};

const examples = [
  {
    prediction: "0 - 3",
    points: 0,
    title: "No acertás ganador ni goles",
    detail:
      "El resultado real fue triunfo de Argentina 2-1. En este caso pronosticaste triunfo de Canadá y ningún gol exacto.",
  },
  {
    prediction: "1 - 0",
    points: 3,
    title: "Acertás solamente el ganador",
    detail:
      "Pronosticaste que ganaba Argentina, pero no acertaste los goles de ninguno de los dos equipos.",
  },
  {
    prediction: "2 - 0",
    points: 4,
    title: "Acertás ganador y goles de un equipo",
    detail:
      "Acertaste que ganaba Argentina y también los 2 goles de Argentina. No acertaste los goles de Canadá.",
  },
  {
    prediction: "3 - 1",
    points: 4,
    title: "Acertás ganador y goles del otro equipo",
    detail:
      "Acertaste que ganaba Argentina y también el gol de Canadá. No acertaste los goles de Argentina.",
  },
  {
    prediction: "2 - 3",
    points: 1,
    title: "Acertás sólo los goles de un equipo",
    detail:
      "Acertaste los 2 goles de Argentina, pero pronosticaste que ganaba Canadá. Por eso no sumás por ganador.",
  },
  {
    prediction: "0 - 1",
    points: 1,
    title: "Acertás sólo los goles del otro equipo",
    detail:
      "Acertaste el gol de Canadá, pero no el ganador ni los goles de Argentina.",
  },
  {
    prediction: "2 - 1",
    points: 8,
    title: "Pleno: acertás el resultado exacto",
    detail:
      "Acertaste los goles de los dos equipos y, por lo tanto, el resultado exacto. El pleno vale 8 puntos.",
    featured: true,
  },
];

export default function GameRules() {
  return (
    <main className={styles.wrapper}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Reglamento</p>

        <h1 className={styles.title}>¿Cómo se juega?</h1>

        <p className={styles.description}>
          Cargá tus pronósticos antes de que inicie cada partido, seguí los
          resultados oficiales y competí en la tabla de posiciones sumando
          puntos según tus aciertos.
        </p>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.step}>01</span>

          <div>
            <h2 className={styles.sectionTitle}>Carga de pronósticos</h2>
            <p className={styles.sectionDescription}>
              Cada partido tiene un horario de cierre (su fecha y hora de inicio). Podés cargar o modificar
              tu pronóstico mientras el partido siga habilitado.
            </p>
          </div>
        </div>

        <div className={styles.ruleCard}>
          <p className={styles.ruleText}>
            Cuando el contador llega a cero, el pronóstico queda bloqueado y ya
            no se puede editar.
          </p>

          <p className={styles.ruleNote}>
            El cierre se calcula con el horario de bloqueo de cada partido. Podés
            pronosticar hasta la hora de inicio.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.step}>02</span>

          <div>
            <h2 className={styles.sectionTitle}>Sistema de puntos</h2>
            <p className={styles.sectionDescription}>
              Los puntos se calculan comparando tu pronóstico con el resultado
              oficial del partido.
            </p>
          </div>
        </div>

        <div className={styles.pointsGrid}>
          <article className={styles.pointsCard}>
            <strong className={styles.pointsValue}>3</strong>
            <span className={styles.pointsLabel}>puntos</span>
            <p className={styles.pointsText}>
              Por acertar el ganador del partido o el empate.
            </p>
          </article>

          <article className={styles.pointsCard}>
            <strong className={styles.pointsValue}>+1</strong>
            <span className={styles.pointsLabel}>punto</span>
            <p className={styles.pointsText}>
              Por acertar los goles exactos de un equipo.
            </p>
          </article>

          <article className={`${styles.pointsCard} ${styles.featuredCard}`}>
            <strong className={styles.pointsValue}>8</strong>
            <span className={styles.pointsLabel}>puntos</span>
            <p className={styles.pointsText}>
              Por acertar el resultado exacto: eso es pleno.
            </p>
          </article>
        </div>

        <div className={styles.ruleCard}>
          <p className={styles.ruleText}>
            El pleno vale <strong>8 puntos</strong>. No se calcula como 3 puntos
            por ganador más 1 punto por cada gol exacto. Si acertás el resultado
            exacto, sumás directamente 8.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.step}>03</span>

          <div>
            <h2 className={styles.sectionTitle}>Ejemplos de puntuación</h2>
            <p className={styles.sectionDescription}>
              Supongamos que el resultado oficial del partido fue:
            </p>
          </div>
        </div>

        <div className={styles.scoreExample}>
          <div className={styles.team}>
            <span>{exampleResult.homeTeam}</span>
            <strong>{exampleResult.homeGoals}</strong>
          </div>

          <span className={styles.separator}>-</span>

          <div className={styles.team}>
            <strong>{exampleResult.awayGoals}</strong>
            <span>{exampleResult.awayTeam}</span>
          </div>
        </div>

        <div className={styles.examplesList}>
          {examples.map((example) => (
            <article
              key={`${example.prediction}-${example.points}`}
              className={`${styles.exampleCard} ${
                example.featured ? styles.exampleCardFeatured : ""
              }`}
            >
              <div className={styles.exampleMain}>
                <div>
                  <span className={styles.exampleLabel}>Tu pronóstico</span>
                  <strong className={styles.prediction}>
                    {example.prediction}
                  </strong>
                </div>

                <div className={styles.examplePoints}>
                  <strong>{example.points}</strong>
                  <span>{example.points === 1 ? "punto" : "puntos"}</span>
                </div>
              </div>

              <div className={styles.exampleContent}>
                <h3>{example.title}</h3>
                <p>{example.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}