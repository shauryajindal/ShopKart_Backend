import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import api from "../services/api";

function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await api.get(`/orders/${id}`);
        setOrder(response.data.order);
      } catch (err) {
        setError(
          err.response?.data?.message || "Unable to load this order."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  return (
    <>
      <Navbar />

      <main className="products-page">
        <button className="back-button" onClick={() => navigate("/orders")}>
          ← My Orders
        </button>

        {loading && (
          <div className="state-message">Loading order...</div>
        )}

        {!loading && error && (
          <div className="state-message error">
            <h2>{error}</h2>
          </div>
        )}

        {!loading && order && (
          <div className="order-detail-card">
            <div className="order-detail-header">
              <div>
                <p className="eyebrow">ORDER</p>
                <h1>#{order._id}</h1>
              </div>
              <strong className="status">{order.status}</strong>
            </div>

            <section>
              <h2>Items</h2>
              <div className="order-items">
                {order.items.map((item) => (
                  <div className="order-item" key={`${item.product}-${item.quantity}`}>
                    <div>
                      <strong>{item.name}</strong>
                      <span>
                        ₹{item.price.toLocaleString("en-IN")} × {item.quantity}
                      </span>
                    </div>
                    <strong>
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="shipping-box">
              <h2>Shipping Address</h2>
              <p>{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.phone}</p>
              <p>{order.shippingAddress.addressLine1}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} -{" "}
                {order.shippingAddress.pincode}
              </p>
            </section>

            <div className="order-detail-total">
              <span>Total</span>
              <strong>
                ₹{order.totalAmount.toLocaleString("en-IN")}
              </strong>
            </div>

            <p className="payment-status">
              Payment: <strong>{order.paymentStatus}</strong>
            </p>
          </div>
        )}
      </main>
    </>
  );
}

export default OrderDetails;
