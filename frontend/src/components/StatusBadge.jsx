function StatusBadge({ status = "active" }) {
  const normalized = String(status).toLowerCase();

  const palette = {
    active: {
      background: "#dcfce7",
      color: "#166534",
    },
    accepted: {
      background: "#dcfce7",
      color: "#166534",
    },
    completed: {
      background: "#dcfce7",
      color: "#166534",
    },
    approved: {
      background: "#dcfce7",
      color: "#166534",
    },
    pending: {
      background: "#fef3c7",
      color: "#92400e",
    },
    cancelled: {
      background: "#fee2e2",
      color: "#991b1b",
    },
    rejected: {
      background: "#fee2e2",
      color: "#991b1b",
    },
    failed: {
      background: "#fee2e2",
      color: "#991b1b",
    },
  };

  return (
    <span
      style={{
        ...styles.badge,
        ...(palette[normalized] || palette.active),
      }}
    >
      {normalized}
    </span>
  );
}

const styles = {
  badge: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: 950,
    textTransform: "capitalize",
  },
};

export default StatusBadge;