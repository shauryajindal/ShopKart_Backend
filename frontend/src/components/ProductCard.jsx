import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useCart } from "../context/CartContext";

function ProductCard({ product }) {
  const navigate = useNavigate();
  const { cartItems, pending, addToCart } = useCart();

  // ---- Wishlist (Lab 04) ----
  const [status, setStatus] = useState("idle"); // idle | saving | saved | error
  const [message, setMessage] = useState("");

  const handleWishlist = async () => {
    if (status === "saving") return;

    try {
      setStatus("saving");
      setMessage("");

      await api.post(`/wishlist/${product._id}`);

      setStatus("saved");
    } catch (err) {
      if (err.response?.status === 409) {
        setStatus("saved");
      } else if (err.response?.status === 401) {
        navigate("/login");
      } else {
        setStatus("error");
        setMessage("Unable to save product. Please try again.");
      }
    }
  };

  const wishlistLabel = {
    idle: "♡ Add to Wishlist",
    saving: "⏳ Saving...",
    saved: "♥ Added to Wishlist",
    error: "♡ Add to Wishlist"
  }[status];

  // ---- Cart (Lab 05) ----
  const [cartError, setCartError] = useState("");

  const inCartQty =
    cartItems.find((item) => item.product._id === product._id)
      ?.quantity || 0;

  const adding = Boolean(pending[product._id]);

  const handleAddToCart = async () => {
    if (adding) return;

    setCartError("");

    const result = await addToCart(product._id);

    if (!result.ok) {
      if (result.status === 401) {
        navigate("/login");
      } else {
        setCartError(result.message);
      }
    }
  };

  const cartLabel = adding
    ? "Adding..."
    : product.stock === 0
    ? "Out of stock"
    : inCartQty > 0
    ? `Add Another (${inCartQty} in cart)`
    : "Add to Cart";

  return (
    <div className="product-card">
      <img
        src={product.image}
        alt={product.name}
        className="product-image"
      />

      <div className="product-content">
        <p className="product-category">
          {product.category}
        </p>

        <h2>{product.name}</h2>

        <p className="product-price">
          ₹{product.price.toLocaleString("en-IN")}
        </p>

        <p className="stock">
          {product.stock > 0
            ? `${product.stock} units left`
            : "Out of stock"}
        </p>

        <button
          onClick={() =>
            navigate(`/products/${product._id}`)
          }
        >
          View Details
        </button>

        <button
          className="wishlist-button"
          onClick={handleWishlist}
          disabled={status === "saving" || status === "saved"}
        >
          {wishlistLabel}
        </button>

        <button
          className="wishlist-button"
          onClick={handleAddToCart}
          disabled={adding || product.stock === 0}
        >
          {cartLabel}
        </button>

        {message && <p className="wishlist-error">{message}</p>}
        {cartError && <p className="wishlist-error">{cartError}</p>}
      </div>
    </div>
  );
}

export default ProductCard;