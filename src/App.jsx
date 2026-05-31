import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Gold from "./pages/Gold";
import Silver from "./pages/Silver";
import ProductDetails from "./pages/ProductDetails";
import CategoryProducts from "./pages/CategoryProducts";
import CustomDesign from "./pages/CustomDesign";
import UserLogin from "./pages/UserLogin";
import UserSignup from "./pages/UserSignup";
import Profile from "./pages/Profile";
import MyOrders from "./pages/MyOrders";
import TrackOrder from "./pages/TrackOrder";
import Wishlist from "./pages/Wishlist";
import Compare from "./pages/Compare";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import SplashScreen from "./pages/SplashScreen";
import Billing from "./pages/Billing";
import Invoice from "./pages/Invoice";
import ProtectedRoute from "./components/ProtectedRoute";
import CompareBar from "./components/CompareBar";
import { AuthProvider } from "./context/AuthContext";
import { CompareProvider } from "./context/CompareContext";
import Contact from "./pages/Contact";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CompareProvider>
          <CompareBar />
          <Routes>
            <Route path="/" element={<SplashScreen />} />
            <Route path="/splash" element={<SplashScreen />} />
            <Route path="/login" element={<UserLogin />} />
            <Route path="/signup" element={<UserSignup />} />
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gold"
              element={
                <ProtectedRoute>
                  <Gold />
                </ProtectedRoute>
              }
            />
            <Route
              path="/silver"
              element={
                <ProtectedRoute>
                  <Silver />
                </ProtectedRoute>
              }
            />
            <Route
              path="/product/:id"
              element={
                <ProtectedRoute>
                  <ProductDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/category/:id"
              element={
                <ProtectedRoute>
                  <CategoryProducts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/custom-design"
              element={
                <ProtectedRoute>
                  <CustomDesign />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/contact" element={<Contact />} />
            <Route
              path="/invoice"
              element={
                <ProtectedRoute>
                  <Invoice />
                </ProtectedRoute>
              }
            />
            <Route
              path="/billing/:orderId"
              element={
                <ProtectedRoute>
                  <Billing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wishlist"
              element={
                <ProtectedRoute>
                  <Wishlist />
                </ProtectedRoute>
              }
            />
            <Route
              path="/compare"
              element={
                <ProtectedRoute>
                  <Compare />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-orders"
              element={
                <ProtectedRoute>
                  <MyOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/track-order"
              element={
                <ProtectedRoute>
                  <TrackOrder />
                </ProtectedRoute>
              }
            />
          </Routes>
        </CompareProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
