const express = require("express");

const protect = require("../middlewares/authMiddleware");
const User = require("../models/User");
const StoreProduct = require("../models/StoreProduct");
const StoreOrder = require("../models/StoreOrder");

const router = express.Router();

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
    name: "BCAA Recovery",
    category: "supplement",
    description: "Amino acid recovery support for intense workout sessions.",
    price: 2200,
    stock: 18,
    imageUrl: "https://source.unsplash.com/900x650/?fitness,supplement",
    isFeatured: false,
  },
  {
    name: "Pre Workout",
    category: "supplement",
    description: "Energy booster for focused and powerful training.",
    price: 2500,
    stock: 20,
    imageUrl: "https://source.unsplash.com/900x650/?preworkout,gym",
    isFeatured: false,
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
  {
    name: "Skipping Rope",
    category: "equipment",
    description: "Lightweight cardio rope for warmups and conditioning.",
    price: 550,
    stock: 40,
    imageUrl: "https://source.unsplash.com/900x650/?jump,rope,fitness",
    isFeatured: false,
  },
  {
    name: "Resistance Band",
    category: "equipment",
    description: "Portable resistance band for stretching and strength work.",
    price: 700,
    stock: 35,
    imageUrl: "https://source.unsplash.com/900x650/?resistance,band,fitness",
    isFeatured: false,
  },
];

const getCurrentUser = async (req) => {
  return User.findById(req.user.userId).select("-password");
};

const requireAdmin = async (req, res, next) => {
  const user = await getCurrentUser(req);

  if (!user || user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }

  req.currentUser = user;
  next();
};

const requireBuyer = async (req, res, next) => {
  const user = await getCurrentUser(req);

  if (!user || !["trainee", "trainer"].includes(user.role)) {
    return res.status(403).json({
      success: false,
      message: "Only trainees and trainers can buy store products",
    });
  }

  req.currentUser = user;
  next();
};

const seedDefaultProductsIfEmpty = async () => {
  const count = await StoreProduct.countDocuments();

  if (count === 0) {
    await StoreProduct.insertMany(defaultProducts);
  }
};

router.get("/products", protect, async (req, res) => {
  try {
    await seedDefaultProductsIfEmpty();

    const user = await getCurrentUser(req);
    const query = user?.role === "admin" ? {} : { isActive: true };

    const products = await StoreProduct.find(query).sort({
      isFeatured: -1,
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.post("/products", protect, requireAdmin, async (req, res) => {
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

    return res.status(201).json({
      success: true,
      message: "Product added successfully",
      product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.put("/products/:id", protect, requireAdmin, async (req, res) => {
  try {
    const product = await StoreProduct.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.patch("/products/:id/toggle", protect, requireAdmin, async (req, res) => {
  try {
    const product = await StoreProduct.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    product.isActive = !product.isActive;
    await product.save();

    return res.status(200).json({
      success: true,
      message: product.isActive
        ? "Product activated successfully"
        : "Product deactivated successfully",
      product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.post("/orders", protect, requireBuyer, async (req, res) => {
  try {
    const { items, customerName, phone, address } = req.body;

    if (!items || !items.length || !customerName || !phone || !address) {
      return res.status(400).json({
        success: false,
        message: "Cart items, name, phone, and address are required",
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
    });

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/orders/me", protect, async (req, res) => {
  try {
    const orders = await StoreOrder.find({ user: req.user.userId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/orders", protect, requireAdmin, async (req, res) => {
  try {
    const orders = await StoreOrder.find()
      .populate("user", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.patch("/orders/:id/status", protect, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    const order = await StoreOrder.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order status updated",
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;