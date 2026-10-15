import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import { useCart } from "../context/CartContext";
import api from "../services/api";

const initialForm = {
  fullName: "",
  phone: "",
  addressLine1: "",
  city: "",
  state: "",
  pincode: ""
};

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true), {
        once: true
      });
      existingScript.addEventListener("error", () => resolve(false), {
        once: true
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

function Checkout() {
  const navigate = useNavigate();
  const { cartItems, loading, authRequired, subtotal, clearCart } = useCart();

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [placingOrder, setPlacingOrder] = useState(false);
  const [serverError, setServerError] = useState("");

  const itemCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  useEffect(() => {
    if (!loading && authRequired) {
      navigate("/login", { replace: true });
    }
  }, [loading, authRequired, navigate]);

  useEffect(() => {
    if (!loading && !authRequired && cartItems.length === 0) {
      navigate("/cart", { replace: true });
    }
  }, [loading, authRequired, cartItems.length, navigate]);

  const validate = () => {
    const nextErrors = {};

    for (const [key, value] of Object.entries(form)) {
      if (!value.trim()) {
        nextErrors[key] = "This field is required";
      }
    }

    if (form.phone.trim() && !/^\d{10}$/.test(form.phone.trim())) {
      nextErrors.phone = "Phone must contain 10 digits";
    }

    if (form.pincode.trim() && !/^\d{6}$/.test(form.pincode.trim())) {
      nextErrors.pincode = "Pincode must contain 6 digits";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: ""
    }));

    setServerError("");
  };

  const handlePlaceOrder = async (event) => {
    event.preventDefault();

    if (!validate()) return;

    setPlacingOrder(true);
    setServerError("");

    try {
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        throw new Error("Unable to load Razorpay Checkout. Please try again.");
      }

      // Only shipping details are sent. The backend reads the authenticated
      // user's cart and calculates the authoritative amount.
      const { data } = await api.post("/orders/create-payment-order", {
        shippingAddress: form
      });

      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: "ShopKart",
        description: "ShopKart Order",
        order_id: data.razorpayOrderId,
        prefill: {
          name: form.fullName,
          contact: form.phone
        },
        handler: async (response) => {
          try {
            const verification = await api.post("/orders/verify-payment", {
              shopKartOrderId: data.shopKartOrderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            // Backend has verified payment and cleared its cart.
            // Keep the React global state synchronized immediately.
            clearCart();

            navigate(`/order-success/${verification.data.order._id}`, {
              replace: true
            });
          } catch (error) {
            setServerError(
              error.response?.data?.message ||
                "Payment verification failed. Your cart has not been cleared."
            );
          } finally {
            setPlacingOrder(false);
          }
        }
      };

      const paymentObject = new window.Razorpay(options);

      paymentObject.on("payment.failed", () => {
        setServerError(
          "Payment failed. Your cart has not been cleared. Please try again."
        );
        setPlacingOrder(false);
      });

      paymentObject.open();
    } catch (error) {
      console.error(error);
      setServerError(
        error.response?.data?.message ||
          error.message ||
          "Unable to start checkout. Please try again."
      );
      setPlacingOrder(false);
    }
  };

  if (loading || authRequired || cartItems.length === 0) {
    return (
      <>
        <Navbar />
        <main className="products-page">
          <div className="state-message">Loading checkout...</div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="products-page">
        <div className="products-header">
          <div>
            <p className="eyebrow">SHOPKART</p>
            <h1>Checkout</h1>
          </div>
        </div>

        {serverError && (
          <div className="checkout-error" role="alert">
            {serverError}
          </div>
        )}

        <form className="checkout-layout" onSubmit={handlePlaceOrder}>
          <section className="checkout-card">
            <h2>Shipping Details</h2>

            {[
              ["fullName", "Full Name", "Your full name"],
              ["phone", "Phone", "10-digit phone number"],
              ["addressLine1", "Address", "House / street / area"],
              ["city", "City", "City"],
              ["state", "State", "State"],
              ["pincode", "Pincode", "6-digit pincode"]
            ].map(([name, label, placeholder]) => (
              <label className="form-field" key={name}>
                <span>{label}</span>
                <input
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  placeholder={placeholder}
                  inputMode={
                    name === "phone" || name === "pincode"
                      ? "numeric"
                      : "text"
                  }
                  aria-invalid={Boolean(errors[name])}
                />
                {errors[name] && (
                  <small className="field-error">{errors[name]}</small>
                )}
              </label>
            ))}
          </section>

          <aside className="checkout-card checkout-summary">
            <h2>Order Summary</h2>

            <div className="checkout-items">
              {cartItems.map((item) => (
                <div className="summary-item" key={item.product._id}>
                  <div>
                    <strong>{item.product.name}</strong>
                    <span>× {item.quantity}</span>
                  </div>
                  <strong>
                    ₹{(item.product.price * item.quantity).toLocaleString("en-IN")}
                  </strong>
                </div>
              ))}
            </div>

            <div className="summary-row">
              <span>Items</span>
              <strong>{itemCount}</strong>
            </div>

            <div className="summary-row checkout-total">
              <span>Total</span>
              <strong>₹{subtotal.toLocaleString("en-IN")}</strong>
            </div>

            <p className="payment-note">
              Secure Razorpay Test Mode payment. Your cart is cleared only
              after the payment signature is verified by the server.
            </p>

            <button className="primary-action" disabled={placingOrder}>
              {placingOrder ? "Opening Payment..." : "Place Order"}
            </button>
          </aside>
        </form>
      </main>
    </>
  );
}

export default Checkout;
