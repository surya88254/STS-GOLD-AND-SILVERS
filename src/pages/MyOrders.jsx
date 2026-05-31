import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { supabase } from "../services/supabase";
import "../styles/order-tracking.css";

const ORDER_STATUS_STEPS = [
  "Pending",
  "Confirmed",
  "Processing",
  "Out For Delivery",
  "Delivered",
];

const normalizeStatus = (status) => {
  if (!status) return "Pending";
  const normalized = String(status).trim().toLowerCase();
  if (normalized === "pending") return "Pending";
  if (normalized === "confirmed") return "Confirmed";
  if (normalized === "processing") return "Processing";
  if (normalized === "out for delivery" || normalized === "out_for_delivery" || normalized === "out-for-delivery") return "Out For Delivery";
  if (normalized === "delivered") return "Delivered";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const getBadgeClass = (status) => {
  switch (normalizeStatus(status)) {
    case "Pending":
      return "badge badge-gold";
    case "Confirmed":
      return "badge badge-blue";
    case "Processing":
      return "badge badge-orange";
    case "Out For Delivery":
      return "badge badge-purple";
    case "Delivered":
      return "badge badge-green";
    default:
      return "badge badge-gold";
  }
};

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString()}`;

const formatDate = (value) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return String(value);
  }
};

function MyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrders = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (ordersError) {
          setError(ordersError.message || "Unable to load orders.");
          setOrders([]);
          return;
        }

        const productIds = Array.from(
          new Set((ordersData || []).map((order) => order.product_id).filter(Boolean))
        );

        let productMap = {};
        if (productIds.length) {
          const { data: productsData, error: productsError } = await supabase
            .from("products")
            .select("id, name, image_url, price")
            .in("id", productIds);

          if (!productsError) {
            productMap = (productsData || []).reduce((acc, product) => {
              acc[product.id] = product;
              return acc;
            }, {});
          }
        }

        const enriched = (ordersData || []).map((order) => ({
          ...order,
          status: normalizeStatus(order.status),
          product: productMap[order.product_id] || order.product || null,
        }));

        setOrders(enriched);
      } catch (err) {
        console.error("MyOrders load failed:", err);
        setError("Unable to load your orders. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [navigate]);

  return (
    <div className="tracking-page">
      <Navbar />
      <div className="tracking-hero glass-panel">
        <div>
          <span className="tracking-tag">My Orders</span>
          <h1>Luxury order history</h1>
          <p>Track every premium purchase with real-time status, invoices, and delivery highlights.</p>
        </div>
      </div>

      <div className="orders-history-grid">
        {loading ? (
          <div className="orders-empty">Loading your recent orders...</div>
        ) : error ? (
          <div className="orders-empty error-message">{error}</div>
        ) : orders.length === 0 ? (
          <div className="orders-empty">
            No orders found yet.
            <button className="order-action-btn" onClick={() => navigate("/home")}>Shop Now</button>
          </div>
        ) : (
          orders.map((order) => {
            const productName = order.product?.name || order.product_name || "Premium Item";
            const imageUrl = order.product?.image_url || order.product_image || "/assets/default-avatar.png";
            const amount = order.final_total || order.total || order.subtotal || 0;

            return (
              <article className="order-card" key={order.id}>
                <div className="order-card-media">
                  <img src={imageUrl} alt={productName} onError={(e) => { e.target.src = "/assets/default-avatar.png"; }} />
                </div>
                <div className="order-card-content">
                  <div className="order-card-header">
                    <div>
                      <h2>{productName}</h2>
                      <p>{order.customer_name || "Valued Customer"}</p>
                    </div>
                    <span className={getBadgeClass(order.status)}>{order.status}</span>
                  </div>

                  <div className="order-card-meta">
                    <span>{formatDate(order.created_at)}</span>
                    <span>{formatCurrency(amount)}</span>
                  </div>

                  <div className="order-card-notes">
                    <strong>Delivery notes:</strong> {order.tracking_notes || "Packed and shipped"}
                  </div>

                  <div className="order-card-actions">
                    <button
                      className="order-action-btn"
                      onClick={() => navigate(`/track-order?orderId=${order.id}`)}
                    >
                      Track Order
                    </button>
                    <button
                      className="order-action-btn secondary"
                      onClick={() => navigate(`/billing/${order.id}`)}
                    >
                      Invoice
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

export default MyOrders;
