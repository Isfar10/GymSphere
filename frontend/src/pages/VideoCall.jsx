import { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import PageShell from "../components/PageShell";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

// NOTE: For production, integrate a signaling server (e.g., socket.io) and a TURN server.
// This page provides the full UI and call management. WebRTC peer connection is established
// through a shared roomId that both parties open. In development, users on the same network
// can connect; for production, add a signaling backend.

function VideoCall() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [callHistory, setCallHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCall, setActiveCall] = useState(null); // { callId, roomId, partner }
  const [callState, setCallState] = useState("idle"); // idle | calling | in-call | ended
  const [error, setError] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchContacts(), fetchCallHistory()]);
      setLoading(false);
    };
    init();
  }, []);

  const fetchContacts = async () => {
    try {
      const { data } = await API.get("/chat/contacts");
      if (data.success) setContacts(data.contacts);
    } catch {/* silent */}
  };

  const fetchCallHistory = async () => {
    try {
      const { data } = await API.get("/video-calls/history");
      if (data.success) setCallHistory(data.calls);
    } catch {/* silent */}
  };

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      setError("Camera/microphone access denied. Please allow permissions.");
      return null;
    }
  };

  const stopLocalStream = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
  };

  const initiateCall = async (contact) => {
    setError("");
    setCallState("calling");

    const stream = await startLocalStream();
    if (!stream) {
      setCallState("idle");
      return;
    }

    try {
      const { data } = await API.post("/video-calls/initiate", {
        partnerId: contact._id,
      });
      if (data.success) {
        setActiveCall({ ...data.call, partner: contact });
        setCallState("in-call");
        startTimer();
        await updateCallStatus(data.call._id, "active");
        fetchCallHistory();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to initiate call");
      setCallState("idle");
      stopLocalStream();
    }
  };

  const endCall = async () => {
    if (activeCall) {
      await updateCallStatus(activeCall._id, "ended");
    }
    stopLocalStream();
    stopTimer();
    setCallState("ended");
    setElapsedSeconds(0);
    fetchCallHistory();
    setTimeout(() => {
      setCallState("idle");
      setActiveCall(null);
    }, 2000);
  };

  const updateCallStatus = async (callId, status) => {
    try {
      await API.patch(`/video-calls/${callId}/status`, { status });
    } catch {/* silent */}
  };

  const startTimer = () => {
    setElapsedSeconds(0);
    timerRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
  };

  const stopTimer = () => {
    clearInterval(timerRef.current);
  };

  useEffect(() => () => { stopLocalStream(); stopTimer(); }, []);

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const formatCallDuration = (secs) => {
    if (!secs) return "—";
    if (secs < 60) return `${secs}s`;
    return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  };

  return (
    <>
      <Navbar />
      <PageShell
        eyebrow="Live Sessions"
        title="Video Calls"
        subtitle="Start live virtual workout sessions with your trainer or trainee."
        heroIcon="📹"
      >
        {error && <div style={styles.errorBanner}>{error}</div>}

        {/* Active Call UI */}
        {callState !== "idle" && (
          <div style={styles.callOverlay}>
            <div style={styles.callCard}>
              {callState === "calling" && (
                <div style={styles.callingState}>
                  <div style={styles.callingRing} />
                  <p style={styles.callingText}>Connecting…</p>
                </div>
              )}

              {callState === "ended" && (
                <div style={styles.endedState}>
                  <span style={{ fontSize: "48px" }}>✅</span>
                  <p style={styles.callingText}>Call Ended</p>
                  <p style={{ color: "#64748b", fontSize: "14px" }}>
                    Duration: {formatDuration(elapsedSeconds)}
                  </p>
                </div>
              )}

              {callState === "in-call" && (
                <>
                  <div style={styles.videoGrid}>
                    <div style={styles.videoWrapper}>
                      <video
                        ref={remoteVideoRef}
                        style={styles.remoteVideo}
                        autoPlay
                        playsInline
                      />
                      <div style={styles.remoteLabel}>
                        {activeCall?.partner?.name || "Partner"}
                      </div>
                    </div>
                    <div style={styles.localWrapper}>
                      <video
                        ref={localVideoRef}
                        style={styles.localVideo}
                        autoPlay
                        playsInline
                        muted
                      />
                      <div style={styles.localLabel}>You</div>
                    </div>
                  </div>

                  <div style={styles.callBar}>
                    <div style={styles.callInfo}>
                      <span style={styles.liveChip}>🔴 LIVE</span>
                      <span style={styles.callTimer}>
                        {formatDuration(elapsedSeconds)}
                      </span>
                      <span style={styles.callWith}>
                        with {activeCall?.partner?.name}
                      </span>
                    </div>
                    <div style={styles.callInfo}>
                      <span style={styles.roomId}>
                        Room: {activeCall?.roomId?.slice(-8)}
                      </span>
                    </div>
                    <button style={styles.endBtn} onClick={endCall}>
                      📵 End Call
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {callState === "idle" && (
          <div style={styles.layout}>
            {/* Contacts to Call */}
            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>📞 Start a Call</h2>
              {loading ? (
                <p style={styles.hint}>Loading contacts…</p>
              ) : contacts.length === 0 ? (
                <p style={styles.hint}>No contacts available to call.</p>
              ) : (
                <div style={styles.contactList}>
                  {contacts.map((c) => (
                    <div key={c._id} style={styles.contactRow}>
                      <div style={styles.contactAvatar}>
                        {c.name?.[0]?.toUpperCase()}
                      </div>
                      <div style={styles.contactMeta}>
                        <div style={styles.contactName}>{c.name}</div>
                        <div style={styles.contactRole}>{c.role}</div>
                      </div>
                      <button
                        style={styles.callBtn}
                        onClick={() => initiateCall(c)}
                      >
                        📹 Call
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Call History */}
            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>🕑 Call History</h2>
              {loading ? (
                <p style={styles.hint}>Loading…</p>
              ) : callHistory.length === 0 ? (
                <p style={styles.hint}>No calls yet. Start your first session above.</p>
              ) : (
                <div style={styles.historyList}>
                  {callHistory.map((c) => {
                    const isTrainer = user?._id === c.trainer?._id || user?.id === c.trainer?._id;
                    const partner = isTrainer ? c.trainee : c.trainer;
                    const statusColor = {
                      active: "#16a34a",
                      ended: "#64748b",
                      pending: "#f59e0b",
                      missed: "#dc2626",
                    }[c.status] || "#64748b";

                    return (
                      <div key={c._id} style={styles.historyRow}>
                        <div style={styles.historyAvatar}>
                          {partner?.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div style={styles.historyMeta}>
                          <div style={styles.historyName}>{partner?.name || "Unknown"}</div>
                          <div style={styles.historyDate}>
                            {new Date(c.createdAt).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ ...styles.statusChip, background: statusColor }}>
                            {c.status}
                          </span>
                          <div style={styles.historyDuration}>
                            {formatCallDuration(c.durationSeconds)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </PageShell>
    </>
  );
}

const styles = {
  errorBanner: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#dc2626",
    padding: "12px 16px",
    borderRadius: "10px",
    margin: "16px 0",
    fontSize: "14px",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
    margin: "24px 0",
  },
  card: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "24px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 24px rgba(0,0,0,0.05)",
  },
  sectionTitle: {
    fontSize: "17px",
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: "18px",
  },
  hint: {
    color: "#94a3b8",
    fontSize: "14px",
    textAlign: "center",
    padding: "20px 0",
  },
  contactList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  contactRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    background: "#f8fafc",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
  },
  contactAvatar: {
    width: "44px",
    height: "44px",
    borderRadius: "999px",
    background: "linear-gradient(135deg, #16a34a, #22c55e)",
    color: "#fff",
    display: "grid",
    placeItems: "center",
    fontWeight: 900,
    fontSize: "18px",
    flexShrink: 0,
  },
  contactMeta: { flex: 1 },
  contactName: { fontWeight: 700, fontSize: "15px", color: "#0f172a" },
  contactRole: { fontSize: "12px", color: "#64748b", textTransform: "capitalize" },
  callBtn: {
    padding: "8px 16px",
    background: "linear-gradient(135deg, #16a34a, #22c55e)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: "13px",
  },
  historyList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  historyRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px",
    borderBottom: "1px solid #f1f5f9",
  },
  historyAvatar: {
    width: "38px",
    height: "38px",
    borderRadius: "999px",
    background: "#0f172a",
    color: "#fff",
    display: "grid",
    placeItems: "center",
    fontWeight: 900,
    fontSize: "15px",
    flexShrink: 0,
  },
  historyMeta: { flex: 1 },
  historyName: { fontWeight: 700, fontSize: "14px", color: "#0f172a" },
  historyDate: { fontSize: "12px", color: "#64748b" },
  statusChip: {
    display: "inline-block",
    color: "#fff",
    borderRadius: "999px",
    padding: "2px 10px",
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "capitalize",
  },
  historyDuration: { fontSize: "12px", color: "#94a3b8", marginTop: "2px" },
  callOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.85)",
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  callCard: {
    width: "min(900px, 95vw)",
    background: "#0f172a",
    borderRadius: "24px",
    overflow: "hidden",
  },
  callingState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 40px",
    gap: "24px",
  },
  callingRing: {
    width: "80px",
    height: "80px",
    borderRadius: "999px",
    border: "4px solid #22c55e",
    animation: "pulse 1.5s infinite",
  },
  callingText: {
    color: "#fff",
    fontSize: "22px",
    fontWeight: 800,
  },
  endedState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 40px",
    gap: "16px",
  },
  videoGrid: {
    position: "relative",
    background: "#1e293b",
    aspectRatio: "16/9",
  },
  videoWrapper: {
    position: "relative",
    width: "100%",
    height: "100%",
  },
  remoteVideo: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    background: "#1e293b",
  },
  remoteLabel: {
    position: "absolute",
    bottom: "12px",
    left: "16px",
    color: "#fff",
    background: "rgba(0,0,0,0.5)",
    borderRadius: "8px",
    padding: "4px 10px",
    fontSize: "13px",
    fontWeight: 700,
  },
  localWrapper: {
    position: "absolute",
    bottom: "16px",
    right: "16px",
    width: "180px",
    borderRadius: "12px",
    overflow: "hidden",
    border: "2px solid #22c55e",
  },
  localVideo: {
    width: "100%",
    objectFit: "cover",
    display: "block",
    background: "#334155",
  },
  localLabel: {
    position: "absolute",
    bottom: "6px",
    left: "8px",
    color: "#fff",
    background: "rgba(0,0,0,0.5)",
    borderRadius: "6px",
    padding: "2px 8px",
    fontSize: "11px",
    fontWeight: 700,
  },
  callBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 20px",
    background: "#0f172a",
    gap: "12px",
    flexWrap: "wrap",
  },
  callInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  liveChip: {
    fontSize: "12px",
    fontWeight: 900,
    color: "#ef4444",
  },
  callTimer: {
    fontFamily: "monospace",
    fontSize: "20px",
    fontWeight: 900,
    color: "#22c55e",
  },
  callWith: {
    color: "#94a3b8",
    fontSize: "14px",
  },
  roomId: {
    color: "#475569",
    fontSize: "11px",
    fontFamily: "monospace",
  },
  endBtn: {
    padding: "10px 20px",
    background: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: "14px",
  },
};

export default VideoCall;
