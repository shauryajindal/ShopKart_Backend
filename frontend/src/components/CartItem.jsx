import { useState } from "react";
import { useCart } from "../context/CartContext";

function CartItem({ item }) {
  const { product, quantity } = item;
  const { pending, updateQuantity, removeFromCart } = useCart();

  const [error, setError] = useState("");

  const busy = Boolean(pending[product._id]); // only THIS item is disabled

  const run = async (action) => {
    setError("");
    const result = await action();
    if (!result.ok) setError(result.message);
  };

  return (
    <div className="cart-item">
      <img
        src={product.image}
        alt={product.name}
        className="cart-item-image"
      />

      <div className="cart-item-info">
        <h2>{product.name}</h2>

        <p className="product-price">
          ₹{product.price.toLocaleString("en-IN")}
        </p>

        {quantity > product.stock && (
          <p className="wishlist-error">
            Only {product.stock} unit(s) available now. Please reduce
            the quantity.
          </p>
        )}

        <div className="quantity-controls">
          <button
            disabled={busy || quantity <= 1}
            onClick={() =>
              run(() => updateQuantity(product._id, quantity - 1))
            }
          >
            −
          </button>

          <span>{quantity}</span>

          <button
            disabled={busy || quantity >= product.stock}
            onClick={() =>
              run(() => updateQuantity(product._id, quantity + 1))
            }
          >
            +
          </button>
        </div>

        <button
          className="cart-remove"
          disabled={busy}
          onClick={() => run(() => removeFromCart(product._id))}
        >
          {busy ? "Updating..." : "Remove"}
        </button>

        {error && <p className="wishlist-error">{error}</p>}
      </div>

      <div className="cart-item-total">
        ₹{(product.price * quantity).toLocaleString("en-IN")}
      </div>
    </div>
  );
}

export default CartItem;