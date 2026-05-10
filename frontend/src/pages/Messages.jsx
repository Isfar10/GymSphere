import { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import PageShell from "../components/PageShell";
import EmptyState from "../components/EmptyState";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

function Messages() {
  const { user } = useAuth();

  const [contacts, setContacts] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const bottomRef = useRef(null);

  const currentUserId = user?.id || user?._id;

  const selectedOtherUser = useMemo(() => {
    if (!selectedConversation || !currentUserId) return null;

    return selectedConversation.participants?.find(
      (participant) =>
        String(participant._id || participant.id) !== String(currentUserId)
    );
  }, [selectedConversation, currentUserId]);

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(""), 2200);
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError("");

      const [contactsResponse, conversationsResponse] = await Promise.all([
        API.get("/messages/contacts"),
        API.get("/messages/conversations"),
      ]);

      setContacts(contactsResponse.data.contacts || []);
      setConversations(conversationsResponse.data.conversations || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load messages.");
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await API.get("/messages/conversations");
      setConversations(response.data.conversations || []);
    } catch (err) {
      console.error(err.response?.data || err.message);
    }
  };

  const fetchMessages = async (conversationId) => {
    if (!conversationId) return;

    try {
      setMessagesLoading(true);
      setError("");

      const response = await API.get(
        `/messages/conversations/${conversationId}/messages`
      );

      setMessages(response.data.messages || []);
      await fetchConversations();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load conversation.");
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!selectedConversation?._id) return;

    fetchMessages(selectedConversation._id);

    const interval = setInterval(() => {
      fetchMessages(selectedConversation._id);
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedConversation?._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openConversationFromContact = async (contactId) => {
    try {
      setError("");

      const response = await API.post("/messages/conversations", {
        receiverId: contactId,
      });

      setSelectedConversation(response.data.conversation);
      await fetchConversations();
      showSuccess("Conversation opened.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to open conversation.");
    }
  };

  const openExistingConversation = async (conversation) => {
    setSelectedConversation(conversation);
    await fetchMessages(conversation._id);
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();

    if (!selectedConversation?._id) {
      setError("Select a conversation first.");
      return;
    }

    if (!messageText.trim()) {
      setError("Message cannot be empty.");
      return;
    }

    try {
      setError("");

      const response = await API.post(
        `/messages/conversations/${selectedConversation._id}/messages`,
        {
          text: messageText.trim(),
        }
      );

      setMessages((previous) => [...previous, response.data.message]);
      setMessageText("");
      await fetchConversations();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send message.");
    }
  };

  const getOtherParticipant = (conversation) => {
    return conversation.participants?.find(
      (participant) =>
        String(participant._id || participant.id) !== String(currentUserId)
    );
  };

  const formatTime = (dateValue) => {
    if (!dateValue) return "";
    return new Date(dateValue).toLocaleString();
  };

  return (
    <>
      <Navbar />

      <PageShell
        eyebrow="In-App Messaging"
        title="Trainer & Trainee Chat"
        subtitle="Communicate directly for workout guidance, diet questions, progress support, and scheduling."
        heroIcon="💬"
        actions={
          <button type="button" onClick={fetchInitialData} className="gs-button">
            Refresh Messages
          </button>
        }
      >
        {success && <div style={styles.success}>{success}</div>}
        {error && <div style={styles.error}>{error}</div>}

        <section style={styles.layout}>
          <aside style={styles.sidebar}>
            <div style={styles.panelHeader}>
              <p style={styles.kicker}>Contacts</p>
              <h2 style={styles.panelTitle}>
                {user?.role === "trainer" ? "Trainees" : "Trainers"}
              </h2>
            </div>

            {loading ? (
              <p style={styles.muted}>Loading contacts...</p>
            ) : contacts.length === 0 ? (
              <EmptyState
                icon="👥"
                title="No contacts found"
                message="No available chat contacts for your account role."
              />
            ) : (
              <div style={styles.list}>
                {contacts.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => openConversationFromContact(contact.id)}
                    style={styles.contactButton}
                  >
                    <span style={styles.avatar}>
                      {contact.name?.[0]?.toUpperCase() || "U"}
                    </span>

                    <span style={styles.contactMeta}>
                      <strong>{contact.name}</strong>
                      <small>{contact.role}</small>
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div style={styles.divider} />

            <div style={styles.panelHeader}>
              <p style={styles.kicker}>Recent</p>
              <h2 style={styles.panelTitle}>Conversations</h2>
            </div>

            {conversations.length === 0 ? (
              <p style={styles.muted}>No conversations yet.</p>
            ) : (
              <div style={styles.list}>
                {conversations.map((conversation) => {
                  const otherUser = getOtherParticipant(conversation);
                  const isActive =
                    selectedConversation?._id === conversation._id;

                  return (
                    <button
                      key={conversation._id}
                      type="button"
                      onClick={() => openExistingConversation(conversation)}
                      style={{
                        ...styles.conversationButton,
                        ...(isActive ? styles.activeConversation : {}),
                      }}
                    >
                      <span style={styles.avatar}>
                        {otherUser?.name?.[0]?.toUpperCase() || "U"}
                      </span>

                      <span style={styles.contactMeta}>
                        <strong>{otherUser?.name || "User"}</strong>
                        <small>
                          {conversation.lastMessage || "No messages yet"}
                        </small>
                      </span>

                      {conversation.unreadCount > 0 && (
                        <span style={styles.unreadBadge}>
                          {conversation.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          <main style={styles.chatPanel}>
            {!selectedConversation ? (
              <EmptyState
                icon="💬"
                title="Select a conversation"
                message="Choose a trainer or trainee from the left to start messaging."
              />
            ) : (
              <>
                <div style={styles.chatHeader}>
                  <div>
                    <p style={styles.kicker}>Conversation with</p>
                    <h2 style={styles.chatTitle}>
                      {selectedOtherUser?.name || "User"}
                    </h2>
                    <p style={styles.muted}>{selectedOtherUser?.role}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => fetchMessages(selectedConversation._id)}
                    className="gs-button-outline"
                  >
                    Refresh Chat
                  </button>
                </div>

                <div style={styles.messagesBox}>
                  {messagesLoading ? (
                    <p style={styles.muted}>Loading messages...</p>
                  ) : messages.length === 0 ? (
                    <EmptyState
                      icon="✉️"
                      title="No messages yet"
                      message="Send the first message to begin the conversation."
                    />
                  ) : (
                    messages.map((message) => {
                      const senderId = message.sender?._id || message.sender?.id;
                      const isMine = String(senderId) === String(currentUserId);

                      return (
                        <div
                          key={message._id}
                          style={{
                            ...styles.messageRow,
                            justifyContent: isMine ? "flex-end" : "flex-start",
                          }}
                        >
                          <div
                            style={{
                              ...styles.messageBubble,
                              ...(isMine ? styles.myBubble : styles.theirBubble),
                            }}
                          >
                            <p style={styles.messageText}>{message.text}</p>
                            <small style={styles.messageTime}>
                              {formatTime(message.createdAt)}
                            </small>
                          </div>
                        </div>
                      );
                    })
                  )}

                  <div ref={bottomRef} />
                </div>

                <form onSubmit={handleSendMessage} style={styles.messageForm}>
                  <input
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    placeholder="Type your message..."
                    className="gs-input"
                    style={styles.messageInput}
                  />

                  <button type="submit" className="gs-button">
                    Send
                  </button>
                </form>
              </>
            )}
          </main>
        </section>
      </PageShell>
    </>
  );
}

const styles = {
  layout: {
    display: "grid",
    gridTemplateColumns: "360px minmax(0, 1fr)",
    gap: 20,
    marginTop: 24,
    alignItems: "start",
  },
  sidebar: {
    border: "1px solid #e2e8f0",
    borderRadius: 28,
    background: "rgba(255,255,255,0.94)",
    padding: 18,
    boxShadow: "0 22px 60px rgba(15,23,42,0.08)",
  },
  chatPanel: {
    border: "1px solid #e2e8f0",
    borderRadius: 28,
    background: "rgba(255,255,255,0.94)",
    padding: 18,
    minHeight: 650,
    boxShadow: "0 22px 60px rgba(15,23,42,0.08)",
    display: "flex",
    flexDirection: "column",
  },
  panelHeader: {
    marginBottom: 12,
  },
  kicker: {
    margin: 0,
    color: "#16a34a",
    fontWeight: 950,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontSize: 12,
  },
  panelTitle: {
    margin: "4px 0 0",
    fontSize: 22,
    letterSpacing: "-0.04em",
  },
  chatTitle: {
    margin: "4px 0 0",
    fontSize: 30,
    letterSpacing: "-0.05em",
  },
  muted: {
    margin: "6px 0 0",
    color: "#64748b",
    lineHeight: 1.6,
  },
  list: {
    display: "grid",
    gap: 10,
  },
  contactButton: {
    width: "100%",
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    borderRadius: 18,
    padding: 12,
    display: "flex",
    alignItems: "center",
    gap: 12,
    cursor: "pointer",
    textAlign: "left",
  },
  conversationButton: {
    width: "100%",
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    borderRadius: 18,
    padding: 12,
    display: "grid",
    gridTemplateColumns: "42px 1fr auto",
    alignItems: "center",
    gap: 12,
    cursor: "pointer",
    textAlign: "left",
  },
  activeConversation: {
    borderColor: "#16a34a",
    background: "#f0fdf4",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 16,
    background: "linear-gradient(135deg, #16a34a, #22c55e)",
    color: "#ffffff",
    display: "grid",
    placeItems: "center",
    fontWeight: 950,
  },
  contactMeta: {
    minWidth: 0,
    display: "grid",
    gap: 3,
  },
  unreadBadge: {
    minWidth: 26,
    height: 26,
    borderRadius: 999,
    background: "#16a34a",
    color: "#ffffff",
    display: "grid",
    placeItems: "center",
    fontSize: 12,
    fontWeight: 950,
  },
  divider: {
    height: 1,
    background: "#e2e8f0",
    margin: "18px 0",
  },
  chatHeader: {
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: 16,
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "center",
  },
  messagesBox: {
    flex: 1,
    overflowY: "auto",
    padding: "20px 4px",
    display: "grid",
    gap: 12,
    maxHeight: 470,
  },
  messageRow: {
    display: "flex",
  },
  messageBubble: {
    maxWidth: "68%",
    borderRadius: 22,
    padding: "12px 14px",
  },
  myBubble: {
    background: "#16a34a",
    color: "#ffffff",
    borderBottomRightRadius: 6,
  },
  theirBubble: {
    background: "#f1f5f9",
    color: "#0f172a",
    borderBottomLeftRadius: 6,
  },
  messageText: {
    margin: 0,
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
  },
  messageTime: {
    display: "block",
    marginTop: 6,
    opacity: 0.78,
    fontSize: 11,
  },
  messageForm: {
    borderTop: "1px solid #e2e8f0",
    paddingTop: 16,
    display: "flex",
    gap: 10,
  },
  messageInput: {
    flex: 1,
  },
  success: {
    marginTop: 16,
    padding: "12px 14px",
    borderRadius: 16,
    background: "#dcfce7",
    color: "#166534",
    fontWeight: 800,
  },
  error: {
    marginTop: 16,
    padding: "12px 14px",
    borderRadius: 16,
    background: "#fee2e2",
    color: "#991b1b",
    fontWeight: 800,
  },
};

export default Messages;