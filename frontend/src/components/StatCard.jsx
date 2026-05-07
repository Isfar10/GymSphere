function StatCard({ icon = "📊", label, value, helper }) {
  return (
    <div className="gs-card">
      <div style={styles.icon}>{icon}</div>
      <p style={styles.label}>{label}</p>
      <h3 style={styles.value}>{value}</h3>
      {helper && <p className="gs-muted" style={styles.helper}>{helper}</p>}
    </div>
  );
}

const styles = {
  icon: {
    width: "44px",
    height: "44px",
    display: "grid",
    placeItems: "center",
    borderRadius: "16px",
    background: "#ecfdf5",
    fontSize: "23px",
    marginBottom: "12px",
  },
  label: {
    margin: 0,
    color: "#64748b",
    fontSize: "13px",
    fontWeight: 900,
  },
  value: {
    margin: "7px 0 5px",
    fontSize: "28px",
    letterSpacing: "-0.04em",
  },
  helper: {
    margin: 0,
    fontSize: "14px",
  },
};

export default StatCard;