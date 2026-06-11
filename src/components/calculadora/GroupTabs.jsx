import styles from "./GroupTabs.module.scss";

export default function GroupTabs({ groups, selectedGroup, onSelectGroup }) {
  return (
    <div className={styles.tabs} role="tablist" aria-label="Grupos">
      {groups.map((group) => (
        <button
          key={group}
          type="button"
          className={`${styles.tab} ${
            selectedGroup === group ? styles.active : ""
          }`}
          onClick={() => onSelectGroup(group)}
        >
          Grupo {group}
        </button>
      ))}
    </div>
  );
}