import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../services/api";
import Navbar from "../components/Navbar";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/products/${id}`);

        setProduct(response.data.product);
      } catch (err) {
        console.error(err);
        setError("Something went wrong while loading the product.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  return (
    <>
      <Navbar />

      <main className="details-page">
        {loading && (
          <div className="state-message">
            Loading product...
          </div>
        )}

        {error && (
          <div className="state-message error">
            {error}
          </div>
        )}

        {!loading && !error && product && (
          <div className="details-card">
            <img
              src={product.image}
              alt={product.name}
              className="details-image"
            />

            <div className="details-content">
              <p className="product-category">
                {product.category}
              </p>

              <h1>{product.name}</h1>

              <p className="details-description">
                {product.description}
              </p>

              <h2 className="product-price">
                ₹{product.price.toLocaleString("en-IN")}
              </h2>

              <p>
                <strong>Stock:</strong>{" "}
                {product.stock > 0
                  ? `${product.stock} units available`
                  : "Out of stock"}
              </p>

              <div className="details-actions">
                <button
                  disabled={product.stock === 0}
                >
                  Add to Cart
                </button>

                <button
                  className="secondary-button"
                  onClick={() => navigate("/products")}
                >
                  Back to Products
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

export default ProductDetails;