import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import api from "../services/api";

function OrderSuccess() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await api.get(`/orders/${id}`);
        setOrder(response.data.order);
      } catch (error) {
        console.error(error);
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
        {loading && (
          <div className="state-message">Loading order confirmation...</div>
        )}

        {!loading && !order && (
          <div className="state-message error">
            <h2>Order not found</h2>
            <button onClick={() => navigate("/orders")}>
              View My Orders
            </button>
          </div>
        )}

        {!loading && order && (
          <div className="success-card">
            <div className="success-icon">✓</div>
            <p className="eyebrow">SHOPKART</p>
            <h1>Order Placed Successfully</h1>
            <p>Your payment has been verified and your order is saved.</p>

            <div className="success-details">
              <div>
                <span>Order ID</span>
                <strong>{order._id}</strong>
              </div>
              <div>
                <span>Total</span>
                <strong>
                  ₹{order.totalAmount.toLocaleString("en-IN")}
                </strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{order.status}</strong>
              </div>
            </div>

            <div className="success-actions">
              <button onClick={() => navigate("/orders")}>
                View My Orders
              </button>
              <button
                className="secondary-button"
                onClick={() => navigate("/products")}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

export default OrderSuccess;
