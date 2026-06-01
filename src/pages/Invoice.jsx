import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../services/supabase";

const Invoice = () => {
  const location = useLocation();
  const order = location.state?.order;
  const productState = location.state?.product;
  const backgroundNotification = location.state?.backgroundNotification || false;
  const [productInfo, setProductInfo] = useState(productState || null);

  console.log("📄 INVOICE PAGE - Received order from location.state:", order);
  console.log("   - Address:", order?.address);
  console.log("   - Product Name:", order?.product_name);
  console.log("   - Category:", order?.category);

  useEffect(() => {
    if (productState || !order?.product_id) return;

    const fetchProduct = async () => {
      const { data, error } = await supabase.from("products").select("*").eq("id", order.product_id).single();
      if (!error) {
        setProductInfo(data);
      }
    };

    fetchProduct();
  }, [order, productState]);

  if (!order) {
    return <div style={{ padding: "40px", textAlign: "center" }}>No invoice data found.</div>;
  }

  const displayProduct = productInfo || {};
  const customerName = order.customer_name || order.name || order.full_name || order.user_name || "N/A";
  const customerEmail = order.customer_email || order.email || order.user_email || order.user_email_address || "-";
  const customerPhone = order.phone || order.mobile || order.contact || "N/A";
  const customerAddress = order.address || order.shipping_address || order.location || "N/A";
  const customerCity = order.city || order.town || order.location_city || "-";
  const customerPincode = order.pincode || order.zip || order.postal_code || "";
  const productName = displayProduct.name || order.product_name || order.product || order.name || "N/A";
  const productCategory = order.category || displayProduct.category || order.products?.category || order.product?.category || "-";
  const productMetalType = order.category || displayProduct.category || order.product?.category || order.products?.category || "-";
  const productWeight = order.weight || order.product_weight || displayProduct.weight || order.products?.weight || order.product?.weight || 0;
  const productQuantity = Number(order.quantity || 1);
  const productRate = order.rate || displayProduct.price || order.unit_price || order.products?.price || order.product?.price || 0;
  const productSubtotal = order.subtotal || order.amount || order.item_total || 0;
  const productGst = order.gst || order.tax || 0;
  const productTotal = order.final_total || order.total || order.grand_total || productSubtotal + productGst;
  const paymentMethod = order.payment_method || order.payment_type || "COD";

  const downloadInvoice = () => {
    window.print();
  };

  const sendInvoiceWhatsapp = () => {
    const message = `🛍️ STS LUXURY JEWELLERS – NEW ORDER\n\n` +
      `Customer: ${customerName}\n` +
      `Phone: ${customerPhone}\n` +
      `Product: ${productName}\n` +
      `Weight: ${productWeight}g\n` +
      `Quantity: ${productQuantity}\n` +
      `Total: ₹${productTotal}\n\n` +
      `Payment: ${paymentMethod}\n\n` +
      `Address:\n${customerAddress}\n${customerCity ? customerCity + " - " : ""}${customerPincode}\n\n` +
      `Order ID: ${order.id || "N/A"}`;

    const url = `https://wa.me/91XXXXXXXXXX?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Inter, Arial, sans-serif", background: "#090909", minHeight: "100vh" }}>
      <div style={{ maxWidth: "940px", margin: "0 auto", background: "#0f0f0f", padding: "32px", borderRadius: "24px", border: "1px solid rgba(255,215,0,0.12)", boxShadow: "0 24px 60px rgba(0,0,0,0.35)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "18px", marginBottom: "28px" }}>
          <div>
            <div style={{ color: "#ffd760", fontSize: "1rem", letterSpacing: "0.35em", fontWeight: 700, marginBottom: "8px" }}>STS LUXURY JEWELLERS</div>
            <h1 style={{ color: "#ffffff", fontSize: "2rem", margin: 0 }}>Invoice</h1>
            <p style={{ color: "#c0b07c", fontSize: "0.95rem", margin: "10px 0 0" }}>Premium jewellery invoice for your order</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 16px", borderRadius: "999px", border: "1px solid rgba(255,215,0,0.25)", color: "#ffd760", fontWeight: 700, fontSize: "0.85rem", background: "rgba(255,215,0,0.08)" }}>
              {order.status ? order.status.toUpperCase() : "PENDING"}
            </div>
            <div style={{ marginTop: "16px", color: "#bbb", fontSize: "0.9rem" }}>
              <div>Invoice ID: <strong style={{ color: "#fff" }}>{order.id || "N/A"}</strong></div>
              <div style={{ marginTop: "6px" }}>Date: <strong style={{ color: "#fff" }}>{order.created_at ? new Date(order.created_at).toLocaleDateString() : new Date().toLocaleDateString()}</strong></div>
            </div>
            {backgroundNotification && (
              <div style={{ marginTop: "14px", color: "#9aceff", fontSize: "0.84rem", lineHeight: 1.5 }}>
                Your invoice is ready. You can send order details via WhatsApp using the button below.
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "22px", marginBottom: "28px" }}>
          <div style={{ padding: "24px", borderRadius: "20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,215,0,0.12)" }}>
            <div style={{ color: "#ffd760", fontSize: "0.85rem", letterSpacing: "0.14em", marginBottom: "16px" }}>CUSTOMER INFORMATION</div>
            <div style={{ display: "grid", gap: "12px", color: "#ddd", fontSize: "0.95rem" }}>
              <div><span style={{ color: "#bbb" }}>Full Name:</span> <strong>{customerName}</strong></div>
              <div><span style={{ color: "#bbb" }}>Phone:</span> <strong>{customerPhone}</strong></div>
              <div><span style={{ color: "#bbb" }}>Email:</span> <strong>{customerEmail}</strong></div>
              <div><span style={{ color: "#bbb" }}>Address:</span> <strong>{customerAddress}</strong></div>
              <div><span style={{ color: "#bbb" }}>Location:</span> <strong>{customerCity}{customerCity && customerPincode ? ", " : ""}{customerPincode}</strong></div>
            </div>
          </div>

          <div style={{ padding: "24px", borderRadius: "20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,215,0,0.12)" }}>
            <div style={{ color: "#ffd760", fontSize: "0.85rem", letterSpacing: "0.14em", marginBottom: "16px" }}>PRODUCT INFORMATION</div>
            <div style={{ display: "grid", gap: "12px", color: "#ddd", fontSize: "0.95rem" }}>
              <div><span style={{ color: "#bbb" }}>Product Name:</span> <strong>{productName}</strong></div>
              <div><span style={{ color: "#bbb" }}>Category:</span> <strong>{productCategory}</strong></div>
              <div><span style={{ color: "#bbb" }}>Metal Type:</span> <strong>{productMetalType}</strong></div>
              <div><span style={{ color: "#bbb" }}>Weight:</span> <strong>{productWeight} g</strong></div>
              <div><span style={{ color: "#bbb" }}>Quantity:</span> <strong>{productQuantity}</strong></div>
            </div>
          </div>
        </div>

        <div style={{ padding: "26px", borderRadius: "20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,215,0,0.12)", marginBottom: "28px" }}>
          <div style={{ color: "#ffd760", fontSize: "0.85rem", letterSpacing: "0.14em", marginBottom: "18px" }}>PRICING BREAKDOWN</div>
          <div style={{ display: "grid", gap: "14px", color: "#ddd", fontSize: "0.95rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Rate per gram</span><strong>₹{productRate.toLocaleString()}</strong></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Subtotal</span><strong>₹{productSubtotal.toLocaleString()}</strong></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>GST / Extra charges</span><strong>₹{productGst.toLocaleString()}</strong></div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "16px", borderTop: "1px solid rgba(255,215,0,0.15)", fontSize: "1.05rem", color: "#ffd760", fontWeight: 700 }}>
              <span>Final Total Amount</span><strong>₹{productTotal.toLocaleString()}</strong></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Payment Method</span><strong>{paymentMethod}</strong></div>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "14px", marginTop: "18px" }}>
          <button
            type="button"
            onClick={downloadInvoice}
            style={{
              padding: "12px 20px",
              borderRadius: "999px",
              border: "1px solid rgba(255,215,0,0.18)",
              background: "rgba(255,215,0,0.12)",
              color: "#ffd760",
              cursor: "pointer",
              fontWeight: 700,
              minWidth: "220px"
            }}
          >
            Download Bill / Print
          </button>

          <button
            type="button"
            onClick={sendInvoiceWhatsapp}
            style={{
              padding: "12px 20px",
              borderRadius: "999px",
              border: "1px solid rgba(33, 214, 135, 0.18)",
              background: "rgba(33, 214, 135, 0.12)",
              color: "#b8ffe1",
              cursor: "pointer",
              fontWeight: 700,
              minWidth: "220px"
            }}
          >
            📱 Send Order on WhatsApp
          </button>
        </div>

        <div style={{ textAlign: "center", color: "#bbb", fontSize: "0.95rem", paddingTop: "20px", borderTop: "1px solid rgba(255,215,0,0.12)" }}>
          <p style={{ margin: 0 }}>STS Luxury Jewellers – Thank you for your purchase</p>
        </div>

        <div style={{ marginTop: "18px", color: "#777", fontSize: "0.8rem", textAlign: "center" }}>
          <p style={{ margin: 0 }}>Generated for business use and ready for PDF export.</p>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: #090909 !important; }
          button { display: none !important; }
          div[style*="padding: 20px"] { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
};

export default Invoice;
