import mongoose from "mongoose";
import { Customer } from "../models/customer.model.js";
import { Product } from "../models/product.model.js";

// Returns cart with live Product data (latest price/stock).
// Items whose product was deleted are skipped.
const getPopulatedCart = async (customerId) => {
  const customer = await Customer.findById(customerId).populate({
    path: "cart.product",
    select: "name price category image stock"
  });

  if (!customer) return null;

  return customer.cart
    .filter((item) => item.product)
    .map((item) => ({
      product: item.product,
      quantity: item.quantity
    }));
};

const notLoggedIn = (res) =>
  res.status(401).json({ success: false, message: "Customer not found" });

// POST /cart/:productId
export const addToCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const customer = await Customer.findById(req.user);
    if (!customer) return notLoggedIn(res);

    const item = customer.cart.find(
      (i) => String(i.product) === String(product._id)
    );

    const newQuantity = item ? item.quantity + 1 : 1;

    if (newQuantity > product.stock) {
      return res.status(400).json({
        success: false,
        message:
          product.stock === 0
            ? "Product is out of stock"
            : `Only ${product.stock} unit(s) available`
      });
    }

    if (item) {
      item.quantity = newQuantity;
    } else {
      customer.cart.push({ product: product._id, quantity: 1 });
    }

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Cart updated",
      cart: await getPopulatedCart(req.user)
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update cart"
    });
  }
};

// GET /cart
export const getCart = async (req, res) => {
  try {
    const cart = await getPopulatedCart(req.user);
    if (!cart) return notLoggedIn(res);

    return res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch cart"
    });
  }
};

// PATCH /cart/:productId   body: { quantity }
export const updateCartQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const quantity = req.body.quantity;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    if (typeof quantity !== "number" || !Number.isInteger(quantity)) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a whole number"
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1"
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const customer = await Customer.findById(req.user);
    if (!customer) return notLoggedIn(res);

    const item = customer.cart.find(
      (i) => String(i.product) === String(product._id)
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Product not in cart"
      });
    }

    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} unit(s) available`
      });
    }

    item.quantity = quantity;
    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Quantity updated",
      cart: await getPopulatedCart(req.user)
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update quantity"
    });
  }
};

// DELETE /cart/:productId
export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    const result = await Customer.updateOne(
      { _id: req.user, "cart.product": productId },
      { $pull: { cart: { product: productId } } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not in cart"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product removed from cart",
      cart: await getPopulatedCart(req.user)
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove product"
    });
  }
};