import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import Navbar from "../components/Navbar";

function Home() {
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/customers/me");

        setCustomer(response.data);
      } catch (err) {
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!customer) {
    return null;
  }

  return (
    <>
      <Navbar />

      <main className="home">
        <div className="welcome-card">
          <p className="eyebrow">SHOPKART</p>

          <h1>
            Welcome, {customer.fullName} 👋
          </h1>

          <p>
            Welcome to your ShopKart account.
          </p>

          <div className="profile-info">
            <div>
              <span>Name</span>
              <strong>{customer.fullName}</strong>
            </div>

            <div>
              <span>Email</span>
              <strong>{customer.email}</strong>
            </div>

            <div>
              <span>Phone</span>
              <strong>{customer.phone}</strong>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default Home;