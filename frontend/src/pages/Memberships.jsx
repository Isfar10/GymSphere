import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

const emptyPlanForm = {
  name: "",
  description: "",
  price: "",
  durationDays: "30",
  featuresText: "",
  isActive: true,
  isPopular: false,
};

function Memberships() {
  const { user } = useAuth();

  const [plans, setPlans] = useState([]);
  const [adminPlans, setAdminPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [history, setHistory] = useState([]);
  const [allSubscriptions, setAllSubscriptions] = useState([]);
  const [planForm, setPlanForm] = useState(emptyPlanForm);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("mock");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isAdmin = user?.role === "admin";

  const activePlanId = currentSubscription?.plan?.id;

  const totalRevenue = useMemo(() => {
    return allSubscriptions.reduce(
      (sum, subscription) => sum + Number(subscription.amountPaid || 0),
      0
    );
  }, [allSubscriptions]);

  const activeSubscriptionCount = useMemo(() => {
    return allSubscriptions.filter(
      (subscription) => subscription.status === "active"
    ).length;
  }, [allSubscriptions]);

  const fetchMembershipData = async () => {
    try {
      setLoading(true);
      setError("");

      const [plansResponse, mySubscriptionResponse, historyResponse] =
        await Promise.all([
          API.get("/memberships/plans"),
          API.get("/memberships/me"),
          API.get("/memberships/history"),
        ]);

      setPlans(plansResponse.data.plans || []);
      setCurrentSubscription(mySubscriptionResponse.data.subscription || null);
      setHistory(historyResponse.data.subscriptions || []);

      if (isAdmin) {
        const [adminPlansResponse, allSubscriptionsResponse] = await Promise.all([
          API.get("/memberships/plans/admin"),
          API.get("/memberships/admin/subscriptions"),
        ]);

        setAdminPlans(adminPlansResponse.data.plans || []);
        setAllSubscriptions(allSubscriptionsResponse.data.subscriptions || []);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load membership data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembershipData();
  }, [isAdmin]);

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(""), 2500);
  };

  const formatCurrency = (value) => {
    return `৳${Number(value || 0).toLocaleString()}`;
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";
    return new Date(dateValue).toLocaleDateString();
  };

  const getDaysLeft = (endDate) => {
    if (!endDate) return 0;

    const diff = new Date(endDate).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const handleSubscribe = async (planId) => {
    try {
      setActionLoading(true);
      setError("");

      await API.post("/memberships/subscribe", {
        planId,
        paymentMethod,
      });

      await fetchMembershipData();
      showSuccess("Membership activated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to subscribe to plan.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setActionLoading(true);
      setError("");

      await API.patch("/memberships/cancel");

      await fetchMembershipData();
      showSuccess("Membership cancelled successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel membership.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSeedPlans = async () => {
    try {
      setActionLoading(true);
      setError("");

      await API.post("/memberships/plans/seed");

      await fetchMembershipData();
      showSuccess("Default membership plans are ready.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to seed plans.");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePlanFormChange = (event) => {
    const { name, value, type, checked } = event.target;

    setPlanForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetPlanForm = () => {
    setPlanForm(emptyPlanForm);
    setEditingPlanId(null);
  };

  const handleEditPlan = (plan) => {
    setEditingPlanId(plan.id);
    setPlanForm({
      name: plan.name,
      description: plan.description,
      price: String(plan.price),
      durationDays: String(plan.durationDays),
      featuresText: (plan.features || []).join("\n"),
      isActive: Boolean(plan.isActive),
      isPopular: Boolean(plan.isPopular),
    });
  };

  const handleSavePlan = async (event) => {
    event.preventDefault();

    if (!planForm.name.trim() || !planForm.description.trim()) {
      setError("Plan name and description are required.");
      return;
    }

    const payload = {
      name: planForm.name,
      description: planForm.description,
      price: Number(planForm.price || 0),
      durationDays: Number(planForm.durationDays || 30),
      features: planForm.featuresText
        .split("\n")
        .map((feature) => feature.trim())
        .filter(Boolean),
      isActive: planForm.isActive,
      isPopular: planForm.isPopular,
    };

    try {
      setActionLoading(true);
      setError("");

      if (editingPlanId) {
        await API.put(`/memberships/plans/${editingPlanId}`, payload);
        showSuccess("Membership plan updated.");
      } else {
        await API.post("/memberships/plans", payload);
        showSuccess("Membership plan created.");
      }

      resetPlanForm();
      await fetchMembershipData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save membership plan.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivatePlan = async (planId) => {
    try {
      setActionLoading(true);
      setError("");

      await API.patch(`/memberships/plans/${planId}/deactivate`);

      await fetchMembershipData();
      showSuccess("Membership plan deactivated.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to deactivate membership plan."
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <main style={styles.page}>
        <section style={styles.header}>
          <div>
            <p style={styles.eyebrow}>GymSphere Plans</p>
            <h1 style={styles.title}>Membership Subscriptions</h1>
            <p style={styles.subtitle}>
              Choose a membership plan, unlock premium benefits, and manage your
              active subscription.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchMembershipData}
            style={styles.refreshButton}
          >
            Refresh
          </button>
        </section>

        {error && <div style={styles.errorBox}>{error}</div>}
        {success && <div style={styles.successBox}>{success}</div>}

        {loading ? (
          <div style={styles.emptyBox}>Loading memberships...</div>
        ) : (
          <>
            <section style={styles.currentCard}>
              <div>
                <p style={styles.cardLabel}>Current Membership</p>

                {currentSubscription ? (
                  <>
                    <h2 style={styles.currentTitle}>
                      {currentSubscription.plan?.name} Plan
                    </h2>
                    <p style={styles.currentText}>
                      Status: <strong>{currentSubscription.status}</strong> • Ends on{" "}
                      <strong>{formatDate(currentSubscription.endDate)}</strong> •{" "}
                      <strong>
                        {getDaysLeft(currentSubscription.endDate)} days left
                      </strong>
                    </p>
                  </>
                ) : (
                  <>
                    <h2 style={styles.currentTitle}>No active membership</h2>
                    <p style={styles.currentText}>
                      Subscribe to a plan to activate membership benefits.
                    </p>
                  </>
                )}
              </div>

              {currentSubscription && (
                <button
                  type="button"
                  onClick={handleCancelSubscription}
                  disabled={actionLoading}
                  style={styles.dangerButton}
                >
                  Cancel Membership
                </button>
              )}
            </section>

            <section style={styles.paymentBox}>
              <label style={styles.label}>
                Payment Method
                <select
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  style={styles.input}
                >
                  <option value="mock">Mock Payment</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                  <option value="sslcommerz">SSLCommerz</option>
                </select>
              </label>

              <p style={styles.helperText}>
                This uses mock paid subscriptions now. You can connect real online
                payment later.
              </p>
            </section>

            <section style={styles.planGrid}>
              {plans.length === 0 ? (
                <div style={styles.emptyBox}>
                  <h3 style={styles.emptyTitle}>No active plans found</h3>
                  <p style={styles.emptyText}>
                    Ask an admin to create or seed membership plans.
                  </p>
                </div>
              ) : (
                plans.map((plan) => (
                  <article
                    key={plan.id}
                    style={{
                      ...styles.planCard,
                      ...(plan.isPopular ? styles.popularCard : {}),
                    }}
                  >
                    {plan.isPopular && (
                      <span style={styles.popularBadge}>Most Popular</span>
                    )}

                    <h2 style={styles.planName}>{plan.name}</h2>
                    <p style={styles.planDescription}>{plan.description}</p>

                    <div style={styles.priceRow}>
                      <span style={styles.price}>{formatCurrency(plan.price)}</span>
                      <span style={styles.duration}>/{plan.durationDays} days</span>
                    </div>

                    <ul style={styles.featureList}>
                      {(plan.features || []).map((feature) => (
                        <li key={feature} style={styles.featureItem}>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={actionLoading || activePlanId === plan.id}
                      style={{
                        ...styles.primaryButton,
                        ...(activePlanId === plan.id ? styles.disabledButton : {}),
                      }}
                    >
                      {activePlanId === plan.id ? "Current Plan" : "Subscribe"}
                    </button>
                  </article>
                ))
              )}
            </section>

            <section style={styles.historySection}>
              <h2 style={styles.sectionTitle}>My Subscription History</h2>

              {history.length === 0 ? (
                <div style={styles.emptyBox}>No subscription history yet.</div>
              ) : (
                <div style={styles.tableWrap}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Plan</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Payment</th>
                        <th style={styles.th}>Amount</th>
                        <th style={styles.th}>Start</th>
                        <th style={styles.th}>End</th>
                      </tr>
                    </thead>

                    <tbody>
                      {history.map((subscription) => (
                        <tr key={subscription.id}>
                          <td style={styles.td}>{subscription.plan?.name}</td>
                          <td style={styles.td}>{subscription.status}</td>
                          <td style={styles.td}>{subscription.paymentStatus}</td>
                          <td style={styles.td}>
                            {formatCurrency(subscription.amountPaid)}
                          </td>
                          <td style={styles.td}>
                            {formatDate(subscription.startDate)}
                          </td>
                          <td style={styles.td}>
                            {formatDate(subscription.endDate)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {isAdmin && (
              <section style={styles.adminSection}>
                <div style={styles.adminHeader}>
                  <div>
                    <p style={styles.eyebrow}>Admin</p>
                    <h2 style={styles.sectionTitle}>Membership Management</h2>
                  </div>

                  <button
                    type="button"
                    onClick={handleSeedPlans}
                    disabled={actionLoading}
                    style={styles.secondaryButton}
                  >
                    Seed Default Plans
                  </button>
                </div>

                <div style={styles.adminStats}>
                  <StatBox label="Total Subscriptions" value={allSubscriptions.length} />
                  <StatBox label="Active Subscriptions" value={activeSubscriptionCount} />
                  <StatBox label="Membership Revenue" value={formatCurrency(totalRevenue)} />
                </div>

                <form onSubmit={handleSavePlan} style={styles.formCard}>
                  <h3 style={styles.formTitle}>
                    {editingPlanId ? "Edit Plan" : "Create Plan"}
                  </h3>

                  <div style={styles.formGrid}>
                    <label style={styles.label}>
                      Name
                      <input
                        name="name"
                        value={planForm.name}
                        onChange={handlePlanFormChange}
                        style={styles.input}
                        placeholder="Pro"
                      />
                    </label>

                    <label style={styles.label}>
                      Price
                      <input
                        name="price"
                        type="number"
                        min="0"
                        value={planForm.price}
                        onChange={handlePlanFormChange}
                        style={styles.input}
                        placeholder="999"
                      />
                    </label>

                    <label style={styles.label}>
                      Duration Days
                      <input
                        name="durationDays"
                        type="number"
                        min="1"
                        value={planForm.durationDays}
                        onChange={handlePlanFormChange}
                        style={styles.input}
                        placeholder="30"
                      />
                    </label>
                  </div>

                  <label style={styles.label}>
                    Description
                    <textarea
                      name="description"
                      value={planForm.description}
                      onChange={handlePlanFormChange}
                      style={styles.textarea}
                      rows="3"
                      placeholder="Describe the membership plan..."
                    />
                  </label>

                  <label style={styles.label}>
                    Features, one per line
                    <textarea
                      name="featuresText"
                      value={planForm.featuresText}
                      onChange={handlePlanFormChange}
                      style={styles.textarea}
                      rows="5"
                      placeholder={"Priority trainer booking\nAdvanced progress insights"}
                    />
                  </label>

                  <div style={styles.checkboxRow}>
                    <label style={styles.checkboxLabel}>
                      <input
                        name="isActive"
                        type="checkbox"
                        checked={planForm.isActive}
                        onChange={handlePlanFormChange}
                      />
                      Active
                    </label>

                    <label style={styles.checkboxLabel}>
                      <input
                        name="isPopular"
                        type="checkbox"
                        checked={planForm.isPopular}
                        onChange={handlePlanFormChange}
                      />
                      Popular
                    </label>
                  </div>

                  <div style={styles.formActions}>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      style={styles.primaryButton}
                    >
                      {editingPlanId ? "Update Plan" : "Create Plan"}
                    </button>

                    {editingPlanId && (
                      <button
                        type="button"
                        onClick={resetPlanForm}
                        style={styles.secondaryButton}
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </form>

                <h3 style={styles.formTitle}>All Plans</h3>

                <div style={styles.adminPlanList}>
                  {adminPlans.map((plan) => (
                    <div key={plan.id} style={styles.adminPlanCard}>
                      <div>
                        <h4 style={styles.adminPlanTitle}>{plan.name}</h4>
                        <p style={styles.adminPlanText}>
                          {formatCurrency(plan.price)} • {plan.durationDays} days •{" "}
                          {plan.isActive ? "Active" : "Inactive"}
                        </p>
                      </div>

                      <div style={styles.adminPlanActions}>
                        <button
                          type="button"
                          onClick={() => handleEditPlan(plan)}
                          style={styles.secondaryButton}
                        >
                          Edit
                        </button>

                        {plan.isActive && (
                          <button
                            type="button"
                            onClick={() => handleDeactivatePlan(plan.id)}
                            disabled={actionLoading}
                            style={styles.dangerButton}
                          >
                            Deactivate
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <h3 style={styles.formTitle}>All Subscriptions</h3>

                {allSubscriptions.length === 0 ? (
                  <div style={styles.emptyBox}>No user subscriptions yet.</div>
                ) : (
                  <div style={styles.tableWrap}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>User</th>
                          <th style={styles.th}>Plan</th>
                          <th style={styles.th}>Status</th>
                          <th style={styles.th}>Amount</th>
                          <th style={styles.th}>Payment</th>
                          <th style={styles.th}>End</th>
                        </tr>
                      </thead>

                      <tbody>
                        {allSubscriptions.map((subscription) => (
                          <tr key={subscription.id}>
                            <td style={styles.td}>
                              {subscription.user?.name}
                              <br />
                              <small>{subscription.user?.email}</small>
                            </td>
                            <td style={styles.td}>{subscription.plan?.name}</td>
                            <td style={styles.td}>{subscription.status}</td>
                            <td style={styles.td}>
                              {formatCurrency(subscription.amountPaid)}
                            </td>
                            <td style={styles.td}>{subscription.paymentMethod}</td>
                            <td style={styles.td}>
                              {formatDate(subscription.endDate)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}

function StatBox({ label, value }) {
  return (
    <div style={styles.statBox}>
      <p style={styles.cardLabel}>{label}</p>
      <h3 style={styles.statValue}>{value}</h3>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: "1180px",
    margin: "0 auto",
    padding: "32px 20px",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    color: "#111827",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    alignItems: "flex-start",
    marginBottom: "24px",
  },
  eyebrow: {
    margin: "0 0 8px",
    color: "#16a34a",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontSize: "13px",
  },
  title: {
    margin: 0,
    fontSize: "36px",
    lineHeight: 1.1,
  },
  subtitle: {
    margin: "10px 0 0",
    color: "#6b7280",
    maxWidth: "760px",
    lineHeight: 1.6,
  },
  refreshButton: {
    border: "none",
    borderRadius: "999px",
    background: "#16a34a",
    color: "#ffffff",
    padding: "11px 18px",
    fontWeight: 800,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  errorBox: {
    background: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    borderRadius: "14px",
    padding: "12px 14px",
    marginBottom: "14px",
  },
  successBox: {
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #bbf7d0",
    borderRadius: "14px",
    padding: "12px 14px",
    marginBottom: "14px",
  },
  emptyBox: {
    border: "1px dashed #d1d5db",
    borderRadius: "18px",
    padding: "30px 20px",
    textAlign: "center",
    color: "#6b7280",
    background: "#f9fafb",
  },
  emptyTitle: {
    margin: "0 0 8px",
    color: "#111827",
  },
  emptyText: {
    margin: 0,
  },
  currentCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "20px",
    background: "#ffffff",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    alignItems: "center",
    marginBottom: "18px",
  },
  cardLabel: {
    margin: 0,
    color: "#6b7280",
    fontSize: "14px",
    fontWeight: 700,
  },
  currentTitle: {
    margin: "8px 0",
    fontSize: "26px",
  },
  currentText: {
    margin: 0,
    color: "#374151",
    lineHeight: 1.6,
  },
  paymentBox: {
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "16px",
    background: "#f9fafb",
    marginBottom: "20px",
    display: "grid",
    gap: "8px",
  },
  helperText: {
    margin: 0,
    color: "#6b7280",
    fontSize: "14px",
  },
  planGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "18px",
    marginBottom: "28px",
  },
  planCard: {
    position: "relative",
    border: "1px solid #e5e7eb",
    borderRadius: "22px",
    padding: "22px",
    background: "#ffffff",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
  },
  popularCard: {
    borderColor: "#16a34a",
  },
  popularBadge: {
    position: "absolute",
    top: "14px",
    right: "14px",
    background: "#16a34a",
    color: "#ffffff",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: 900,
  },
  planName: {
    margin: "0 0 10px",
    fontSize: "26px",
  },
  planDescription: {
    margin: "0 0 18px",
    color: "#6b7280",
    lineHeight: 1.6,
  },
  priceRow: {
    display: "flex",
    alignItems: "baseline",
    gap: "6px",
    marginBottom: "16px",
  },
  price: {
    fontSize: "32px",
    fontWeight: 900,
  },
  duration: {
    color: "#6b7280",
    fontWeight: 700,
  },
  featureList: {
    margin: "0 0 18px",
    paddingLeft: "20px",
    color: "#374151",
    lineHeight: 1.8,
  },
  featureItem: {
    marginBottom: "4px",
  },
  primaryButton: {
    border: "none",
    borderRadius: "999px",
    background: "#16a34a",
    color: "#ffffff",
    padding: "11px 17px",
    fontWeight: 900,
    cursor: "pointer",
  },
  secondaryButton: {
    border: "1px solid #16a34a",
    borderRadius: "999px",
    background: "#ffffff",
    color: "#16a34a",
    padding: "10px 15px",
    fontWeight: 900,
    cursor: "pointer",
  },
  dangerButton: {
    border: "1px solid #fecaca",
    borderRadius: "999px",
    background: "#ffffff",
    color: "#dc2626",
    padding: "10px 15px",
    fontWeight: 900,
    cursor: "pointer",
  },
  disabledButton: {
    background: "#9ca3af",
    cursor: "not-allowed",
  },
  historySection: {
    marginTop: "28px",
  },
  sectionTitle: {
    margin: "0 0 16px",
    fontSize: "26px",
  },
  tableWrap: {
    overflowX: "auto",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    background: "#ffffff",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "14px",
    background: "#f9fafb",
    color: "#374151",
    borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "14px",
    borderBottom: "1px solid #f3f4f6",
    color: "#374151",
    verticalAlign: "top",
  },
  adminSection: {
    marginTop: "34px",
    borderTop: "1px solid #e5e7eb",
    paddingTop: "28px",
  },
  adminHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
    marginBottom: "16px",
  },
  adminStats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
    marginBottom: "20px",
  },
  statBox: {
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "18px",
    background: "#ffffff",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
  },
  statValue: {
    margin: "8px 0 0",
    fontSize: "26px",
  },
  formCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "20px",
    background: "#ffffff",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
    display: "grid",
    gap: "14px",
    marginBottom: "24px",
  },
  formTitle: {
    margin: "0 0 12px",
    fontSize: "22px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
  },
  label: {
    display: "grid",
    gap: "8px",
    fontWeight: 800,
    color: "#374151",
  },
  input: {
    border: "1px solid #d1d5db",
    borderRadius: "14px",
    padding: "11px 12px",
    font: "inherit",
  },
  textarea: {
    border: "1px solid #d1d5db",
    borderRadius: "14px",
    padding: "11px 12px",
    font: "inherit",
    resize: "vertical",
  },
  checkboxRow: {
    display: "flex",
    gap: "18px",
    flexWrap: "wrap",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: 800,
    color: "#374151",
  },
  formActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  adminPlanList: {
    display: "grid",
    gap: "12px",
    marginBottom: "24px",
  },
  adminPlanCard: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "center",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "16px",
    background: "#ffffff",
  },
  adminPlanTitle: {
    margin: "0 0 6px",
    fontSize: "18px",
  },
  adminPlanText: {
    margin: 0,
    color: "#6b7280",
  },
  adminPlanActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
};

export default Memberships;