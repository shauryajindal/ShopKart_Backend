import crypto from "crypto";
import mongoose from "mongoose";

import { Customer } from "../models/customer.model.js";
import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import razorpay from "../config/razorpay.js";

const validateShippingAddress = (shippingAddress) => {
  if (!shippingAddress || typeof shippingAddress !== "object") {
    return "Shipping address is required";
  }

  const requiredFields = [
    "fullName",
    "phone",
    "addressLine1",
    "city",
    "state",
    "pincode"
  ];

  for (const field of requiredFields) {
    if (
      typeof shippingAddress[field] !== "string" ||
      !shippingAddress[field].trim()
    ) {
      return `${field} is required`;
    }
  }

  if (!/^\d{10}$/.test(shippingAddress.phone.trim())) {
    return "Phone must contain 10 digits";
  }

  if (!/^\d{6}$/.test(shippingAddress.pincode.trim())) {
    return "Pincode must contain 6 digits";
  }

  return null;
};

const buildOrderFromCart = async (customer) => {
  if (!customer.cart.length) {
    return {
      error: {
        status: 400,
        message: "Cart is empty"
      }
    };
  }

  const orderItems = [];
  let totalAmount = 0;

  for (const cartItem of customer.cart) {
    const product = await Product.findById(cartItem.product);

    if (!product) {
      return {
        error: {
          status: 400,
          message: "A product in your cart is no longer available"
        }
      };
    }

    if (cartItem.quantity > product.stock) {
      return {
        error: {
          status: 400,
          message: `Insufficient stock for ${product.name}. Only ${product.stock} unit(s) available.`
        }
      };
    }

    orderItems.push({
      product: product._id,
      name: product.name,
      price: product.price,
      quantity: cartItem.quantity,
      image: product.image
    });

    totalAmount += product.price * cartItem.quantity;
  }

  return {
    orderItems,
    totalAmount
  };
};

// POST /orders/create-payment-order
export const createPaymentOrder = async (req, res) => {
  try {
    const { shippingAddress } = req.body;

    const shippingError = validateShippingAddress(shippingAddress);
    if (shippingError) {
      return res.status(400).json({
        success: false,
        message: shippingError
      });
    }

    const customer = await Customer.findById(req.user);
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Customer not found"
      });
    }

    const cartResult = await buildOrderFromCart(customer);
    if (cartResult.error) {
      return res.status(cartResult.error.status).json({
        success: false,
        message: cartResult.error.message
      });
    }

    const { orderItems, totalAmount } = cartResult;

    // Never use a total sent by React. This is calculated from
    // the latest Product documents loaded above.
    const shopKartOrder = await Order.create({
      user: customer._id,
      items: orderItems,
      shippingAddress: {
        fullName: shippingAddress.fullName.trim(),
        phone: shippingAddress.phone.trim(),
        addressLine1: shippingAddress.addressLine1.trim(),
        city: shippingAddress.city.trim(),
        state: shippingAddress.state.trim(),
        pincode: shippingAddress.pincode.trim()
      },
      totalAmount,
      paymentStatus: "PENDING",
      status: "PENDING_PAYMENT"
    });

    try {
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        receipt: shopKartOrder._id.toString()
      });

      shopKartOrder.razorpayOrderId = razorpayOrder.id;
      await shopKartOrder.save();

      return res.status(201).json({
        success: true,
        shopKartOrderId: shopKartOrder._id,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: process.env.RAZORPAY_KEY_ID
      });
    } catch (razorpayError) {
      console.error("Razorpay order creation failed:", razorpayError);

      // Keep the cart untouched. The pending ShopKart order is retained
      // for traceability, but it cannot be paid because no Razorpay order exists.
      return res.status(502).json({
        success: false,
        message: "Unable to initialize payment. Please try again."
      });
    }
  } catch (error) {
    console.error("Create payment order error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create payment order"
    });
  }
};

// POST /orders/verify-payment
export const verifyPayment = async (req, res) => {
  try {
    const {
      shopKartOrderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(shopKartOrderId) ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Incomplete payment verification data"
      });
    }

    const order = await Order.findOne({
      _id: shopKartOrderId,
      user: req.user
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (!order.razorpayOrderId) {
      return res.status(400).json({
        success: false,
        message: "Payment order is not initialized"
      });
    }

    // The database value is the trusted Razorpay order id.
    if (order.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: "Payment order mismatch"
      });
    }

    const body = `${order.razorpayOrderId}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature"
      });
    }

    // Idempotency: a retry after a successful verification must not
    // clear a newer cart that the customer may have created afterwards.
    const wasAlreadyPaid = order.paymentStatus === "PAID";

    if (!wasAlreadyPaid) {
      order.paymentStatus = "PAID";
      order.status = "PLACED";
      order.razorpayPaymentId = razorpay_payment_id;
      await order.save();

      const customer = await Customer.findById(req.user);
      if (!customer) {
        return res.status(401).json({
          success: false,
          message: "Customer not found"
        });
      }

      // Cart is cleared only after the payment signature has been verified.
      customer.cart = [];
      await customer.save();
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified and order placed",
      order
    });
  } catch (error) {
    console.error("Verify payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify payment"
    });
  }
};

// GET /orders
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user })
      .sort({ createdAt: -1 })
      .select("-__v");

    return res.status(200).json({
      success: true,
      orders
    });
  } catch (error) {
    console.error("Get orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders"
    });
  }
};

// GET /orders/:id
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Ownership is part of the query, so another user's order is never returned.
    const order = await Order.findOne({
      _id: id,
      user: req.user
    }).select("-__v");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    return res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error("Get order error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch order"
    });
  }
};
