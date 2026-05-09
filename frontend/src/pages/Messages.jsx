import { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

const formatTime = (value) => {
  if (!value) return "";

  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function Messages() {
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const bottomRef = useRef(null);

  const activeOtherUser = useMemo(() => {
    if (!activeConversation) return null;
    return activeConversation.otherUser;
  }, [activeConversation]);

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(""), 2500);
  };

  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(""), 3500);
  };

  const fetchConversations = async () => {
    try {
      const response = await API.get("/messages/conversations");
      setConversations(response.data.conversations || []);
    } catch (err) {
      console.error("Failed to refresh conversations:", err);
    }
  };

  const fetchMessages = async (conversationId, showLoader = true) => {
    if (!conversationId) return;

    try {
      if (showLoader) {
        setMessagesLoading(true);
      }

      const response = await API.get(
        `/messages/conversations/${conversationId}/messages`
      );

      setMessages(response.data.messages || []);

      if (response.data.conversation) {
        setActiveConversation(response.data.conversation);
      }

      await fetchConversations();
    } catch (err) {
      showError(err.response?.data?.message || "Failed to load messages");
    } finally {
      setMessagesLoading(false);
    }
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError("");

      const [usersResponse, conversationsResponse] = await Promise.all([
        API.get("/messages/users"),
        API.get("/messages/conversations"),
      ]);

      setUsers(usersResponse.data.users || []);
      setConversations(conversationsResponse.data.conversations || []);

      const firstConversation =
        conversationsResponse.data.conversations?.[0] || null;

      if (firstConversation) {
        setActiveConversation(firstConversation);
        await fetchMessages(firstConversation.id, false);
      }
    } catch (err) {
      showError(
        err.response?.data?.message || "Failed to load messaging data"
      );
    } finally {
      setLoading(false);
    }
  };

  const startConversation = async (event) => {
    event.preventDefault();

    if (!selectedUserId) {
      showError("Please select a user to message");
      return;
    }

    try {
      const response = await API.post("/messages/conversations/start", {
        participantId: selectedUserId,
      });

      const conversation = response.data.conversation;

      setActiveConversation(conversation);
      setSelectedUserId("");

      await fetchMessages(conversation.id);
      await fetchConversations();

      showSuccess("Conversation opened");
    } catch (err) {
      showError(err.response?.data?.message || "Failed to start conversation");
    }
  };

  const openConversation = async (conversation) => {
    setActiveConversation(conversation);
    await fetchMessages(conversation.id);
  };

  const sendMessage = async (event) => {
    event.preventDefault();

    if (!activeConversation) {
      showError("Select a conversation first");
      return;
    }

    if (!messageText.trim()) {
      showError("Type a message first");
      return;
    }

    try {
      setSending(true);

      const response = await API.post(
        `/messages/conversations/${activeConversation.id}/messages`,
        {
          content: messageText,
        }
      );

      setMessages((previous) => [...previous, response.data.chatMessage]);
      setMessageText("");

      await fetchConversations();
    } catch (err) {
      showError(err.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!activeConversation?.id) return;

    const intervalId = setInterval(() => {
      fetchMessages(activeConversation.id, false);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [activeConversation?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div style={styles.page}>
      <Navbar />

      <main style={styles.container}>
        <section style={styles.hero}>
          <div>
            <p style={styles.kicker}>In-App Messaging</p>
            <h1 style={styles.title}>Messages</h1>
            <p style={styles.subtitle}>
              Chat directly with trainers, trainees, and admins inside
              GymSphere.
            </p>
          </div>

          <form onSubmit={startConversation} style={styles.startForm}>
            <select
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              style={styles.select}
            >
              <option value="">Start chat with...</option>
              {users.map((chatUser) => (
                <option key={chatUser.id} value={chatUser.id}>
                  {chatUser.name} ({chatUser.role})
                </option>
              ))}
            </select>

            <button type="submit" style={styles.primaryButton}>
              Start Chat
            </button>
          </form>
        </section>

        {error && <div style={styles.errorBox}>{error}</div>}
        {success && <div style={styles.successBox}>{success}</div>}

        {loading ? (
          <section style={styles.loadingCard}>
            <h2>Loading messages...</h2>
            <p>Please wait while we load your conversations.</p>
          </section>
        ) : (
          <section style={styles.chatGrid}>
            <aside style={styles.sidebar}>
              <div style={styles.panelHeader}>
                <h2 style={styles.panelTitle}>Conversations</h2>
                <span style={styles.countBadge}>{conversations.length}</span>
              </div>

              {conversations.length === 0 ? (
                <div style={styles.emptyBox}>
                  <p>No conversations yet.</p>
                  <small>Choose someone above to start messaging.</small>
                </div>
              ) : (
                <div style={styles.conversationList}>
                  {conversations.map((conversation) => {
                    const isActive =
                      activeConversation?.id === conversation.id;

                    return (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() => openConversation(conversation)}
                        style={{
                          ...styles.conversationButton,
                          ...(isActive ? styles.activeConversation : {}),
                        }}
                      >
                        <div style={styles.avatar}>
                          {conversation.otherUser?.name?.[0]?.toUpperCase() ||
                            "U"}
                        </div>

                        <div style={styles.conversationContent}>
                          <div style={styles.conversationTop}>
                            <strong>
                              {conversation.otherUser?.name || "Unknown User"}
                            </strong>

                            {conversation.unreadCount > 0 && (
                              <span style={styles.unreadBadge}>
                                {conversation.unreadCount}
                              </span>
                            )}
                          </div>

                          <small style={styles.roleText}>
                            {conversation.otherUser?.role || "user"}
                          </small>

                          <p style={styles.lastMessage}>
                            {conversation.lastMessage || "No messages yet"}
                          </p>

                          <small style={styles.timeText}>
                            {formatTime(conversation.lastMessageAt)}
                          </small>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </aside>

            <section style={styles.chatPanel}>
              {activeConversation ? (
                <>
                  <div style={styles.chatHeader}>
                    <div style={styles.avatarLarge}>
                      {activeOtherUser?.name?.[0]?.toUpperCase() || "U"}
                    </div>

                    <div>
                      <h2 style={styles.chatName}>
                        {activeOtherUser?.name || "Unknown User"}
                      </h2>
                      <p style={styles.chatRole}>
                        {activeOtherUser?.role || "user"} Â·{" "}
                        {activeOtherUser?.email}
                      </p>
                    </div>
                  </div>

                  <div style={styles.messagesArea}>
                    {messagesLoading ? (
                      <div style={styles.emptyBox}>
                        <p>Loading conversation...</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div style={styles.emptyBox}>
                        <p>No messages yet.</p>
                        <small>Send the first message below.</small>
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isMine = message.sender?.id === user?.id;

                        return (
                          <div
                            key={message.id}
                            style={{
                              ...styles.messageRow,
                              justifyContent: isMine
                                ? "flex-end"
                                : "flex-start",
                            }}
                          >
                            <div
                              style={{
                                ...styles.messageBubble,
                                ...(isMine
                                  ? styles.myMessage
                                  : styles.otherMessage),
                              }}
                            >
                              <p style={styles.messageText}>
                                {message.content}
                              </p>

                              <small
                                style={{
                                  ...styles.messageTime,
                                  color: isMine ? "#dcfce7" : "#64748b",
                                }}
                              >
                                {formatTime(message.createdAt)}
                              </small>
                            </div>
                          </div>
                        );
                      })
                    )}

                    <div ref={bottomRef} />
                  </div>

                  <form onSubmit={sendMessage} style={styles.messageForm}>
                    <textarea
                      value={messageText}
                      onChange={(event) => setMessageText(event.target.value)}
                      placeholder="Type your message..."
                      style={styles.textarea}
                      rows={2}
                    />

                    <button
                      type="submit"
                      disabled={sending}
                      style={{
                        ...styles.sendButton,
                        ...(sending ? styles.disabledButton : {}),
                      }}
                    >
                      {sending ? "Sending..." : "Send"}
                    </button>
                  </form>
                </>
              ) : (
                <div style={styles.noConversation}>
                  <h2>Select a conversation</h2>
                  <p>
                    Choose an existing conversation or start a new chat from the
                    dropdown above.
                  </p>
                </div>
              )}
            </section>
          </section>
        )}
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #f8fafc 0%, #ecfdf5 45%, #f0fdf4 100%)",
    color: "#0f172a",
  },
  container: {
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "28px 16px 44px",
  },
  hero: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "20px",
    alignItems: "end",
    marginBottom: "18px",
  },
  kicker: {
    margin: "0 0 8px",
    color: "#16a34a",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontSize: "12px",
  },
  title: {
    margin: 0,
    fontSize: "42px",
    letterSpacing: "-0.05em",
  },
  subtitle: {
    margin: "10px 0 0",
    color: "#64748b",
    fontWeight: 650,
    maxWidth: "650px",
    lineHeight: 1.6,
  },
  startForm: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    background: "#ffffff",
    border: "1px solid #dcfce7",
    borderRadius: "22px",
    padding: "10px",
    boxShadow: "0 16px 38px rgba(15, 23, 42, 0.08)",
  },
  select: {
    minWidth: "260px",
    border: "1px solid #dbeafe",
    borderRadius: "14px",
    padding: "12px",
    color: "#0f172a",
    fontWeight: 800,
    outline: "none",
    background: "#ffffff",
  },
  primaryButton: {
    border: "none",
    borderRadius: "14px",
    padding: "12px 16px",
    background: "#16a34a",
    color: "#ffffff",
    fontWeight: 900,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  errorBox: {
    border: "1px solid #fecaca",
    background: "#fef2f2",
    color: "#991b1b",
    padding: "12px 14px",
    borderRadius: "16px",
    fontWeight: 800,
    marginBottom: "14px",
  },
  successBox: {
    border: "1px solid #bbf7d0",
    background: "#f0fdf4",
    color: "#166534",
    padding: "12px 14px",
    borderRadius: "16px",
    fontWeight: 800,
    marginBottom: "14px",
  },
  loadingCard: {
    background: "#ffffff",
    border: "1px solid #dcfce7",
    borderRadius: "24px",
    padding: "30px",
    boxShadow: "0 20px 45px rgba(15, 23, 42, 0.08)",
  },
  chatGrid: {
    display: "grid",
    gridTemplateColumns: "360px 1fr",
    gap: "18px",
    minHeight: "680px",
  },
  sidebar: {
    background: "#ffffff",
    border: "1px solid #dcfce7",
    borderRadius: "24px",
    padding: "16px",
    boxShadow: "0 20px 45px rgba(15, 23, 42, 0.08)",
    overflow: "hidden",
  },
  panelHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "12px",
  },
  panelTitle: {
    margin: 0,
    fontSize: "20px",
    letterSpacing: "-0.03em",
  },
  countBadge: {
    background: "#dcfce7",
    color: "#166534",
    borderRadius: "999px",
    padding: "6px 10px",
    fontWeight: 900,
  },
  conversationList: {
    display: "grid",
    gap: "10px",
    maxHeight: "610px",
    overflowY: "auto",
    paddingRight: "4px",
  },
  conversationButton: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "46px 1fr",
    gap: "12px",
    textAlign: "left",
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    borderRadius: "18px",
    padding: "12px",
    cursor: "pointer",
  },
  activeConversation: {
    background: "#f0fdf4",
    borderColor: "#86efac",
  },
  avatar: {
    width: "46px",
    height: "46px",
    borderRadius: "16px",
    background: "#0f172a",
    color: "#ffffff",
    display: "grid",
    placeItems: "center",
    fontWeight: 950,
  },
  avatarLarge: {
    width: "56px",
    height: "56px",
    borderRadius: "20px",
    background: "linear-gradient(135deg, #16a34a, #22c55e)",
    color: "#ffffff",
    display: "grid",
    placeItems: "center",
    fontWeight: 950,
    fontSize: "22px",
  },
  conversationContent: {
    minWidth: 0,
  },
  conversationTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "8px",
    alignItems: "center",
  },
  unreadBadge: {
    minWidth: "24px",
    height: "24px",
    borderRadius: "999px",
    background: "#16a34a",
    color: "#ffffff",
    display: "grid",
    placeItems: "center",
    fontSize: "12px",
    fontWeight: 900,
  },
  roleText: {
    display: "block",
    color: "#16a34a",
    textTransform: "capitalize",
    fontWeight: 850,
    marginTop: "2px",
  },
  lastMessage: {
    margin: "7px 0 4px",
    color: "#475569",
    fontWeight: 650,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  timeText: {
    color: "#94a3b8",
    fontWeight: 700,
  },
  chatPanel: {
    background: "#ffffff",
    border: "1px solid #dcfce7",
    borderRadius: "24px",
    boxShadow: "0 20px 45px rgba(15, 23, 42, 0.08)",
    overflow: "hidden",
    display: "grid",
    gridTemplateRows: "auto 1fr auto",
  },
  chatHeader: {
    padding: "18px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    background: "#ffffff",
  },
  chatName: {
    margin: 0,
    fontSize: "22px",
    letterSpacing: "-0.03em",
  },
  chatRole: {
    margin: "4px 0 0",
    color: "#64748b",
    fontWeight: 750,
    textTransform: "capitalize",
  },
  messagesArea: {
    padding: "18px",
    overflowY: "auto",
    background: "#f8fafc",
  },
  messageRow: {
    display: "flex",
    marginBottom: "12px",
  },
  messageBubble: {
    maxWidth: "72%",
    borderRadius: "20px",
    padding: "12px 14px",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
  },
  myMessage: {
    background: "#16a34a",
    color: "#ffffff",
    borderBottomRightRadius: "6px",
  },
  otherMessage: {
    background: "#ffffff",
    color: "#0f172a",
    border: "1px solid #e2e8f0",
    borderBottomLeftRadius: "6px",
  },
  messageText: {
    margin: 0,
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    fontWeight: 650,
  },
  messageTime: {
    display: "block",
    marginTop: "7px",
    fontSize: "11px",
    fontWeight: 800,
  },
  messageForm: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "10px",
    padding: "16px",
    borderTop: "1px solid #e2e8f0",
    background: "#ffffff",
  },
  textarea: {
    resize: "none",
    border: "1px solid #cbd5e1",
    borderRadius: "16px",
    padding: "12px",
    outline: "none",
    fontWeight: 700,
    fontFamily: "inherit",
  },
  sendButton: {
    border: "none",
    borderRadius: "16px",
    padding: "0 22px",
    background: "#0f172a",
    color: "#ffffff",
    fontWeight: 950,
    cursor: "pointer",
  },
  disabledButton: {
    opacity: 0.65,
    cursor: "not-allowed",
  },
  emptyBox: {
    border: "1px dashed #cbd5e1",
    borderRadius: "18px",
    padding: "18px",
    color: "#64748b",
    background: "#f8fafc",
    textAlign: "center",
    fontWeight: 750,
  },
  noConversation: {
    minHeight: "520px",
    display: "grid",
    placeItems: "center",
    textAlign: "center",
    padding: "30px",
    color: "#64748b",
  },
};

export default Messages;