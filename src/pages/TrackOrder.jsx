import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { supabase } from "../services/supabase";
import { Toaster, toast } from "react-hot-toast";
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

const getStatusStepIndex = (status) => ORDER_STATUS_STEPS.indexOf(normalizeStatus(status));

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

const formatDate = (value) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(value);
  }
};

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString()}`;

function TrackOrder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orderIdInput, setOrderIdInput] = useState(searchParams.get("orderId") || "");
  const [order, setOrder] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState(null);

  const loadOrder = async (id, shouldToast = false) => {
    if (!id) {
      setOrder(null);
      setError("Please provide a valid order ID.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id;
      if (!currentUserId) {
        navigate("/login");
        return;
      }
      setUserId(currentUserId);

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();

      if (orderError || !orderData) {
        setOrder(null);
        setError(orderError?.message || "Order not found.");
        return;
      }

      if (orderData.user_id && orderData.user_id !== currentUserId) {
        setOrder(null);
        setError("You do not have permission to view this order.");
        return;
      }

      const normalizedStatus = normalizeStatus(orderData.status);
      const enrichedOrder = {
        ...orderData,
        status: normalizedStatus,
      };
      setOrder(enrichedOrder);

      if (orderData.product_id) {
        const { data: productData } = await supabase
          .from("products")
          .select("id, name, image_url, price")
          .eq("id", orderData.product_id)
          .single();

        setProduct(productData || null);
      }

      if (shouldToast) {
        toast.success(`📦 Order ${id.slice(0, 8)} is now ${normalizedStatus}`, {
          duration: 5000,
          style: {
            background: "#111",
            color: "#fff",
            border: "1px solid rgba(255,215,0,0.35)",
            boxShadow: "0 14px 40px rgba(0, 0, 0, 0.35)",
          },
        });
      }
    } catch (err) {
      console.error("Track order load failed:", err);
      setError("Unable to load tracking information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUserId = data?.session?.user?.id;
      if (!currentUserId) {
        navigate("/login");
        return;
      }
      setUserId(currentUserId);
      const idFromQuery = searchParams.get("orderId");
      if (idFromQuery) {
        setOrderIdInput(idFromQuery);
        loadOrder(idFromQuery);
      }
    };
    fetchSession();
  }, [navigate, searchParams]);

  useEffect(() => {
    if (!order?.id) return;

    const channel = supabase
      .channel(`order-track-${order.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${order.id}`,
        },
        (payload) => {
          const next = payload.new;
          const nextStatus = normalizeStatus(next.status);
          setOrder((prev) => ({
            ...prev,
            ...next,
            status: nextStatus,
          }));

          toast(`✅ Your order is ${nextStatus}`, {
            icon: "🚚",
            duration: 4500,
            style: {
              background: "#121212",
              color: "#fff",
              border: "1px solid rgba(255,215,0,0.35)",
              boxShadow: "0 18px 45px rgba(0,0,0,0.35)",
            },
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order?.id]);

  const handleSearch = async (event) => {
    event.preventDefault();
    if (!orderIdInput) {
      setError("Please enter an order ID to continue.");
      return;
    }

    setError("");
    setOrder(null);
    await loadOrder(orderIdInput, true);
    navigate(`/track-order?orderId=${encodeURIComponent(orderIdInput)}`, { replace: true });
  };

  const currentStepIndex = getStatusStepIndex(order?.status);

  return (
    <div className="tracking-page">
      <Navbar />
      <Toaster position="top-right" />

      <div className="tracking-hero glass-panel">
        <div>
          <span className="tracking-tag">Live Tracking</span>
          <h1>Track your luxury order in real time</h1>
          <p>Instant delivery updates, status timeline, and premium order details.</p>
        </div>
        <form className="tracking-search" onSubmit={handleSearch}>
          <input
            aria-label="Order ID"
            placeholder="Enter your order ID"
            value={orderIdInput}
            onChange={(e) => setOrderIdInput(e.target.value)}
          />
          <button type="submit" className="order-action-btn">Load Order</button>
        </form>
      </div>

      {error && <div className="orders-empty error-message">{error}</div>}

      {loading && <div className="orders-empty">Loading order status...</div>}

      {order && !loading && (
        <div className="tracking-detail-grid">
          <section className="tracking-summary glass-panel">
            <div className="tracking-summary-header">
              <div>
                <span className="tracking-subtitle">Order ID</span>
                <h2>{order.id}</h2>
              </div>
              <span className={getBadgeClass(order.status)}>{order.status}</span>
            </div>

            <div className="tracking-info-grid">
              <div>
                <label>Product</label>
                <p>{product?.name || order.product_name || "Premium selection"}</p>
              </div>
              <div>
                <label>Customer</label>
                <p>{order.customer_name || "Valued Customer"}</p>
              </div>
              <div>
                <label>Last Updated</label>
                <p>{formatDate(order.updated_at || order.created_at)}</p>
              </div>
              <div>
                <label>Amount</label>
                <p>{formatCurrency(order.final_total || order.total || order.subtotal)}</p>
              </div>
              <div>
                <label>Estimated Delivery</label>
                <p>{formatDate(order.estimated_delivery_date || order.delivery_date || order.estimated_delivery)}</p>
              </div>
              <div>
                <label>Tracking Notes</label>
                <p>{order.tracking_notes || order.notes || "Packed and shipped"}</p>
              </div>
            </div>
          </section>

          <section className="tracking-timeline glass-panel">
            <h3>Delivery Timeline</h3>
            <div className="timeline">
              {ORDER_STATUS_STEPS.map((step, index) => {
                const isCompleted = index < currentStepIndex;
                const isCurrent = index === currentStepIndex;
                return (
                  <div key={step} className={`timeline-step ${isCompleted ? "completed" : isCurrent ? "current" : "future"}`}>
                    <div className="timeline-marker">
                      {isCompleted ? "✓" : isCurrent ? <span className="timeline-pulse" /> : "○"}
                    </div>
                    <p>{step}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="tracking-card glass-panel">
            <div className="tracking-card-header">
              <h3>Order Snapshot</h3>
              <p>Premium details for your luxury delivery.</p>
            </div>
            <div className="tracking-card-body">
              <div className="tracking-card-image">
                <img
                  src={product?.image_url || order.product_image || "/assets/default-avatar.png"}
                  alt={product?.name || order.product_name}
                  onError={(e) => { e.target.src = "/assets/default-avatar.png"; }}
                />
              </div>
              <div className="tracking-card-details">
                <h4>{product?.name || order.product_name || "Premium Item"}</h4>
                <p>{order.customer_name || "Customer"}</p>
                <div className="tracking-card-meta">
                  <span>{formatCurrency(order.final_total || order.total || order.subtotal)}</span>
                  <span>{formatDate(order.created_at)}</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default TrackOrder;
