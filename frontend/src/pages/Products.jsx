import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import api from "../services/api";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";

function Products() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState(
    searchParams.get("search") || ""
  );
  const [category, setCategory] = useState(
    searchParams.get("category") || ""
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const params = {};

        if (search.trim()) {
          params.search = search.trim();
        }

        if (category) {
          params.category = category;
        }

        const response = await api.get("/products", {
          params
        });

        setProducts(response.data.products);
      } catch (err) {
        console.error(err);
        setError(
          "Something went wrong while loading products."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [search, category]);

  const handleSearch = (e) => {
    const value = e.target.value;

    setSearch(value);

    setSearchParams({
      ...(value ? { search: value } : {}),
      ...(category ? { category } : {})
    });
  };

  const handleCategory = (e) => {
    const value = e.target.value;

    setCategory(value);

    setSearchParams({
      ...(search ? { search } : {}),
      ...(value ? { category: value } : {})
    });
  };

  return (
    <>
      <Navbar />

      <main className="products-page">
        <div className="products-header">
          <div>
            <p className="eyebrow">SHOPKART</p>
            <h1>Product Catalog</h1>
            <p>Find something you like.</p>
          </div>

          <div className="filters">
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={handleSearch}
            />

            <select
              value={category}
              onChange={handleCategory}
            >
              <option value="">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Fashion">Fashion</option>
              <option value="Books">Books</option>
              <option value="Home">Home</option>
            </select>
          </div>
        </div>

        {loading && (
          <div className="state-message">
            Loading products...
          </div>
        )}

        {error && (
          <div className="state-message error">
            {error}
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="state-message">
            No products found.
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

export default Products;