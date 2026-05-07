import { useEffect, useMemo, useState } from "react";

import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

const emptyProductForm = {
  name: "",
  category: "supplement",
  description: "",
  price: "",
  stock: "",
  imageUrl: "",
  isFeatured: false,
};

function Store() {
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [editingProductId, setEditingProductId] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [checkoutForm, setCheckoutForm] = useState({
    customerName: user?.name || "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const role = user?.role || "trainee";
  const isAdmin = role === "admin";
  const canBuy = ["trainee", "trainer"].includes(role);

  const visibleProducts = useMemo(() => {
    if (categoryFilter === "all") return products;
    return products.filter((product) => product.category === categoryFilter);
  }, [products, categoryFilter]);

  const cartTotal = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
      0
    );
  }, [cart]);

  const fetchStore = async () => {
    try {
      setLoading(true);
      setError("");

      const productResponse = await API.get("/store/products");
      setProducts(productResponse.data.products || []);

      if (isAdmin) {
        const orderResponse = await API.get("/store/orders");
        setOrders(orderResponse.data.orders || []);
      } else {
        const myOrderResponse = await API.get("/store/orders/me");
        setOrders(myOrderResponse.data.orders || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load store.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStore();
  }, [isAdmin]);

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

  const handleProductFormChange = (event) => {
    const { name, value, type, checked } = event.target;

    setProductForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetProductForm = () => {
    setProductForm(emptyProductForm);
    setEditingProductId(null);
  };

  const handleEditProduct = (product) => {
    setEditingProductId(product._id);

    setProductForm({
      name: product.name,
      category: product.category,
      description: product.description || "",
      price: String(product.price || ""),
      stock: String(product.stock || ""),
      imageUrl: product.imageUrl || "",
      isFeatured: Boolean(product.isFeatured),
    });
  };

  const saveProduct = async (event) => {
    event.preventDefault();

    if (!productForm.name.trim() || !productForm.price) {
      setError("Product name and price are required.");
      return;
    }

    const payload = {
      ...productForm,
      price: Number(productForm.price),
      stock: Number(productForm.stock || 0),
    };

    try {
      setActionLoading(true);
      setError("");

      if (editingProductId) {
        await API.put(`/store/products/${editingProductId}`, payload);
        showSuccess("Product updated successfully.");
      } else {
        await API.post("/store/products", payload);
        showSuccess("Product added successfully.");
      }

      resetProductForm();
      await fetchStore();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save product.");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleProduct = async (productId) => {
    try {
      setActionLoading(true);
      setError("");

      await API.patch(`/store/products/${productId}/toggle`);
      await fetchStore();

      showSuccess("Product status updated.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update product.");
    } finally {
      setActionLoading(false);
    }
  };

  const addToCart = (product) => {
    if (!canBuy) return;

    setCart((previous) => {
      const existing = previous.find((item) => item._id === product._id);

      if (existing) {
        return previous.map((item) =>
          item._id === product._id
            ? {
                ...item,
                quantity: Math.min(item.quantity + 1, product.stock),
              }
            : item
        );
      }

      return [...previous, { ...product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productId, quantity) => {
    const safeQuantity = Math.max(1, Number(quantity || 1));

    setCart((previous) =>
      previous.map((item) =>
        item._id === productId
          ? { ...item, quantity: Math.min(safeQuantity, item.stock) }
          : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCart((previous) => previous.filter((item) => item._id !== productId));
  };

  const handleCheckoutChange = (event) => {
    const { name, value } = event.target;

    setCheckoutForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const placeOrder = async (event) => {
    event.preventDefault();

    if (!cart.length) {
      setError("Please add at least one product to cart.");
      return;
    }

    if (
      !checkoutForm.customerName.trim() ||
      !checkoutForm.phone.trim() ||
      !checkoutForm.address.trim()
    ) {
      setError("Name, phone, and address are required.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await API.post("/store/orders", {
        ...checkoutForm,
        items: cart.map((item) => ({
          productId: item._id,
          quantity: item.quantity,
        })),
      });

      setCart([]);
      await fetchStore();

      showSuccess("Order placed successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to place order.");
    } finally {
      setActionLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      setActionLoading(true);
      setError("");

      await API.patch(`/store/orders/${orderId}/status`, { status });
      await fetchStore();

      showSuccess("Order status updated.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update order.");
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
            <p style={styles.eyebrow}>GymSphere Store</p>
            <h1 style={styles.title}>
              {isAdmin ? "Store Management" : "Supplements & Gym Equipment"}
            </h1>
            <p style={styles.subtitle}>
              {isAdmin
                ? "Add, update, activate, or deactivate supplements and gym equipment."
                : "Buy whey protein, creatine, gym belts, arm grips, and other fitness essentials."}
            </p>
          </div>

          <button type="button" onClick={fetchStore} style={styles.refreshButton}>
            Refresh
          </button>
        </header>

        {error && <div style={styles.errorBox}>{error}</div>}
        {success && <div style={styles.successBox}>{success}</div>}

        {loading ? (
          <div style={styles.emptyBox}>Loading store...</div>
        ) : (
          <>
            <section style={styles.statsGrid}>
              <StatBox label="Products" value={products.length} icon="🛍️" />
              <StatBox
                label="Supplements"
                value={
                  products.filter((product) => product.category === "supplement")
                    .length
                }
                icon="🥤"
              />
              <StatBox
                label="Equipment"
                value={
                  products.filter((product) => product.category === "equipment")
                    .length
                }
                icon="🏋️"
              />
              <StatBox label="Orders" value={orders.length} icon="📦" />
            </section>

            <section style={styles.filterRow}>
              <button
                type="button"
                onClick={() => setCategoryFilter("all")}
                style={{
                  ...styles.filterButton,
                  ...(categoryFilter === "all" ? styles.activeFilter : {}),
                }}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter("supplement")}
                style={{
                  ...styles.filterButton,
                  ...(categoryFilter === "supplement" ? styles.activeFilter : {}),
                }}
              >
                Supplements
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter("equipment")}
                style={{
                  ...styles.filterButton,
                  ...(categoryFilter === "equipment" ? styles.activeFilter : {}),
                }}
              >
                Equipment
              </button>
            </section>

            <section style={styles.productGrid}>
              {visibleProducts.map((product) => (
                <article key={product._id} style={styles.productCard}>
                  <div style={styles.imageWrap}>
                    <img
                      src={
                        product.imageUrl ||
                        "https://source.unsplash.com/900x650/?gym,fitness"
                      }
                      alt={product.name}
                      style={styles.productImage}
                    />

                    <span style={styles.categoryBadge}>
                      {product.category}
                    </span>

                    {isAdmin && !product.isActive && (
                      <span style={styles.inactiveBadge}>Inactive</span>
                    )}
                  </div>

                  <div style={styles.productBody}>
                    <h2 style={styles.productName}>{product.name}</h2>
                    <p style={styles.description}>{product.description}</p>

                    <div style={styles.priceRow}>
                      <strong style={styles.price}>
                        {formatCurrency(product.price)}
                      </strong>
                      <span style={styles.stock}>Stock: {product.stock}</span>
                    </div>

                    {canBuy && (
                      <button
                        type="button"
                        onClick={() => addToCart(product)}
                        disabled={product.stock <= 0}
                        style={styles.primaryButton}
                      >
                        {product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
                      </button>
                    )}

                    {isAdmin && (
                      <div style={styles.adminProductActions}>
                        <button
                          type="button"
                          onClick={() => handleEditProduct(product)}
                          style={styles.secondaryButton}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleProduct(product._id)}
                          disabled={actionLoading}
                          style={
                            product.isActive
                              ? styles.dangerButton
                              : styles.primaryButton
                          }
                        >
                          {product.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </section>

            {isAdmin && (
              <section style={styles.card}>
                <h2 style={styles.sectionTitle}>
                  {editingProductId ? "Edit Product" : "Add New Product"}
                </h2>

                <form onSubmit={saveProduct} style={styles.adminForm}>
                  <label style={styles.label}>
                    Product Name
                    <input
                      name="name"
                      value={productForm.name}
                      onChange={handleProductFormChange}
                      style={styles.input}
                      placeholder="Example: Whey Protein"
                    />
                  </label>

                  <label style={styles.label}>
                    Category
                    <select
                      name="category"
                      value={productForm.category}
                      onChange={handleProductFormChange}
                      style={styles.input}
                    >
                      <option value="supplement">Supplement</option>
                      <option value="equipment">Equipment</option>
                    </select>
                  </label>

                  <label style={styles.label}>
                    Price
                    <input
                      name="price"
                      type="number"
                      value={productForm.price}
                      onChange={handleProductFormChange}
                      style={styles.input}
                      placeholder="2500"
                    />
                  </label>

                  <label style={styles.label}>
                    Stock
                    <input
                      name="stock"
                      type="number"
                      value={productForm.stock}
                      onChange={handleProductFormChange}
                      style={styles.input}
                      placeholder="20"
                    />
                  </label>

                  <label style={styles.label}>
                    Image URL
                    <input
                      name="imageUrl"
                      value={productForm.imageUrl}
                      onChange={handleProductFormChange}
                      style={styles.input}
                      placeholder="https://source.unsplash.com/900x650/?gym"
                    />
                  </label>

                  <label style={styles.label}>
                    Description
                    <textarea
                      name="description"
                      value={productForm.description}
                      onChange={handleProductFormChange}
                      style={styles.textarea}
                      rows="4"
                    />
                  </label>

                  <label style={styles.checkboxLabel}>
                    <input
                      name="isFeatured"
                      type="checkbox"
                      checked={productForm.isFeatured}
                      onChange={handleProductFormChange}
                    />
                    Featured product
                  </label>

                  <div style={styles.formActions}>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      style={styles.primaryButton}
                    >
                      {editingProductId ? "Update Product" : "Add Product"}
                    </button>

                    {editingProductId && (
                      <button
                        type="button"
                        onClick={resetProductForm}
                        style={styles.secondaryButton}
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </form>
              </section>
            )}

            {canBuy && (
              <section style={styles.card}>
                <h2 style={styles.sectionTitle}>My Cart</h2>

                {cart.length === 0 ? (
                  <div style={styles.emptyBox}>Your cart is empty.</div>
                ) : (
                  <>
                    <div style={styles.cartList}>
                      {cart.map((item) => (
                        <div key={item._id} style={styles.cartItem}>
                          <div>
                            <strong>{item.name}</strong>
                            <p style={styles.muted}>
                              {formatCurrency(item.price)} each
                            </p>
                          </div>

                          <input
                            type="number"
                            min="1"
                            max={item.stock}
                            value={item.quantity}
                            onChange={(event) =>
                              updateCartQuantity(item._id, event.target.value)
                            }
                            style={styles.qtyInput}
                          />

                          <strong>
                            {formatCurrency(item.price * item.quantity)}
                          </strong>

                          <button
                            type="button"
                            onClick={() => removeFromCart(item._id)}
                            style={styles.dangerButton}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>

                    <div style={styles.totalRow}>
                      <span>Total</span>
                      <strong>{formatCurrency(cartTotal)}</strong>
                    </div>

                    <form onSubmit={placeOrder} style={styles.checkoutForm}>
                      <label style={styles.label}>
                        Name
                        <input
                          name="customerName"
                          value={checkoutForm.customerName}
                          onChange={handleCheckoutChange}
                          style={styles.input}
                        />
                      </label>

                      <label style={styles.label}>
                        Phone
                        <input
                          name="phone"
                          value={checkoutForm.phone}
                          onChange={handleCheckoutChange}
                          style={styles.input}
                          placeholder="01XXXXXXXXX"
                        />
                      </label>

                      <label style={styles.label}>
                        Delivery Address
                        <textarea
                          name="address"
                          value={checkoutForm.address}
                          onChange={handleCheckoutChange}
                          style={styles.textarea}
                          rows="3"
                        />
                      </label>

                      <button
                        type="submit"
                        disabled={actionLoading}
                        style={styles.primaryButton}
                      >
                        Place Order
                      </button>
                    </form>
                  </>
                )}
              </section>
            )}

            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>
                {isAdmin ? "All Store Orders" : "My Store Orders"}
              </h2>

              {orders.length === 0 ? (
                <div style={styles.emptyBox}>No store orders yet.</div>
              ) : (
                <div style={styles.orderList}>
                  {orders.map((order) => (
                    <article key={order._id} style={styles.orderCard}>
                      <div>
                        <h3 style={styles.orderTitle}>
                          Order #{order._id.slice(-6).toUpperCase()}
                        </h3>

                        <p style={styles.muted}>
                          {isAdmin && order.user
                            ? `${order.user.name} • ${order.user.email} • `
                            : ""}
                          {formatDate(order.createdAt)}
                        </p>

                        <p style={styles.muted}>
                          {order.items
                            .map((item) => `${item.name} x ${item.quantity}`)
                            .join(", ")}
                        </p>

                        <strong>{formatCurrency(order.totalAmount)}</strong>
                      </div>

                      <div style={styles.orderStatusBox}>
                        <span style={styles.statusBadge}>{order.status}</span>

                        {isAdmin && (
                          <select
                            value={order.status}
                            onChange={(event) =>
                              updateOrderStatus(order._id, event.target.value)
                            }
                            style={styles.input}
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </>
  );
}

function StatBox({ label, value, icon }) {
  return (
    <div style={styles.statBox}>
      <span style={styles.statIcon}>{icon}</span>
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
    color: "#0f172a",
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
    fontWeight: 950,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontSize: "13px",
  },
  title: {
    margin: 0,
    fontSize: "38px",
    lineHeight: 1.1,
    letterSpacing: "-0.05em",
  },
  subtitle: {
    margin: "10px 0 0",
    color: "#64748b",
    maxWidth: "760px",
    lineHeight: 1.6,
  },
  refreshButton: {
    border: "none",
    borderRadius: "999px",
    background: "#16a34a",
    color: "#ffffff",
    padding: "12px 18px",
    fontWeight: 900,
    cursor: "pointer",
  },
  errorBox: {
    background: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    borderRadius: "16px",
    padding: "13px 15px",
    marginBottom: "14px",
  },
  successBox: {
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #bbf7d0",
    borderRadius: "16px",
    padding: "13px 15px",
    marginBottom: "14px",
  },
  emptyBox: {
    border: "1px dashed #cbd5e1",
    borderRadius: "20px",
    padding: "28px 18px",
    textAlign: "center",
    color: "#64748b",
    background: "#f8fafc",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    marginBottom: "18px",
  },
  statBox: {
    border: "1px solid #e2e8f0",
    borderRadius: "24px",
    padding: "18px",
    background: "#ffffff",
    boxShadow: "0 18px 45px rgba(15,23,42,0.06)",
  },
  statIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "16px",
    display: "grid",
    placeItems: "center",
    background: "#ecfdf5",
    fontSize: "24px",
  },
  statLabel: {
    margin: "12px 0 4px",
    color: "#64748b",
    fontWeight: 900,
  },
  statValue: {
    margin: 0,
    fontSize: "28px",
  },
  filterRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "18px",
  },
  filterButton: {
    border: "1px solid #bbf7d0",
    borderRadius: "999px",
    padding: "10px 15px",
    background: "#ffffff",
    color: "#166534",
    fontWeight: 900,
    cursor: "pointer",
  },
  activeFilter: {
    background: "#dcfce7",
  },
  productGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(255px, 1fr))",
    gap: "18px",
    marginBottom: "24px",
  },
  productCard: {
    overflow: "hidden",
    border: "1px solid #e2e8f0",
    borderRadius: "26px",
    background: "#ffffff",
    boxShadow: "0 18px 45px rgba(15,23,42,0.06)",
  },
  imageWrap: {
    position: "relative",
    height: "190px",
    background: "#f1f5f9",
  },
  productImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  categoryBadge: {
    position: "absolute",
    top: "12px",
    left: "12px",
    borderRadius: "999px",
    padding: "7px 11px",
    background: "#dcfce7",
    color: "#166534",
    fontWeight: 950,
    textTransform: "capitalize",
    fontSize: "12px",
  },
  inactiveBadge: {
    position: "absolute",
    top: "12px",
    right: "12px",
    borderRadius: "999px",
    padding: "7px 11px",
    background: "#fee2e2",
    color: "#991b1b",
    fontWeight: 950,
    fontSize: "12px",
  },
  productBody: {
    padding: "18px",
    display: "grid",
    gap: "11px",
  },
  productName: {
    margin: 0,
    fontSize: "22px",
    letterSpacing: "-0.04em",
  },
  description: {
    margin: 0,
    color: "#64748b",
    lineHeight: 1.6,
  },
  priceRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
  },
  price: {
    fontSize: "22px",
  },
  stock: {
    color: "#64748b",
    fontWeight: 800,
  },
  primaryButton: {
    border: "none",
    borderRadius: "999px",
    background: "#16a34a",
    color: "#ffffff",
    padding: "11px 16px",
    fontWeight: 950,
    cursor: "pointer",
    textDecoration: "none",
  },
  secondaryButton: {
    border: "1px solid #16a34a",
    borderRadius: "999px",
    background: "#ffffff",
    color: "#16a34a",
    padding: "10px 15px",
    fontWeight: 950,
    cursor: "pointer",
  },
  dangerButton: {
    border: "1px solid #fecaca",
    borderRadius: "999px",
    background: "#ffffff",
    color: "#dc2626",
    padding: "10px 15px",
    fontWeight: 950,
    cursor: "pointer",
  },
  adminProductActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  card: {
    border: "1px solid #e2e8f0",
    borderRadius: "26px",
    padding: "20px",
    background: "#ffffff",
    boxShadow: "0 18px 45px rgba(15,23,42,0.06)",
    marginBottom: "24px",
  },
  sectionTitle: {
    margin: "0 0 16px",
    fontSize: "26px",
    letterSpacing: "-0.04em",
  },
  adminForm: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "14px",
  },
  label: {
    display: "grid",
    gap: "8px",
    fontWeight: 900,
    color: "#334155",
  },
  input: {
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    padding: "12px",
    font: "inherit",
    minHeight: "46px",
  },
  textarea: {
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    padding: "12px",
    font: "inherit",
    resize: "vertical",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: 900,
    color: "#334155",
  },
  formActions: {
    display: "flex",
    gap: "10px",
    alignItems: "end",
    flexWrap: "wrap",
  },
  cartList: {
    display: "grid",
    gap: "12px",
  },
  cartItem: {
    display: "grid",
    gridTemplateColumns: "1fr 90px auto auto",
    gap: "12px",
    alignItems: "center",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "14px",
  },
  muted: {
    margin: "4px 0 0",
    color: "#64748b",
    lineHeight: 1.5,
  },
  qtyInput: {
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    padding: "10px",
    font: "inherit",
    width: "80px",
  },
  totalRow: {
    marginTop: "16px",
    padding: "16px",
    borderRadius: "18px",
    background: "#f0fdf4",
    color: "#166534",
    display: "flex",
    justifyContent: "space-between",
    fontSize: "20px",
    fontWeight: 950,
  },
  checkoutForm: {
    marginTop: "16px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "14px",
    alignItems: "end",
  },
  orderList: {
    display: "grid",
    gap: "14px",
  },
  orderCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    padding: "16px",
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "center",
  },
  orderTitle: {
    margin: "0 0 6px",
    fontSize: "20px",
  },
  orderStatusBox: {
    display: "grid",
    gap: "10px",
    minWidth: "180px",
  },
  statusBadge: {
    justifySelf: "start",
    borderRadius: "999px",
    padding: "8px 12px",
    background: "#dcfce7",
    color: "#166534",
    fontWeight: 950,
    textTransform: "capitalize",
  },
};

export default Store;