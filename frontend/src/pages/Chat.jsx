import { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import PageShell from "../components/PageShell";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

function Chat() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activePartner, setActivePartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState("conversations"); // "conversations" | "contacts"
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  const fetchConversations = async () => {
    try {
      const { data } = await API.get("/chat/conversations");
      if (data.success) setConversations(data.conversations);
    } catch {
      /* silent */
    }
  };

  const fetchContacts = async () => {
    try {
      const { data } = await API.get("/chat/contacts");
      if (data.success) setContacts(data.contacts);
    } catch {
      /* silent */
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchConversations(), fetchContacts()]);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (activePartner) {
      loadMessages(activePartner._id);
      pollRef.current = setInterval(() => loadMessages(activePartner._id), 5000);
    }
    return () => clearInterval(pollRef.current);
  }, [activePartner]);

  const loadMessages = async (partnerId) => {
    try {
      const { data } = await API.get(`/chat/messages/${partnerId}`);
      if (data.success) {
        setMessages(data.messages);
        setActivePartner((prev) =>
          prev?._id === partnerId
            ? { ...prev, name: data.partner.name, role: data.partner.role }
            : prev
        );
        fetchConversations();
      }
    } catch {
      /* silent */
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openConversation = (partnerId, partnerName, partnerRole) => {
    setActivePartner({ _id: partnerId, name: partnerName, role: partnerRole });
    setMessages([]);
    setError("");
  };

  const handleSend = async () => {
    if (!draft.trim() || !activePartner) return;
    setSending(true);
    setError("");
    try {
      const { data } = await API.post("/chat/send", {
        receiverId: activePartner._id,
        message: draft.trim(),
      });
      if (data.success) {
        setMessages((prev) => [...prev, data.message]);
        setDraft("");
        fetchConversations();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <>
      <Navbar />
      <PageShell
        eyebrow="Communication"
        title="Messages"
        subtitle="Chat directly with your trainers or trainees."
        heroIcon="💬"
      >
        <div style={styles.layout}>
          {/* Sidebar */}
          <aside style={styles.sidebar}>
            <div style={styles.tabRow}>
              <button
                style={{ ...styles.tab, ...(tab === "conversations" ? styles.tabActive : {}) }}
                onClick={() => setTab("conversations")}
              >
                Chats
              </button>
              <button
                style={{ ...styles.tab, ...(tab === "contacts" ? styles.tabActive : {}) }}
                onClick={() => setTab("contacts")}
              >
                Contacts
              </button>
            </div>

            {loading ? (
              <p style={styles.sidebarHint}>Loading…</p>
            ) : tab === "conversations" ? (
              conversations.length === 0 ? (
                <p style={styles.sidebarHint}>No conversations yet. Start from Contacts.</p>
              ) : (
                conversations.map((c) => (
                  <button
                    key={c.partnerId}
                    style={{
                      ...styles.convoItem,
                      ...(activePartner?._id === c.partnerId ? styles.convoItemActive : {}),
                    }}
                    onClick={() => openConversation(c.partnerId, c.partnerName, c.partnerRole)}
                  >
                    <div style={styles.convoAvatar}>
                      {c.partnerName?.[0]?.toUpperCase()}
                    </div>
                    <div style={styles.convoMeta}>
                      <div style={styles.convoName}>
                        {c.partnerName}
                        {c.unreadCount > 0 && (
                          <span style={styles.unreadBadge}>{c.unreadCount}</span>
                        )}
                      </div>
                      <div style={styles.convoLast}>{c.lastMessage}</div>
                    </div>
                    <div style={styles.convoTime}>{formatDate(c.lastMessageTime)}</div>
                  </button>
                ))
              )
            ) : contacts.length === 0 ? (
              <p style={styles.sidebarHint}>No contacts available.</p>
            ) : (
              contacts.map((c) => (
                <button
                  key={c._id}
                  style={{
                    ...styles.convoItem,
                    ...(activePartner?._id === c._id ? styles.convoItemActive : {}),
                  }}
                  onClick={() => openConversation(c._id, c.name, c.role)}
                >
                  <div style={styles.convoAvatar}>{c.name?.[0]?.toUpperCase()}</div>
                  <div style={styles.convoMeta}>
                    <div style={styles.convoName}>{c.name}</div>
                    <div style={styles.convoLast}>{c.role}</div>
                  </div>
                </button>
              ))
            )}
          </aside>

          {/* Chat Window */}
          <section style={styles.chatPane}>
            {!activePartner ? (
              <div style={styles.placeholder}>
                <span style={styles.placeholderIcon}>💬</span>
                <p>Select a conversation or contact to start chatting</p>
              </div>
            ) : (
              <>
                <header style={styles.chatHeader}>
                  <div style={styles.chatHeaderAvatar}>
                    {activePartner.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div style={styles.chatHeaderName}>{activePartner.name}</div>
                    <div style={styles.chatHeaderRole}>{activePartner.role}</div>
                  </div>
                </header>

                <div style={styles.messageList}>
                  {messages.length === 0 && (
                    <p style={styles.noMessages}>No messages yet. Say hello! 👋</p>
                  )}
                  {messages.map((msg) => {
                    const isMine = msg.sender._id === user?._id || msg.sender._id === user?.id;
                    return (
                      <div
                        key={msg._id}
                        style={{
                          ...styles.msgRow,
                          justifyContent: isMine ? "flex-end" : "flex-start",
                        }}
                      >
                        <div
                          style={{
                            ...styles.bubble,
                            ...(isMine ? styles.bubbleMine : styles.bubbleTheirs),
                          }}
                        >
                          <div style={styles.bubbleText}>{msg.message}</div>
                          <div style={styles.bubbleTime}>{formatTime(msg.createdAt)}</div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {error && <p style={styles.error}>{error}</p>}

                <div style={styles.inputRow}>
                  <textarea
                    style={styles.textarea}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message… (Enter to send)"
                    rows={2}
                  />
                  <button
                    style={{ ...styles.sendBtn, opacity: sending ? 0.6 : 1 }}
                    onClick={handleSend}
                    disabled={sending || !draft.trim()}
                  >
                    {sending ? "…" : "Send"}
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </PageShell>
    </>
  );
}

const styles = {
  layout: {
    display: "grid",
    gridTemplateColumns: "300px 1fr",
    gap: "0",
    background: "#ffffff",
    borderRadius: "18px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
    overflow: "hidden",
    minHeight: "600px",
    margin: "24px 0",
  },
  sidebar: {
    borderRight: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    background: "#f8fafc",
  },
  tabRow: {
    display: "flex",
    borderBottom: "1px solid #e2e8f0",
  },
  tab: {
    flex: 1,
    padding: "14px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "14px",
    color: "#64748b",
    transition: "0.2s",
  },
  tabActive: {
    color: "#16a34a",
    borderBottom: "2px solid #16a34a",
    background: "#f0fdf4",
  },
  sidebarHint: {
    padding: "20px 16px",
    color: "#94a3b8",
    fontSize: "13px",
    textAlign: "center",
  },
  convoItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    width: "100%",
    padding: "12px 16px",
    background: "none",
    border: "none",
    borderBottom: "1px solid #f1f5f9",
    cursor: "pointer",
    textAlign: "left",
    transition: "background 0.15s",
  },
  convoItemActive: {
    background: "#dcfce7",
  },
  convoAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "999px",
    background: "linear-gradient(135deg, #16a34a, #22c55e)",
    color: "#fff",
    display: "grid",
    placeItems: "center",
    fontWeight: 900,
    fontSize: "16px",
    flexShrink: 0,
  },
  convoMeta: {
    flex: 1,
    minWidth: 0,
  },
  convoName: {
    fontWeight: 700,
    fontSize: "14px",
    color: "#0f172a",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  unreadBadge: {
    background: "#16a34a",
    color: "#fff",
    borderRadius: "999px",
    padding: "0 6px",
    fontSize: "11px",
    fontWeight: 900,
  },
  convoLast: {
    color: "#64748b",
    fontSize: "12px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  convoTime: {
    fontSize: "11px",
    color: "#94a3b8",
    flexShrink: 0,
  },
  chatPane: {
    display: "flex",
    flexDirection: "column",
  },
  placeholder: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#94a3b8",
    gap: "12px",
    padding: "40px",
  },
  placeholderIcon: {
    fontSize: "56px",
  },
  chatHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "16px 20px",
    borderBottom: "1px solid #e2e8f0",
    background: "#f8fafc",
  },
  chatHeaderAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "999px",
    background: "#0f172a",
    color: "#fff",
    display: "grid",
    placeItems: "center",
    fontWeight: 900,
    fontSize: "16px",
  },
  chatHeaderName: {
    fontWeight: 800,
    fontSize: "15px",
    color: "#0f172a",
  },
  chatHeaderRole: {
    fontSize: "12px",
    color: "#64748b",
    textTransform: "capitalize",
  },
  messageList: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    minHeight: "400px",
    maxHeight: "500px",
  },
  noMessages: {
    color: "#94a3b8",
    textAlign: "center",
    marginTop: "60px",
    fontSize: "14px",
  },
  msgRow: {
    display: "flex",
  },
  bubble: {
    maxWidth: "65%",
    padding: "10px 14px",
    borderRadius: "16px",
    fontSize: "14px",
    lineHeight: 1.5,
  },
  bubbleMine: {
    background: "linear-gradient(135deg, #16a34a, #22c55e)",
    color: "#fff",
    borderBottomRightRadius: "4px",
  },
  bubbleTheirs: {
    background: "#f1f5f9",
    color: "#0f172a",
    borderBottomLeftRadius: "4px",
  },
  bubbleText: {
    wordBreak: "break-word",
  },
  bubbleTime: {
    fontSize: "10px",
    marginTop: "4px",
    opacity: 0.7,
    textAlign: "right",
  },
  error: {
    color: "#dc2626",
    fontSize: "13px",
    padding: "0 20px",
  },
  inputRow: {
    display: "flex",
    gap: "10px",
    padding: "14px 20px",
    borderTop: "1px solid #e2e8f0",
    background: "#f8fafc",
    alignItems: "flex-end",
  },
  textarea: {
    flex: 1,
    padding: "10px 14px",
    borderRadius: "12px",
    border: "1px solid #d4dbe6",
    fontSize: "14px",
    resize: "none",
    outline: "none",
    fontFamily: "inherit",
    lineHeight: 1.5,
  },
  sendBtn: {
    padding: "10px 20px",
    background: "linear-gradient(135deg, #16a34a, #22c55e)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: "14px",
    flexShrink: 0,
  },
};

export default Chat;
