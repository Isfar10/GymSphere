import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

const defaultForm = {
  content: "",
  category: "general",
  imageUrl: "",
};

function SocialFeed() {
  const { user } = useAuth();

  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [commentInputs, setCommentInputs] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const categories = [
    { value: "all", label: "All" },
    { value: "achievement", label: "Achievement" },
    { value: "progress", label: "Progress" },
    { value: "workout", label: "Workout" },
    { value: "nutrition", label: "Nutrition" },
    { value: "motivation", label: "Motivation" },
    { value: "general", label: "General" },
  ];

  const postCategories = categories.filter((category) => category.value !== "all");

  const filteredPosts = useMemo(() => {
    if (selectedCategory === "all") {
      return posts;
    }

    return posts.filter((post) => post.category === selectedCategory);
  }, [posts, selectedCategory]);

  const totalLikes = useMemo(() => {
    return posts.reduce((sum, post) => sum + Number(post.likeCount || 0), 0);
  }, [posts]);

  const totalComments = useMemo(() => {
    return posts.reduce((sum, post) => sum + Number(post.commentCount || 0), 0);
  }, [posts]);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/social-feed");
      setPosts(response.data.posts || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load social feed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(""), 2500);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCreatePost = async (event) => {
    event.preventDefault();

    if (!form.content.trim()) {
      setError("Write something before posting.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await API.post("/social-feed", {
        content: form.content,
        category: form.category,
        imageUrl: form.imageUrl,
      });

      setForm(defaultForm);
      await fetchFeed();
      showSuccess("Post created successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create post.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleLike = async (postId) => {
    try {
      setActionLoading(true);
      setError("");

      await API.patch(`/social-feed/${postId}/like`);
      await fetchFeed();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update like.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCommentChange = (postId, value) => {
    setCommentInputs((previous) => ({
      ...previous,
      [postId]: value,
    }));
  };

  const handleAddComment = async (postId) => {
    const content = commentInputs[postId];

    if (!content || !content.trim()) {
      setError("Write a comment first.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await API.post(`/social-feed/${postId}/comments`, {
        content,
      });

      setCommentInputs((previous) => ({
        ...previous,
        [postId]: "",
      }));

      await fetchFeed();
      showSuccess("Comment added.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add comment.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      setActionLoading(true);
      setError("");

      await API.delete(`/social-feed/${postId}`);
      await fetchFeed();
      showSuccess("Post deleted.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete post.");
    } finally {
      setActionLoading(false);
    }
  };

  const hasUserLiked = (post) => {
    return post.likes?.some((like) => String(like.id) === String(user?.id || user?._id));
  };

  const canDeletePost = (post) => {
    return (
      String(post.author?.id) === String(user?.id || user?._id) ||
      user?.role === "admin"
    );
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "Unknown time";

    return new Date(dateValue).toLocaleString();
  };

  const getCategoryLabel = (value) => {
    return categories.find((category) => category.value === value)?.label || "General";
  };

  return (
    <>
      <Navbar />

      <main style={styles.page}>
        <section style={styles.hero}>
          <div>
            <p style={styles.eyebrow}>Community</p>
            <h1 style={styles.title}>Social Fitness Feed</h1>
            <p style={styles.subtitle}>
              Share achievements, progress updates, workouts, nutrition ideas, and motivation
              with the GymSphere community.
            </p>
          </div>
        </section>

        <section style={styles.statsGrid}>
          <div style={styles.statCard}>
            <p style={styles.statLabel}>Posts</p>
            <h2 style={styles.statNumber}>{posts.length}</h2>
          </div>

          <div style={styles.statCard}>
            <p style={styles.statLabel}>Likes</p>
            <h2 style={styles.statNumber}>{totalLikes}</h2>
          </div>

          <div style={styles.statCard}>
            <p style={styles.statLabel}>Comments</p>
            <h2 style={styles.statNumber}>{totalComments}</h2>
          </div>
        </section>

        <section style={styles.createCard}>
          <h2 style={styles.sectionTitle}>Create a Post</h2>

          <form onSubmit={handleCreatePost} style={styles.form}>
            <label style={styles.label}>
              What do you want to share?
              <textarea
                name="content"
                value={form.content}
                onChange={handleFormChange}
                placeholder="Example: Completed my first 5km run today!"
                rows="5"
                style={styles.textarea}
              />
            </label>

            <div style={styles.formRow}>
              <label style={styles.label}>
                Category
                <select
                  name="category"
                  value={form.category}
                  onChange={handleFormChange}
                  style={styles.input}
                >
                  {postCategories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>

              <label style={styles.label}>
                Image URL
                <input
                  name="imageUrl"
                  value={form.imageUrl}
                  onChange={handleFormChange}
                  placeholder="Optional image URL"
                  style={styles.input}
                />
              </label>
            </div>

            <button type="submit" style={styles.primaryButton} disabled={actionLoading}>
              {actionLoading ? "Posting..." : "Post to Feed"}
            </button>
          </form>
        </section>

        {error && <div style={styles.errorBox}>{error}</div>}
        {success && <div style={styles.successBox}>{success}</div>}

        <section style={styles.feedHeader}>
          <h2 style={styles.sectionTitle}>Community Posts</h2>

          <div style={styles.filters}>
            {categories.map((category) => (
              <button
                key={category.value}
                type="button"
                onClick={() => setSelectedCategory(category.value)}
                style={{
                  ...styles.filterButton,
                  ...(selectedCategory === category.value ? styles.activeFilterButton : {}),
                }}
              >
                {category.label}
              </button>
            ))}
          </div>
        </section>

        {loading ? (
          <div style={styles.emptyBox}>Loading feed...</div>
        ) : filteredPosts.length === 0 ? (
          <div style={styles.emptyBox}>
            <h3 style={styles.emptyTitle}>No posts yet</h3>
            <p style={styles.emptyText}>
              Be the first to share a fitness update with the community.
            </p>
          </div>
        ) : (
          <section style={styles.postList}>
            {filteredPosts.map((post) => (
              <article key={post.id} style={styles.postCard}>
                <div style={styles.postTop}>
                  <div>
                    <h3 style={styles.authorName}>
                      {post.author?.name || "Unknown User"}
                    </h3>
                    <p style={styles.metaText}>
                      {post.author?.role || "member"} • {formatDate(post.createdAt)}
                    </p>
                  </div>

                  <span style={styles.categoryBadge}>
                    {getCategoryLabel(post.category)}
                  </span>
                </div>

                <p style={styles.postContent}>{post.content}</p>

                {post.imageUrl && (
                  <img src={post.imageUrl} alt="Social feed post" style={styles.postImage} />
                )}

                <div style={styles.actionRow}>
                  <button
                    type="button"
                    onClick={() => handleToggleLike(post.id)}
                    disabled={actionLoading}
                    style={{
                      ...styles.likeButton,
                      ...(hasUserLiked(post) ? styles.likedButton : {}),
                    }}
                  >
                    {hasUserLiked(post) ? "Liked" : "Like"} ({post.likeCount})
                  </button>

                  <span style={styles.commentCount}>
                    Comments ({post.commentCount})
                  </span>

                  {canDeletePost(post) && (
                    <button
                      type="button"
                      onClick={() => handleDeletePost(post.id)}
                      disabled={actionLoading}
                      style={styles.deleteButton}
                    >
                      Delete
                    </button>
                  )}
                </div>

                <div style={styles.commentsArea}>
                  {post.comments.length > 0 && (
                    <div style={styles.commentList}>
                      {post.comments.map((comment) => (
                        <div key={comment.id} style={styles.commentCard}>
                          <strong>{comment.author?.name || "Unknown User"}</strong>
                          <p style={styles.commentText}>{comment.content}</p>
                          <span style={styles.commentDate}>
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={styles.commentForm}>
                    <input
                      value={commentInputs[post.id] || ""}
                      onChange={(event) =>
                        handleCommentChange(post.id, event.target.value)
                      }
                      placeholder="Write a comment..."
                      style={styles.commentInput}
                    />

                    <button
                      type="button"
                      onClick={() => handleAddComment(post.id)}
                      disabled={actionLoading}
                      style={styles.commentButton}
                    >
                      Comment
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </>
  );
}

const styles = {
  page: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "32px 20px",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    color: "#111827",
  },
  hero: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "24px",
  },
  eyebrow: {
    margin: "0 0 8px",
    color: "#16a34a",
    fontWeight: 800,
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
    maxWidth: "720px",
    lineHeight: 1.6,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginBottom: "22px",
  },
  statCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "18px",
    background: "#ffffff",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
  },
  statLabel: {
    margin: 0,
    color: "#6b7280",
    fontSize: "14px",
  },
  statNumber: {
    margin: "8px 0 0",
    fontSize: "28px",
  },
  createCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "20px",
    background: "#ffffff",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
    marginBottom: "18px",
  },
  sectionTitle: {
    margin: "0 0 14px",
    fontSize: "24px",
  },
  form: {
    display: "grid",
    gap: "14px",
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
  },
  label: {
    display: "grid",
    gap: "8px",
    color: "#374151",
    fontWeight: 700,
  },
  textarea: {
    border: "1px solid #d1d5db",
    borderRadius: "14px",
    padding: "12px",
    font: "inherit",
    resize: "vertical",
  },
  input: {
    border: "1px solid #d1d5db",
    borderRadius: "14px",
    padding: "12px",
    font: "inherit",
  },
  primaryButton: {
    border: "none",
    borderRadius: "999px",
    background: "#16a34a",
    color: "#ffffff",
    padding: "12px 18px",
    fontWeight: 800,
    cursor: "pointer",
    justifySelf: "start",
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
  feedHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
    flexWrap: "wrap",
    marginTop: "26px",
    marginBottom: "16px",
  },
  filters: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  filterButton: {
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#111827",
    borderRadius: "999px",
    padding: "9px 14px",
    cursor: "pointer",
    fontWeight: 700,
  },
  activeFilterButton: {
    borderColor: "#16a34a",
    background: "#dcfce7",
    color: "#166534",
  },
  emptyBox: {
    border: "1px dashed #d1d5db",
    borderRadius: "18px",
    padding: "36px 20px",
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
  postList: {
    display: "grid",
    gap: "16px",
  },
  postCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "20px",
    background: "#ffffff",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
  },
  postTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
    marginBottom: "14px",
  },
  authorName: {
    margin: 0,
    fontSize: "20px",
  },
  metaText: {
    margin: "5px 0 0",
    color: "#6b7280",
    fontSize: "13px",
    textTransform: "capitalize",
  },
  categoryBadge: {
    borderRadius: "999px",
    background: "#ecfdf5",
    color: "#166534",
    padding: "7px 12px",
    fontSize: "13px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  postContent: {
    margin: "0 0 14px",
    lineHeight: 1.7,
    color: "#374151",
    whiteSpace: "pre-wrap",
  },
  postImage: {
    width: "100%",
    maxHeight: "420px",
    objectFit: "cover",
    borderRadius: "16px",
    marginBottom: "14px",
    border: "1px solid #e5e7eb",
  },
  actionRow: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
    borderTop: "1px solid #f3f4f6",
    paddingTop: "14px",
    marginTop: "14px",
  },
  likeButton: {
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#111827",
    borderRadius: "999px",
    padding: "9px 14px",
    fontWeight: 800,
    cursor: "pointer",
  },
  likedButton: {
    borderColor: "#16a34a",
    background: "#16a34a",
    color: "#ffffff",
  },
  commentCount: {
    color: "#6b7280",
    fontWeight: 700,
  },
  deleteButton: {
    border: "1px solid #fecaca",
    background: "#ffffff",
    color: "#dc2626",
    borderRadius: "999px",
    padding: "9px 14px",
    fontWeight: 800,
    cursor: "pointer",
    marginLeft: "auto",
  },
  commentsArea: {
    marginTop: "16px",
  },
  commentList: {
    display: "grid",
    gap: "10px",
    marginBottom: "12px",
  },
  commentCard: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "12px",
  },
  commentText: {
    margin: "5px 0",
    color: "#374151",
  },
  commentDate: {
    color: "#6b7280",
    fontSize: "12px",
  },
  commentForm: {
    display: "flex",
    gap: "10px",
  },
  commentInput: {
    flex: 1,
    border: "1px solid #d1d5db",
    borderRadius: "999px",
    padding: "11px 14px",
    font: "inherit",
  },
  commentButton: {
    border: "none",
    borderRadius: "999px",
    background: "#111827",
    color: "#ffffff",
    padding: "11px 16px",
    fontWeight: 800,
    cursor: "pointer",
  },
};

export default SocialFeed;