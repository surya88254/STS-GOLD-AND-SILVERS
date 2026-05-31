import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { supabase } from "../services/supabase";
import "../styles/category.css";

function Billing() {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const stateOrder = location.state?.order || null;
  const [order, setOrder] = useState(stateOrder);
  const [productInfo, setProductInfo] = useState(location.state?.product || null);
  const [loading, setLoading] = useState(stateOrder ? false : Boolean(orderId));
  const [error, setError] = useState(stateOrder ? null : orderId ? null : "Order ID missing");

  useEffect(() => {
    const fetchProduct = async (productId) => {
      try {
        const { data: productData, error: productError } = await supabase
          .from("products")
          .select("*")
          .eq("id", productId)
          .single();

        if (!productError) {
          console.log("🎁 PRODUCT DATA:", productData);
          setProductInfo(productData);
        } else {
          console.log("❌ Product fetch error:", productError);
        }
      } catch (err) {
        console.error("Fetch product error:", err);
      }
    };

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .single();

        if (error) {
          setError("Order not found");
          console.error("Supabase error:", error);
          return;
        }

        console.log("📦 FULL ORDER DATA:", data);
        console.log("All keys in order:", Object.keys(data));

        setOrder(data);

        if (data?.product_id) {
          await fetchProduct(data.product_id);
        } else {
          console.log("⚠️ No product_id in order");
        }
      } catch (err) {
        setError("Failed to fetch order");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (stateOrder) {
      if (!productInfo && stateOrder.product_id) {
        fetchProduct(stateOrder.product_id);
      }
      return;
    }

    if (orderId) {
      fetchOrder();
    }
  }, [orderId, stateOrder, productInfo]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container" style={{ padding: "20px", textAlign: "center" }}>
          <h2>Loading order details...</h2>
        </div>
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <Navbar />
        <div className="container" style={{ padding: "20px", textAlign: "center" }}>
          <h2 style={{ color: "red" }}>{error || "Order not found"}</h2>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container" style={{ padding: "40px 20px" }}>
        <h1>Billing Details</h1>

        <div style={{ marginTop: "30px", border: "1px solid #ddd", borderRadius: "8px", padding: "20px" }}>
          {/* Customer Information */}
          <h3>Customer Information</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "10px", fontWeight: "bold", width: "30%" }}>Customer Name:</td>
                <td style={{ padding: "10px" }}>{order.customer_name || "N/A"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "10px", fontWeight: "bold" }}>Phone:</td>
                <td style={{ padding: "10px" }}>{order.phone || "N/A"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "10px", fontWeight: "bold" }}>Email:</td>
                <td style={{ padding: "10px" }}>{order.customer_email || "N/A"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "10px", fontWeight: "bold" }}>Address:</td>
                <td style={{ padding: "10px" }}>{order.address || order.shipping_address || order.delivery_address || "N/A"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "10px", fontWeight: "bold" }}>Location:</td>
                <td style={{ padding: "10px" }}>
                  {order.city || "-"}, {order.pincode || "-"}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Product Information */}
          <h3 style={{ marginTop: "30px" }}>Product Information</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "10px", fontWeight: "bold", width: "30%" }}>Product Name:</td>
                <td style={{ padding: "10px" }}>{order.product_name || productInfo?.name || order.product || "N/A"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "10px", fontWeight: "bold" }}>Category:</td>
                <td style={{ padding: "10px" }}>{order.category || productInfo?.category || productInfo?.category_name || "-"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "10px", fontWeight: "bold" }}>Metal Type:</td>
                <td style={{ padding: "10px" }}>{productInfo?.metal_type || "-"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "10px", fontWeight: "bold" }}>Weight:</td>
                <td style={{ padding: "10px" }}>{order.weight || "N/A"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "10px", fontWeight: "bold" }}>Quantity:</td>
                <td style={{ padding: "10px" }}>{order.quantity || "N/A"}</td>
              </tr>
            </tbody>
          </table>

          {/* Billing Information */}
          <h3 style={{ marginTop: "30px" }}>Billing Information</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "10px", fontWeight: "bold", width: "30%" }}>Rate (per gram):</td>
                <td style={{ padding: "10px" }}>₹{order.rate || order.unit_price || order.price || "N/A"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "10px", fontWeight: "bold" }}>Subtotal:</td>
                <td style={{ padding: "10px" }}>₹{order.subtotal || order.amount || order.item_total || "N/A"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "10px", fontWeight: "bold" }}>GST:</td>
                <td style={{ padding: "10px" }}>₹{order.gst || order.tax || "N/A"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #eee", backgroundColor: "#f0f0f0" }}>
                <td style={{ padding: "10px", fontWeight: "bold" }}>Final Total:</td>
                <td style={{ padding: "10px", fontWeight: "bold", fontSize: "18px", color: "#d4af37" }}>
                  ₹{order.final_total || order.total || order.grand_total || "N/A"}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Order Status */}
          <h3 style={{ marginTop: "30px" }}>Order Status</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "10px", fontWeight: "bold", width: "30%" }}>Status:</td>
                <td style={{ padding: "10px" }}>
                  <span
                    style={{
                      padding: "5px 10px",
                      borderRadius: "4px",
                      backgroundColor: order.status === "completed" ? "#4caf50" : "#ff9800",
                      color: "white",
                      fontWeight: "bold",
                    }}
                  >
                    {order.status?.toUpperCase() || "PENDING"}
                  </span>
                </td>
              </tr>
              <tr>
                <td style={{ padding: "10px", fontWeight: "bold" }}>Order Date:</td>
                <td style={{ padding: "10px" }}>
                  {order.created_at ? new Date(order.created_at).toLocaleDateString() : "N/A"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: "30px", textAlign: "center" }}>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: "12px 26px",
              backgroundColor: "#d4af37",
              color: "#000",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "16px",
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    </>
  );
}

export default Billing;
