import { useState } from "react";
import { useNavigate } from "react-router-dom";

function WishlistCard({ product, onRemove }) {
  const navigate = useNavigate();
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    setRemoving(true);
    const ok = await onRemove(product._id);
    if (!ok) setRemoving(false); // keep card, allow retry
  };

  return (
    <div className="product-card">
      <img
        src={product.image}
        alt={product.name}
        className="product-image"
      />

      <div className="product-content">
        <p className="product-category">{product.category}</p>

        <h2>{product.name}</h2>

        <p className="product-price">
          ₹{product.price.toLocaleString("en-IN")}
        </p>

        <p className="stock">
          {product.stock > 0
            ? `${product.stock} units left`
            : "Out of stock"}
        </p>

        <button onClick={() => navigate(`/products/${product._id}`)}>
          View Details
        </button>

        <button
          className="wishlist-button"
          onClick={handleRemove}
          disabled={removing}
        >
          {removing ? "Removing..." : "Remove ♥"}
        </button>
      </div>
    </div>
  );
}

export default WishlistCard;