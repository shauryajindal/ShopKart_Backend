import "dotenv/config";

import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import { Product } from "./src/models/product.model.js";
import cartRoutes from "./src/routes/cart.routes.js";
import wishlistRoutes from "./src/routes/wishlist.routes.js";
import orderRoutes from "./src/routes/order.routes.js";

import customerRoutes from "./src/routes/customer.routes.js";
import productRoutes from "./src/routes/product.routes.js";


const app = express();
app.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Origin",
    "http://localhost:5173"
  );

  res.header(
    "Access-Control-Allow-Credentials",
    "true"
  );

  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );

  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, PUT, DELETE, OPTIONS"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});



app.use(express.json());
app.use(cookieParser());


// Routes
app.use("/customers", customerRoutes);
app.use("/products", productRoutes);
app.use("/wishlist", wishlistRoutes);
app.use("/cart", cartRoutes);
app.use("/orders", orderRoutes);

app.get("/test", (req, res) => {
  console.log("TEST ROUTE HIT");

  res.json({
    success: true,
    message: "ShopKart server is working"
  });
});


// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");

    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error);
  });