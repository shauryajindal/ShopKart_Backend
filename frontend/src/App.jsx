import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import Login from "./pages/login.jsx";
import Register from "./pages/register.jsx";
import Home from "./pages/home.jsx";
import Wishlist from "./pages/Wishlist.jsx";
import Cart from "./pages/Cart.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import Checkout from "./pages/Checkout.jsx";

import Products from "./pages/Products.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";

function App() {
  return (
    <CartProvider>
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Navigate to="/login" />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/home"
          element={<Home />}
        />

        <Route
          path="/products"
          element={<Products />}
        />

        <Route
          path="/wishlist"
          element={<Wishlist />}
        />
        
        <Route
          path="/products/:id"
          element={<ProductDetails />}
          />

          <Route
                   path="/cart"
                   element={<Cart />}
          />

          <Route
            path="/checkout"
            element={<Checkout />}
          />
      </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;