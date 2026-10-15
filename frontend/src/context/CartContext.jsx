import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

import api from "../services/api";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [pending, setPending] = useState({}); // { [productId]: true }

  // Refresh cart from backend
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);

      const response = await api.get("/cart");

      setCartItems(response.data.cart);
      setAuthRequired(false);
    } catch (err) {
      if (err.response?.status === 401) {
        setCartItems([]);
        setAuthRequired(true);
      } else {
        console.error(err);
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Runs one mutation; the server returns the full updated cart,
  // which becomes the new state (single source of truth).
  const runMutation = async (productId, request) => {
    setPending((prev) => ({ ...prev, [productId]: true }));

    try {
      const response = await request();
      setCartItems(response.data.cart);
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        status: err.response?.status,
        message:
          err.response?.data?.message ||
          "Something went wrong. Please try again."
      };
    } finally {
      setPending((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
    }
  };

  const addToCart = (productId) =>
    runMutation(productId, () => api.post(`/cart/${productId}`));

  const updateQuantity = (productId, quantity) =>
    runMutation(productId, () =>
      api.patch(`/cart/${productId}`, { quantity })
    );

  const removeFromCart = (productId) =>
    runMutation(productId, () => api.delete(`/cart/${productId}`));

  const clearCart = () => setCartItems([]);

  // Derived values - never stored
  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      ),
    [cartItems]
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        error,
        authRequired,
        pending,
        cartCount,
        subtotal,
        fetchCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside <CartProvider>");
  }

  return context;
}