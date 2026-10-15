import express from "express";

import {
  addToWishlist,
  getWishlist,
  removeFromWishlist
} from "../controllers/wishlist.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware); // protects every wishlist route

router.get("/", getWishlist);
router.post("/:productId", addToWishlist);
router.delete("/:productId", removeFromWishlist);

export default router;