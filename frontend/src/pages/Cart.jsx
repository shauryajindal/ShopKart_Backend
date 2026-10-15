import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import CartItem from "../components/CartItem";
import { useCart } from "../context/CartContext";

function Cart() {
  const navigate = useNavigate();

  const {
    cartItems,
    loading,
    error,
    authRequired,
    cartCount,
    subtotal,
    fetchCart
  } = useCart();

  useEffect(() => {
    if (authRequired) navigate("/login");
  }, [authRequired, navigate]);

  return (
    <>
      <Navbar />

      <main className="products-page">
        <div className="products-header">
          <div>
            <p className="eyebrow">SHOPKART</p>
            <h1>My Cart</h1>
          </div>
        </div>

        {loading && (
          <div className="state-message">Loading your cart...</div>
        )}

        {!loading && error && (
          <div className="state-message error">
            <p>Unable to load your cart.</p>
            <button onClick={fetchCart}>Try Again</button>
          </div>
        )}

        {!loading && !error && !authRequired && cartItems.length === 0 && (
          <div className="state-message">
            <div style={{ fontSize: "48px" }}>🛒</div>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added anything yet.</p>
            <button onClick={() => navigate("/products")}>
              Browse Products
            </button>
          </div>
        )}

        {!loading && !error && cartItems.length > 0 && (
          <div className="cart-layout">
            <div className="cart-list">
              {cartItems.map((item) => (
                <CartItem key={item.product._id} item={item} />
              ))}
            </div>

            <aside className="order-summary">
              <h2>Order Summary</h2>

              <div className="summary-row">
                <span>Items</span>
                <strong>{cartCount}</strong>
              </div>

              <div className="summary-row">
                <span>Subtotal</span>
                <strong>₹{subtotal.toLocaleString("en-IN")}</strong>
              </div>

              <button onClick={() => navigate("/checkout")}>
                Proceed to Checkout
              </button>
            </aside>
          </div>
        )}
      </main>
    </>
  );
}

export default Cart;