function PageShell({
  eyebrow,
  title,
  subtitle,
  children,
  actions,
  heroIcon = "🏋️",
}) {
  return (
    <main className="gs-page">
      <section className="gs-hero">
        <div className="gs-hero-content">
          <p className="gs-kicker">{eyebrow}</p>
          <h1 className="gs-title">{title}</h1>
          {subtitle && <p className="gs-subtitle">{subtitle}</p>}
          {actions && <div style={styles.actions}>{actions}</div>}
        </div>

        <div style={styles.heroIcon}>{heroIcon}</div>
      </section>

      {children}
    </main>
  );
}

const styles = {
  actions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "24px",
  },
  heroIcon: {
    position: "absolute",
    right: "42px",
    bottom: "24px",
    zIndex: 1,
    fontSize: "92px",
    opacity: 0.24,
    filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.24))",
  },
};

export default PageShell;