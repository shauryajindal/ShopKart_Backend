import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import Navbar from "../components/Navbar";
import WishlistCard from "../components/WishlistCard";

function Wishlist() {
  const navigate = useNavigate();

  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [removeError, setRemoveError] = useState("");

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError(false);

      const response = await api.get("/wishlist");

      setWishlist(response.data.wishlist);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (productId) => {
    try {
      setRemoveError("");
      await api.delete(`/wishlist/${productId}`);

      setWishlist((prev) =>
        prev.filter((item) => item._id !== productId)
      );
      return true;
    } catch (err) {
      console.error(err);
      setRemoveError("Unable to remove product. Please try again.");
      return false;
    }
  };

  return (
    <>
      <Navbar />

      <main className="products-page">
        <div className="products-header">
          <div>
            <p className="eyebrow">SHOPKART</p>
            <h1>My Wishlist</h1>
            {!loading && !error && (
              <p>
                {wishlist.length}{" "}
                {wishlist.length === 1 ? "product" : "products"} saved
              </p>
            )}
          </div>
        </div>

        {loading && (
          <div className="state-message">
            Loading your wishlist...
          </div>
        )}

        {error && (
          <div className="state-message error">
            <p>Something went wrong.</p>
            <p>We couldn't load your wishlist.</p>
            <button onClick={fetchWishlist}>Try Again</button>
          </div>
        )}

        {removeError && (
          <div className="state-message error">{removeError}</div>
        )}

        {!loading && !error && wishlist.length === 0 && (
          <div className="state-message">
            <div style={{ fontSize: "48px" }}>❤️</div>
            <h2>Your wishlist is empty</h2>
            <p>Save products you love and find them here later.</p>
            <button onClick={() => navigate("/products")}>
              Browse Products
            </button>
          </div>
        )}

        {!loading && !error && wishlist.length > 0 && (
          <div className="product-grid">
            {wishlist.map((product) => (
              <WishlistCard
                key={product._id}
                product={product}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

export default Wishlist;