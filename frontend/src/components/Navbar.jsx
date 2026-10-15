import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useCart } from "../context/CartContext";

function Navbar() {
  const navigate = useNavigate();
  const { cartCount, clearCart } = useCart();

  const handleLogout = async () => {
    try {
      await api.post("/customers/logout");
      clearCart();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed");
    }
  };

  return (
    <nav className="navbar">
      <div className="logo">ShopKart</div>

      <div className="nav-actions">
        <button onClick={() => navigate("/home")}>
          Home
        </button>

        <button onClick={() => navigate("/products")}>
          Products
        </button>

        <button onClick={() => navigate("/wishlist")}>
          Wishlist
        </button>

        <button onClick={() => navigate("/cart")}>
          Cart ({cartCount})
        </button>

        <button onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;