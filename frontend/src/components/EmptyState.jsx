function EmptyState({
  icon = "📭",
  title = "Nothing here yet",
  message = "Your data will appear here once available.",
}) {
  return (
    <div className="gs-empty">
      <div style={styles.icon}>{icon}</div>
      <h3 style={styles.title}>{title}</h3>
      <p style={styles.message}>{message}</p>
    </div>
  );
}

const styles = {
  icon: {
    fontSize: "48px",
    marginBottom: "8px",
  },
  title: {
    margin: "0 0 6px",
    color: "#0f172a",
    fontSize: "22px",
    letterSpacing: "-0.035em",
  },
  message: {
    margin: 0,
    color: "#64748b",
    lineHeight: 1.6,
  },
};

export default EmptyState;