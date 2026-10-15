import mongoose from "mongoose";
import { Customer } from "../models/customer.model.js";
import { Product } from "../models/product.model.js";

// POST /wishlist/:productId
export const addToWishlist = async (req, res) => {
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

    // Atomic: only adds if not already present
    const result = await Customer.updateOne(
      { _id: req.user, wishlist: { $ne: productId } },
      { $addToSet: { wishlist: productId } }
    );

    if (result.modifiedCount === 0) {
      return res.status(409).json({
        success: false,
        message: "Product already in wishlist"
      });
    }

    return res.status(201).json({
      success: true,
      message: "Product added to wishlist"
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to add product to wishlist"
    });
  }
};

// GET /wishlist
export const getWishlist = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user).populate({
      path: "wishlist",
      select: "name price category image stock"
    });

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Customer not found"
      });
    }

    return res.status(200).json({
      success: true,
      count: customer.wishlist.length,
      wishlist: customer.wishlist
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch wishlist"
    });
  }
};

// DELETE /wishlist/:productId
export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    const result = await Customer.updateOne(
      { _id: req.user, wishlist: productId },
      { $pull: { wishlist: productId } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not in wishlist"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product removed from wishlist"
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove product from wishlist"
    });
  }
};