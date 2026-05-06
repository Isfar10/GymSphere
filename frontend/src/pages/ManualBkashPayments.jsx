import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

function ManualBkashPayments() {
  const { user } = useAuth();

  const [plans, setPlans] = useState([]);
  const [myPayments, setMyPayments] = useState([]);
  const [adminPayments, setAdminPayments] = useState([]);
  const [adminBkashNumber, setAdminBkashNumber] = useState("01XXXXXXXXX");
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

  const selectedPlan = useMemo(() => {
    return plans.find((plan) => String(plan.id) === String(selectedPlanId));
  }, [plans, selectedPlanId]);

  const paymentStats = useMemo(() => {
    const pending = adminPayments.filter((payment) => payment.status === "pending").length;
    const approved = adminPayments.filter((payment) => payment.status === "approved").length;
    const rejected = adminPayments.filter((payment) => payment.status === "rejected").length;

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
      setPlans(fetchedPlans);
      setMyPayments(myPaymentsResponse.data.payments || []);

      if (myPaymentsResponse.data.adminBkashNumber) {
        setAdminBkashNumber(myPaymentsResponse.data.adminBkashNumber);
      }

      if (!selectedPlanId && fetchedPlans.length > 0) {
        setSelectedPlanId(fetchedPlans[0].id);
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
      setError(
        err.response?.data?.message ||
          "Failed to load bKash payment data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAdmin, adminFilter]);

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(""), 2500);
  };

  const formatCurrency = (value) => {
    return `৳${Number(value || 0).toLocaleString()}`;
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";
    return new Date(dateValue).toLocaleString();
  };

  const resetForm = () => {
    setBkashNumber("");
    setTransactionId("");
  };

  const submitPayment = async (event) => {
    event.preventDefault();

    if (!selectedPlanId || !bkashNumber.trim() || !transactionId.trim()) {
      setError("Please select a plan and enter bKash number plus transaction ID.");
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
        <section style={styles.header}>
          <div>
            <p style={styles.eyebrow}>Manual Payment</p>
            <h1 style={styles.title}>bKash Payment Verification</h1>
            <p style={styles.subtitle}>
              Send payment manually to the GymSphere bKash number, then submit
              your transaction ID for admin verification.
            </p>
          </div>

          <button type="button" onClick={fetchData} style={styles.refreshButton}>
            Refresh
          </button>
        </section>

        {error && <div style={styles.errorBox}>{error}</div>}
        {success && <div style={styles.successBox}>{success}</div>}

        {loading ? (
          <div style={styles.emptyBox}>Loading bKash payments...</div>
        ) : (
          <>
            <section style={styles.instructionsCard}>
              <h2 style={styles.sectionTitle}>How to Pay</h2>

              <div style={styles.stepsGrid}>
                <div style={styles.stepBox}>
                  <strong>1. Select Plan</strong>
                  <p>Choose the membership plan you want to buy.</p>
                </div>

                <div style={styles.stepBox}>
                  <strong>2. Send Money</strong>
                  <p>
                    Send the exact amount to this bKash number:
                    <br />
                    <span style={styles.bkashNumber}>{adminBkashNumber}</span>
                  </p>
                </div>

                <div style={styles.stepBox}>
                  <strong>3. Submit Proof</strong>
                  <p>Enter sender number and transaction ID below.</p>
                </div>

                <div style={styles.stepBox}>
                  <strong>4. Admin Approval</strong>
                  <p>Admin verifies payment and activates membership.</p>
                </div>
              </div>
            </section>

            <section style={styles.formCard}>
              <h2 style={styles.sectionTitle}>Submit bKash Payment</h2>

              <form onSubmit={submitPayment} style={styles.form}>
                <div style={styles.formGrid}>
                  <label style={styles.label}>
                    Membership Plan
                    <select
                      value={selectedPlanId}
                      onChange={(event) => setSelectedPlanId(event.target.value)}
                      style={styles.input}
                    >
                      {plans.map((plan) => (
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
                      placeholder="01XXXXXXXXX"
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
                </div>

                {selectedPlan && (
                  <div style={styles.selectedPlanBox}>
                    <strong>{selectedPlan.name}</strong>
                    <p>
                      Amount: <strong>{formatCurrency(selectedPlan.price)}</strong> •
                      Duration: <strong>{selectedPlan.durationDays} days</strong>
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={actionLoading || plans.length === 0}
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
                          <td style={styles.td}>{formatCurrency(payment.amount)}</td>
                          <td style={styles.td}>{payment.bkashNumber}</td>
                          <td style={styles.td}>{payment.transactionId}</td>
                          <td style={styles.td}>
                            <StatusBadge status={payment.status} />
                          </td>
                          <td style={styles.td}>{formatDate(payment.createdAt)}</td>
                          <td style={styles.td}>{payment.adminNote || "N/A"}</td>
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
                    <h2 style={styles.sectionTitle}>Verify bKash Payments</h2>
                  </div>

                  <select
                    value={adminFilter}
                    onChange={(event) => setAdminFilter(event.target.value)}
                    style={styles.input}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div style={styles.statsGrid}>
                  <StatCard label="Pending" value={paymentStats.pending} />
                  <StatCard label="Approved" value={paymentStats.approved} />
                  <StatCard label="Rejected" value={paymentStats.rejected} />
                </div>

                {adminPayments.length === 0 ? (
                  <div style={styles.emptyBox}>
                    No {adminFilter} bKash payments found.
                  </div>
                ) : (
                  <div style={styles.adminList}>
                    {adminPayments.map((payment) => (
                      <article key={payment.id} style={styles.adminCard}>
                        <div style={styles.adminCardTop}>
                          <div>
                            <h3 style={styles.paymentTitle}>
                              {payment.user?.name} - {payment.plan?.name}
                            </h3>
                            <p style={styles.mutedText}>
                              {payment.user?.email} • Submitted{" "}
                              {formatDate(payment.createdAt)}
                            </p>
                          </div>

                          <StatusBadge status={payment.status} />
                        </div>

                        <div style={styles.detailGrid}>
                          <Detail label="Amount" value={formatCurrency(payment.amount)} />
                          <Detail label="Sender Number" value={payment.bkashNumber} />
                          <Detail label="Transaction ID" value={payment.transactionId} />
                          <Detail label="Admin Number" value={payment.adminBkashNumber} />
                        </div>

                        {payment.status === "pending" ? (
                          <>
                            <label style={styles.label}>
                              Admin Note
                              <textarea
                                value={adminNote[payment.id] || ""}
                                onChange={(event) =>
                                  updateAdminNote(payment.id, event.target.value)
                                }
                                placeholder="Optional note for user"
                                style={styles.textarea}
                                rows="3"
                              />
                            </label>

                            <div style={styles.actionRow}>
                              <button
                                type="button"
                                onClick={() => approvePayment(payment.id)}
                                disabled={actionLoading}
                                style={styles.primaryButton}
                              >
                                Approve & Activate
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
                          </>
                        ) : (
                          <div style={styles.reviewBox}>
                            <p>
                              Reviewed by:{" "}
                              <strong>{payment.reviewedBy?.name || "Admin"}</strong>
                            </p>
                            <p>Reviewed at: {formatDate(payment.reviewedAt)}</p>
                            <p>Note: {payment.adminNote || "N/A"}</p>
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

function StatusBadge({ status }) {
  const styleByStatus = {
    pending: {
      background: "#fef3c7",
      color: "#92400e",
    },
    approved: {
      background: "#dcfce7",
      color: "#166534",
    },
    rejected: {
      background: "#fee2e2",
      color: "#991b1b",
    },
  };

  return (
    <span
      style={{
        ...styles.statusBadge,
        ...(styleByStatus[status] || styleByStatus.pending),
      }}
    >
      {status}
    </span>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={styles.statCard}>
      <p style={styles.cardLabel}>{label}</p>
      <h3 style={styles.statValue}>{value}</h3>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div style={styles.detailBox}>
      <p style={styles.cardLabel}>{label}</p>
      <strong>{value}</strong>
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
  instructionsCard: {
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
    borderRadius: "16px",
    padding: "16px",
    background: "#f9fafb",
  },
  bkashNumber: {
    display: "inline-block",
    marginTop: "6px",
    color: "#16a34a",
    fontSize: "20px",
    fontWeight: 900,
  },
  formCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "20px",
    background: "#ffffff",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
    marginBottom: "24px",
  },
  form: {
    display: "grid",
    gap: "14px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "14px",
  },
  label: {
    display: "grid",
    gap: "8px",
    color: "#374151",
    fontWeight: 800,
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
  selectedPlanBox: {
    border: "1px solid #bbf7d0",
    borderRadius: "16px",
    padding: "14px",
    background: "#f0fdf4",
    color: "#166534",
  },
  primaryButton: {
    border: "none",
    borderRadius: "999px",
    background: "#16a34a",
    color: "#ffffff",
    padding: "11px 17px",
    fontWeight: 900,
    cursor: "pointer",
    justifySelf: "start",
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
  historySection: {
    marginTop: "24px",
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
    whiteSpace: "nowrap",
  },
  statusBadge: {
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: 900,
    textTransform: "capitalize",
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
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
    marginBottom: "20px",
  },
  statCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "16px",
    background: "#ffffff",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
  },
  cardLabel: {
    margin: 0,
    color: "#6b7280",
    fontSize: "14px",
    fontWeight: 700,
  },
  statValue: {
    margin: "8px 0 0",
    fontSize: "26px",
  },
  adminList: {
    display: "grid",
    gap: "16px",
  },
  adminCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "20px",
    background: "#ffffff",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
  },
  adminCardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
    marginBottom: "16px",
  },
  paymentTitle: {
    margin: "0 0 6px",
    fontSize: "21px",
  },
  mutedText: {
    margin: 0,
    color: "#6b7280",
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "12px",
    marginBottom: "16px",
  },
  detailBox: {
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "12px",
    background: "#f9fafb",
  },
  actionRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "12px",
  },
  reviewBox: {
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "12px",
    background: "#f9fafb",
    color: "#374151",
  },
};

export default ManualBkashPayments;