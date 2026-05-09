const User = require("../models/User");
const StoreProduct = require("../models/StoreProduct");
const StoreOrder = require("../models/StoreOrder");

const defaultProducts = [
  {
    name: "Whey Protein",
    category: "supplement",
    description: "High quality whey protein for muscle recovery and growth.",
    price: 4200,
    stock: 25,
    imageUrl: "https://source.unsplash.com/900x650/?whey,protein,supplement",
    isFeatured: true,
  },
  {
    name: "Creatine Monohydrate",
    category: "supplement",
    description: "Daily strength and performance support supplement.",
    price: 1800,
    stock: 30,
    imageUrl: "https://source.unsplash.com/900x650/?creatine,supplement",
    isFeatured: true,
  },
  {
    name: "Arm Grip",
    category: "equipment",
    description: "Compact hand grip trainer for forearm and grip strength.",
    price: 450,
    stock: 50,
    imageUrl: "https://source.unsplash.com/900x650/?hand,grip,gym",
    isFeatured: true,
  },
  {
    name: "Weight Lifting Belt",
    category: "equipment",
    description: "Supportive gym belt for heavy lifting and back protection.",
    price: 1600,
    stock: 15,
    imageUrl: "https://source.unsplash.com/900x650/?weightlifting,belt",
    isFeatured: true,
  },
];

const getCurrentUser = async (req) => {
  return User.findById(req.user.userId).select("-password");
};

const seedDefaultProductsIfEmpty = async () => {
  const count = await StoreProduct.countDocuments();
  if (count === 0) await StoreProduct.insertMany(defaultProducts);
};

exports.getProducts = async (req, res) => {
  try {
    await seedDefaultProductsIfEmpty();

    const user = await getCurrentUser(req);
    const query = user?.role === "admin" ? {} : { isActive: true };

    const products = await StoreProduct.find(query).sort({
      isFeatured: -1,
      createdAt: -1,
    });

    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, category, description, price, stock, imageUrl, isFeatured } =
      req.body;

    if (!name || !category || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Name, category, and price are required",
      });
    }

    const product = await StoreProduct.create({
      name,
      category,
      description,
      price,
      stock,
      imageUrl,
      isFeatured,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await StoreProduct.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleProduct = async (req, res) => {
  try {
    const product = await StoreProduct.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    product.isActive = !product.isActive;
    await product.save();

    res.status(200).json({
      success: true,
      message: product.isActive
        ? "Product activated successfully"
        : "Product deactivated successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.placeOrder = async (req, res) => {
  try {
    const { items, customerName, phone, address, bkashNumber, transactionId } =
      req.body;

    if (
      !items ||
      !items.length ||
      !customerName ||
      !phone ||
      !address ||
      !bkashNumber ||
      !transactionId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Cart items, name, phone, address, bKash number, and transaction ID are required",
      });
    }

    const cleanTransactionId = String(transactionId).trim().toUpperCase();

    const existingTransaction = await StoreOrder.findOne({
      transactionId: cleanTransactionId,
    });

    if (existingTransaction) {
      return res.status(400).json({
        success: false,
        message: "This transaction ID has already been used",
      });
    }

    const orderItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = await StoreProduct.findById(item.productId);

      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: "One or more products are unavailable",
        });
      }

      const quantity = Number(item.quantity || 1);

      if (quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be at least 1",
        });
      }

      if (quantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `${product.name} has only ${product.stock} item(s) in stock`,
        });
      }

      const subtotal = product.price * quantity;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity,
        subtotal,
      });

      totalAmount += subtotal;
      product.stock -= quantity;
      await product.save();
    }

    const order = await StoreOrder.create({
      user: req.currentUser._id,
      items: orderItems,
      totalAmount,
      customerName,
      phone,
      address,
      bkashNumber,
      transactionId: cleanTransactionId,
      paymentMethod: "manual_bkash",
      paymentStatus: "pending",
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully. Payment is pending admin verification.",
      order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await StoreOrder.find({ user: req.user.userId }).sort({
      createdAt: -1,
    });

    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await StoreOrder.find()
      .populate("user", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, adminPaymentNote } = req.body;

    if (!["approved", "rejected"].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Payment status must be approved or rejected",
      });
    }

    const order = await StoreOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order.paymentStatus = paymentStatus;
    order.adminPaymentNote = adminPaymentNote || "";

    if (paymentStatus === "approved") {
      order.paymentVerifiedAt = new Date();
      order.status = "confirmed";
    }

    if (paymentStatus === "rejected") {
      order.paymentVerifiedAt = null;
      order.status = "cancelled";
    }

    await order.save();

    res.status(200).json({
      success: true,
      message:
        paymentStatus === "approved"
          ? "Payment approved and order confirmed"
          : "Payment rejected and order cancelled",
      order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["pending", "confirmed", "delivered", "cancelled"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid order status" });
    }

    const order = await StoreOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (["confirmed", "delivered"].includes(status)) {
      if (order.paymentStatus !== "approved") {
        return res.status(400).json({
          success: false,
          message: "Approve payment before confirming or delivering this order",
        });
      }
    }

    order.status = status;
    await order.save();

    res.status(200).json({
      success: true,
      message: "Order status updated",
      order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};