import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import api from "../services/api";

function Orders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/orders");
      setOrders(response.data.orders);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }

      setError(
        err.response?.data?.message || "Unable to load your orders."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <>
      <Navbar />

      <main className="products-page">
        <div className="products-header">
          <div>
            <p className="eyebrow">SHOPKART</p>
            <h1>My Orders</h1>
          </div>
        </div>

        {loading && (
          <div className="state-message">Loading your orders...</div>
        )}

        {!loading && error && (
          <div className="state-message error">
            <p>{error}</p>
            <button onClick={fetchOrders}>Try Again</button>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="state-message">
            <div style={{ fontSize: "48px" }}>📦</div>
            <h2>You have not placed any orders yet.</h2>
            <p>Start shopping and your orders will appear here.</p>
            <button onClick={() => navigate("/products")}>
              Start Shopping
            </button>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="orders-list">
            {orders.map((order) => (
              <article className="order-card" key={order._id}>
                <div className="order-card-header">
                  <div>
                    <span>Order #{order._id}</span>
                    <small>
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </small>
                  </div>
                  <strong className={`status status-${order.status.toLowerCase()}`}>
                    {order.status}
                  </strong>
                </div>

                <div className="order-items">
                  {order.items.map((item) => (
                    <div className="order-item" key={`${order._id}-${item.product}`}>
                      <div>
                        <strong>{item.name}</strong>
                        <span>× {item.quantity}</span>
                      </div>
                      <span>
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="order-card-footer">
                  <strong>
                    Total: ₹{order.totalAmount.toLocaleString("en-IN")}
                  </strong>
                  <button onClick={() => navigate(`/orders/${order._id}`)}>
                    View Details
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

export default Orders;
