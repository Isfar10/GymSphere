import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

const GYMSPHERE_BKASH_NUMBER = "01799089557";

const DEFAULT_MEMBERSHIP_PLANS = [
  {
    id: "default-1-year",
    name: "1 Year",
    price: 20000,
    durationDays: 365,
    isDefaultPlan: true,
  },
  {
    id: "default-6-month",
    name: "6 Month",
    price: 11000,
    durationDays: 180,
    isDefaultPlan: true,
  },
  {
    id: "default-3-month",
    name: "3 Month",
    price: 6500,
    durationDays: 90,
    isDefaultPlan: true,
  },
  {
    id: "default-1-month",
    name: "1 Month",
    price: 3000,
    durationDays: 30,
    isDefaultPlan: true,
  },
];

function ManualBkashPayments() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [plans, setPlans] = useState([]);
  const [myPayments, setMyPayments] = useState([]);
  const [adminPayments, setAdminPayments] = useState([]);
  const [adminBkashNumber, setAdminBkashNumber] = useState(
    GYMSPHERE_BKASH_NUMBER
  );
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [bkashNumber, setBkashNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [adminFilter, setAdminFilter] = useState("pending");
  const [adminNote, setAdminNote] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isAdmin = user?.role === "admin";

  const userPhoneNumber =
    user?.phone ||
    user?.phoneNumber ||
    user?.mobile ||
    user?.mobileNumber ||
    user?.bkashNumber ||
    "";

  const visiblePlans = plans.length > 0 ? plans : DEFAULT_MEMBERSHIP_PLANS;

  const selectedPlan = useMemo(() => {
    return visiblePlans.find(
      (plan) => String(plan.id) === String(selectedPlanId)
    );
  }, [visiblePlans, selectedPlanId]);

  const paymentStats = useMemo(() => {
    const pending = adminPayments.filter(
      (payment) => payment.status === "pending"
    ).length;
    const approved = adminPayments.filter(
      (payment) => payment.status === "approved"
    ).length;
    const rejected = adminPayments.filter(
      (payment) => payment.status === "rejected"
    ).length;

    return { pending, approved, rejected };
  }, [adminPayments]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [plansResponse, myPaymentsResponse] = await Promise.all([
        API.get("/memberships/plans"),
        API.get("/manual-bkash-payments/my-payments"),
      ]);

      const fetchedPlans = plansResponse.data.plans || [];
      const usablePlans =
        fetchedPlans.length > 0 ? fetchedPlans : DEFAULT_MEMBERSHIP_PLANS;

      setPlans(fetchedPlans);
      setMyPayments(myPaymentsResponse.data.payments || []);

      if (myPaymentsResponse.data.adminBkashNumber) {
        setAdminBkashNumber(myPaymentsResponse.data.adminBkashNumber);
      } else {
        setAdminBkashNumber(GYMSPHERE_BKASH_NUMBER);
      }

      const planIdFromUrl = searchParams.get("planId");

      if (
        planIdFromUrl &&
        usablePlans.some((plan) => String(plan.id) === String(planIdFromUrl))
      ) {
        setSelectedPlanId(planIdFromUrl);
      } else if (!selectedPlanId && usablePlans.length > 0) {
        setSelectedPlanId(usablePlans[0].id);
      }

      if (!bkashNumber && userPhoneNumber) {
        setBkashNumber(userPhoneNumber);
      }

      if (isAdmin) {
        const adminResponse = await API.get(
          `/manual-bkash-payments/admin?status=${adminFilter}`
        );

        setAdminPayments(adminResponse.data.payments || []);

        if (adminResponse.data.adminBkashNumber) {
          setAdminBkashNumber(adminResponse.data.adminBkashNumber);
        }
      }
    } catch (err) {
      const planIdFromUrl = searchParams.get("planId");

      setPlans([]);
      setAdminBkashNumber(GYMSPHERE_BKASH_NUMBER);

      if (planIdFromUrl) {
        setSelectedPlanId(planIdFromUrl);
      } else if (!selectedPlanId) {
        setSelectedPlanId(DEFAULT_MEMBERSHIP_PLANS[0].id);
      }

      if (!bkashNumber && userPhoneNumber) {
        setBkashNumber(userPhoneNumber);
      }

      setError(
        err.response?.data?.message ||
          "Failed to load bKash payment data. Showing default membership plans."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAdmin, adminFilter]);

  useEffect(() => {
    if (!bkashNumber && userPhoneNumber) {
      setBkashNumber(userPhoneNumber);
    }
  }, [userPhoneNumber, bkashNumber]);

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(""), 2500);
  };

  const formatCurrency = (value) => {
    return `${Number(value || 0).toLocaleString()} TK`;
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";
    return new Date(dateValue).toLocaleString();
  };

  const resetForm = () => {
    setBkashNumber(userPhoneNumber || "");
    setTransactionId("");
  };

  const submitPayment = async (event) => {
    event.preventDefault();

    if (!selectedPlanId || !bkashNumber.trim() || !transactionId.trim()) {
      setError("Please select a plan and enter bKash number plus transaction ID.");
      return;
    }

    if (selectedPlan?.isDefaultPlan) {
      setError(
        "This default plan is visible in the frontend, but it is not saved in the database yet. Login as admin and create these plans, or use Seed Default Plans if your backend supports it."
      );
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await API.post("/manual-bkash-payments", {
        planId: selectedPlanId,
        bkashNumber,
        transactionId,
      });

      resetForm();
      await fetchData();

      showSuccess("Payment submitted. Please wait for admin approval.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit payment.");
    } finally {
      setActionLoading(false);
    }
  };

  const updateAdminNote = (paymentId, value) => {
    setAdminNote((previous) => ({
      ...previous,
      [paymentId]: value,
    }));
  };

  const approvePayment = async (paymentId) => {
    try {
      setActionLoading(true);
      setError("");

      await API.patch(`/manual-bkash-payments/${paymentId}/approve`, {
        adminNote: adminNote[paymentId] || "Payment verified and approved.",
      });

      await fetchData();

      showSuccess("Payment approved and membership activated.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve payment.");
    } finally {
      setActionLoading(false);
    }
  };

  const rejectPayment = async (paymentId) => {
    try {
      setActionLoading(true);
      setError("");

      await API.patch(`/manual-bkash-payments/${paymentId}/reject`, {
        adminNote:
          adminNote[paymentId] ||
          "Payment could not be verified. Please check your transaction ID.",
      });

      await fetchData();

      showSuccess("Payment rejected.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reject payment.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <main style={styles.page}>
        <header style={styles.header}>
          <div>
            <p style={styles.eyebrow}>Manual Payment</p>
            <h1 style={styles.title}>bKash Payment Verification</h1>
            <p style={styles.subtitle}>
              Send payment manually to the GymSphere bKash number, then submit
              your sender number and transaction ID for admin verification.
            </p>
          </div>

          <button type="button" onClick={fetchData} style={styles.refreshButton}>
            Refresh
          </button>
        </header>

        {error && <div style={styles.errorBox}>{error}</div>}
        {success && <div style={styles.successBox}>{success}</div>}

        {loading ? (
          <div style={styles.emptyBox}>Loading bKash payments...</div>
        ) : (
          <>
            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>How to Pay</h2>

              <div style={styles.stepsGrid}>
                <div style={styles.stepBox}>
                  <strong>1. Select Plan</strong>
                  <p>Choose the membership plan you want to buy.</p>
                </div>

                <div style={styles.stepBox}>
                  <strong>2. Send Money</strong>
                  <p>Send the exact amount to this bKash number:</p>
                  <h3 style={styles.bkashNumber}>{adminBkashNumber}</h3>
                </div>

                <div style={styles.stepBox}>
                  <strong>3. Submit Proof</strong>
                  <p>Enter sender bKash number and transaction ID below.</p>
                </div>

                <div style={styles.stepBox}>
                  <strong>4. Admin Approval</strong>
                  <p>Admin verifies payment and activates membership.</p>
                </div>
              </div>
            </section>

            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>Submit bKash Payment</h2>

              <form onSubmit={submitPayment} style={styles.paymentForm}>
                <label style={styles.label}>
                  Membership Plan
                  <select
                    value={selectedPlanId}
                    onChange={(event) => setSelectedPlanId(event.target.value)}
                    style={styles.input}
                  >
                    {visiblePlans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} - {formatCurrency(plan.price)}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={styles.label}>
                  Sender bKash Number
                  <input
                    value={bkashNumber}
                    onChange={(event) => setBkashNumber(event.target.value)}
                    placeholder="Enter your bKash number"
                    style={styles.input}
                  />
                </label>

                <label style={styles.label}>
                  Transaction ID
                  <input
                    value={transactionId}
                    onChange={(event) => setTransactionId(event.target.value)}
                    placeholder="Example: A1B2C3D4E5"
                    style={styles.input}
                  />
                </label>

                {selectedPlan && (
                  <div style={styles.selectedPlanBox}>
                    <strong>{selectedPlan.name}</strong>
                    <p>
                      Amount: {formatCurrency(selectedPlan.price)} • Duration:{" "}
                      {selectedPlan.durationDays} days
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={actionLoading}
                  style={styles.primaryButton}
                >
                  Submit Payment Proof
                </button>
              </form>
            </section>

            <section style={styles.historySection}>
              <h2 style={styles.sectionTitle}>My bKash Payments</h2>

              {myPayments.length === 0 ? (
                <div style={styles.emptyBox}>No bKash payments submitted yet.</div>
              ) : (
                <div style={styles.tableWrap}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Plan</th>
                        <th style={styles.th}>Amount</th>
                        <th style={styles.th}>Sender Number</th>
                        <th style={styles.th}>Transaction ID</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Submitted</th>
                        <th style={styles.th}>Admin Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myPayments.map((payment) => (
                        <tr key={payment.id}>
                          <td style={styles.td}>{payment.plan?.name}</td>
                          <td style={styles.td}>
                            {formatCurrency(payment.amount)}
                          </td>
                          <td style={styles.td}>{payment.bkashNumber}</td>
                          <td style={styles.td}>{payment.transactionId}</td>
                          <td style={styles.td}>{payment.status}</td>
                          <td style={styles.td}>
                            {formatDate(payment.createdAt)}
                          </td>
                          <td style={styles.td}>
                            {payment.adminNote || "N/A"}
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
                <p style={styles.eyebrow}>Admin</p>
                <h2 style={styles.sectionTitle}>Verify bKash Payments</h2>

                <div style={styles.statsGrid}>
                  <StatBox label="Pending" value={paymentStats.pending} />
                  <StatBox label="Approved" value={paymentStats.approved} />
                  <StatBox label="Rejected" value={paymentStats.rejected} />
                </div>

                <label style={styles.filterLabel}>
                  Filter
                  <select
                    value={adminFilter}
                    onChange={(event) => setAdminFilter(event.target.value)}
                    style={styles.input}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </label>

                {adminPayments.length === 0 ? (
                  <div style={styles.emptyBox}>
                    No {adminFilter} bKash payments found.
                  </div>
                ) : (
                  <div style={styles.adminList}>
                    {adminPayments.map((payment) => (
                      <article key={payment.id} style={styles.adminPaymentCard}>
                        <div>
                          <h3 style={styles.adminPaymentTitle}>
                            {payment.user?.name} - {payment.plan?.name}
                          </h3>
                          <p style={styles.adminPaymentText}>
                            {payment.user?.email} • Submitted{" "}
                            {formatDate(payment.createdAt)}
                          </p>
                          <p style={styles.adminPaymentText}>
                            Amount: {formatCurrency(payment.amount)} • Sender:{" "}
                            {payment.bkashNumber} • Transaction ID:{" "}
                            {payment.transactionId}
                          </p>
                          <p style={styles.adminPaymentText}>
                            Status: <strong>{payment.status}</strong>
                          </p>
                        </div>

                        {payment.status === "pending" && (
                          <div style={styles.adminActions}>
                            <input
                              value={adminNote[payment.id] || ""}
                              onChange={(event) =>
                                updateAdminNote(payment.id, event.target.value)
                              }
                              placeholder="Admin note"
                              style={styles.input}
                            />

                            <button
                              type="button"
                              onClick={() => approvePayment(payment.id)}
                              disabled={actionLoading}
                              style={styles.primaryButton}
                            >
                              Approve
                            </button>

                            <button
                              type="button"
                              onClick={() => rejectPayment(payment.id)}
                              disabled={actionLoading}
                              style={styles.dangerButton}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </article>
                    ))}
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
      <p style={styles.statLabel}>{label}</p>
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
  card: {
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "20px",
    background: "#ffffff",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
    marginBottom: "18px",
  },
  sectionTitle: {
    margin: "0 0 16px",
    fontSize: "26px",
  },
  stepsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
  },
  stepBox: {
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "16px",
    background: "#f9fafb",
  },
  bkashNumber: {
    margin: "8px 0 0",
    color: "#16a34a",
    fontSize: "22px",
    letterSpacing: "0.04em",
  },
  paymentForm: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "14px",
    alignItems: "end",
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
    padding: "12px",
    font: "inherit",
    minHeight: "46px",
  },
  selectedPlanBox: {
    border: "1px solid #bbf7d0",
    borderRadius: "14px",
    background: "#f0fdf4",
    color: "#166534",
    padding: "14px",
  },
  primaryButton: {
    border: "none",
    borderRadius: "999px",
    background: "#16a34a",
    color: "#ffffff",
    padding: "12px 18px",
    fontWeight: 900,
    cursor: "pointer",
  },
  dangerButton: {
    border: "1px solid #fecaca",
    borderRadius: "999px",
    background: "#ffffff",
    color: "#dc2626",
    padding: "11px 17px",
    fontWeight: 900,
    cursor: "pointer",
  },
  historySection: {
    marginTop: "28px",
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
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
    marginBottom: "18px",
  },
  statBox: {
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "18px",
    background: "#ffffff",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
  },
  statLabel: {
    margin: 0,
    color: "#6b7280",
    fontWeight: 800,
  },
  statValue: {
    margin: "8px 0 0",
    fontSize: "28px",
  },
  filterLabel: {
    display: "grid",
    gap: "8px",
    maxWidth: "260px",
    fontWeight: 800,
    marginBottom: "18px",
  },
  adminList: {
    display: "grid",
    gap: "14px",
  },
  adminPaymentCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "18px",
    background: "#ffffff",
    display: "grid",
    gap: "14px",
  },
  adminPaymentTitle: {
    margin: "0 0 8px",
    fontSize: "20px",
  },
  adminPaymentText: {
    margin: "4px 0",
    color: "#4b5563",
  },
  adminActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    alignItems: "center",
  },
};

export default ManualBkashPayments;