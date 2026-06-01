import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { supabase } from "../services/supabase";
import "../styles/ProductDetails.css";

const parseWeightOptions = (weightText) => {
  if (!weightText || typeof weightText !== "string") return [1, 2, 5, 10];
  const matches = [...weightText.matchAll(/(\d+(?:\.\d+)?)(?=\s*g?)/gi)].map((match) => Number(match[1]));
  const unique = Array.from(new Set(matches)).filter((value) => !Number.isNaN(value));
  return unique.length ? unique.sort((a, b) => a - b) : [1, 2, 5, 10];
};

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [selectedWeight, setSelectedWeight] = useState(1);
  const [customWeight, setCustomWeight] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [notes, setNotes] = useState("");
  const [orderData, setOrderData] = useState(null);
  const [rate, setRate] = useState(null);
  const [rateLoading, setRateLoading] = useState(true);
  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsSort, setReviewsSort] = useState("latest");
  const [rating, setRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      const { data, error } = await supabase.from("products").select("*").eq("id", id).single();
      if (error) {
        console.error("Product fetch failed:", error);
        setErrorMessage("Unable to load product details.");
      } else {
        setProduct(data);
        const weights = parseWeightOptions(data?.weight);
        setSelectedWeight(weights[0] || 1);
      }
      setLoading(false);
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (!product) return;

    const fetchRate = async () => {
      const { data, error } = await supabase
        .from("metal_rates")
        .select("rate")
        .eq("metal_type", product.metal_type.toLowerCase())
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.log(error);
        setRateLoading(false);
        return;
      }

      setRate(data.rate);
      setRateLoading(false);
    };

    fetchRate();
  }, [product]);

  // Load reviews and average rating
  useEffect(() => {
    if (!product) return;
    let mounted = true;

    const loadReviews = async () => {
      setReviewsLoading(true);
      try {
        const { data, error } = await supabase
          .from("reviews")
          .select("*")
          .eq("product_id", product.id);

        if (error) {
          console.error("fetch reviews error:", error);
          if (mounted) {
            setReviews([]);
            setAverageRating(0);
          }
          return;
        }

        if (!mounted) return;
        const normalized = data || [];
        let sorted = normalized;
        if (reviewsSort === "highest") {
          sorted = [...normalized].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
        } else if (reviewsSort === "lowest") {
          sorted = [...normalized].sort((a, b) => Number(a.rating || 0) - Number(b.rating || 0));
        } else {
          sorted = [...normalized].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
        setReviews(sorted);

        if (normalized.length) {
          const avg = normalized.reduce((sum, r) => sum + Number(r.rating || 0), 0) / normalized.length;
          setAverageRating(Number(avg.toFixed(1)));
        } else {
          setAverageRating(0);
        }
      } catch (err) {
        console.error("fetch reviews error:", err);
        if (mounted) {
          setReviews([]);
          setAverageRating(0);
        }
      } finally {
        if (mounted) setReviewsLoading(false);
      }
    };

    loadReviews();
    return () => { mounted = false; };
  }, [product, reviewsSort]);

  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => setShowToast(false), 3800);
    return () => clearTimeout(timer);
  }, [showToast]);

  if (!product) {
    return <h2>Loading Product...</h2>;
  }

  const weightOptions = parseWeightOptions(product?.weight || "");
  const liveRate = Number(rate || 0);

  // Use custom weight if provided, otherwise use selected weight
  const appliedWeight = Number(customWeight) > 0 ? customWeight : selectedWeight;
  
  // Clean weight by removing "g" and parsing as number
  const cleanWeight = Number(
    String(appliedWeight).replace("g", "").trim()
  ) || 0;

  const subtotal = cleanWeight * liveRate;
  const gst = subtotal * 0.03;
  const finalTotal = subtotal + gst;

  console.log("RATE =", liveRate);
  console.log("RAW WEIGHT =", product?.weight);
  console.log("CLEAN WEIGHT =", cleanWeight);
  console.log("SUBTOTAL =", subtotal);

  async function placeOrder() {
    // ✅ INVENTORY VALIDATION - Check stock before allowing order
    if (!product.stock_qty || product.stock_qty < 1) {
      setErrorMessage("❌ Insufficient stock available. This item is currently out of stock.");
      return;
    }

    setErrorMessage("");
    setOrderLoading(true);

    const orderData = {
      customer_name: customerName,
      customer_email: customerEmail,
      phone: phone,
      address: address,
      city: city,
      pincode: pincode,
      product_id: product?.id,
      product_name: product?.name || product?.title || product?.product_name || "Premium Item",
      category: product?.category || product?.category_name || "Jewelry",
      making_charge: Number(product?.making_charge || 0),
      wastage: Number(product?.wastage || 0),
      quantity: 1,
      weight: cleanWeight,
      rate: liveRate,
      subtotal: subtotal,
      gst: gst,
      total: finalTotal,
      final_total: finalTotal,
      payment_method: paymentMethod,
      special_notes: notes,
      status: "Pending",
      is_read: false
    };

    console.log("📝 ORDER DATA BEFORE SAVE:", orderData);
    console.log("   - Address:", address);
    console.log("   - Product Name:", product?.name || product?.title || product?.product_name || "NOT FOUND");
    console.log("   - Category:", product?.category || product?.category_name);
    console.log("   - Product object:", product);

    const { data, error } = await supabase
      .from("orders")
      .insert([orderData])
      .select()
      .single();

    if (error) {
      console.log(error);
      setOrderLoading(false);
      setErrorMessage(error.message);
      alert(error.message);
      return;
    }

    // ✅ AUTO-REDUCE STOCK BY 1 AFTER ORDER SUCCESS
    console.log("🔄 Reducing stock for product:", product?.id);
    const newStock = Math.max(0, (product?.stock_qty || 0) - 1);
    
    const { error: stockUpdateError } = await supabase
      .from("products")
      .update({ stock_qty: newStock })
      .eq("id", product?.id);
    
    if (stockUpdateError) {
      console.warn("⚠️ Stock update failed (order still saved):", stockUpdateError);
    } else {
      console.log("✅ Stock updated: " + (product?.stock_qty || 0) + " → " + newStock);
      // Update local product state to reflect new stock
      setProduct({ ...product, stock_qty: newStock });
      
      // Alert when stock becomes 99 (1 order left)
      if (newStock === 99) {
        alert(`⚠️ Low Stock Alert!\n\n${product?.name} now has only 1 order remaining (99 units left).`);
        console.warn("⚠️ LOW STOCK ALERT: Product has 99 units remaining!");
      }
    }

    console.log("✅ ORDER INSERTED:", data);
    console.log("   - Returned Address:", data?.address);
    console.log("   - Returned Product Name:", data?.product_name);
    console.log("   - Returned Category:", data?.category);

    setOrderData(data);
    setSuccessMessage("Order placed successfully. Redirecting to invoice...");
    setShowToast(true);
    setOrderLoading(false);

    navigate("/invoice", {
      state: {
        order: data,
        product,
        backgroundNotification: true,
      },
    });

    console.log("🚀 NAVIGATING TO INVOICE with order:", data);

    // Send notification to Supabase
    try {
      await supabase.from("notifications").insert([
        {
          title: "New Order",
          message: `${order.customer_name} ordered ${order.product_name}`,
          is_read: false,
        },
      ]);
      console.log("✅ Notification stored in Supabase");
    } catch (notificationError) {
      console.warn("⚠️ Notification insert failed:", notificationError);
    }
  }

  const downloadInvoice = () => {
    if (!product) return;

    const invoiceOrder = orderData || {
      customer_name: customerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      pincode: pincode.trim(),
      category: product.category || product.category_name || product.name,
      weight: cleanWeight,
      rate: liveRate,
      subtotal,
      gst,
      total: finalTotal,
    };

    const invoiceHtml = `
      <html>
        <head>
          <title>STS Invoice</title>
          <style>
            body { margin: 0; padding: 24px; font-family: Arial, sans-serif; color: #fff; background: #070707; }
            .invoice-container { max-width: 820px; margin: 0 auto; padding: 30px; border-radius: 24px; background: rgba(12, 12, 12, 0.98); border: 1px solid rgba(255,215,0,0.18); }
            .invoice-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
            .invoice-title { color: #ffd760; font-size: 1.15rem; letter-spacing: 2px; font-weight: 700; }
            .invoice-section { margin-bottom: 22px; }
            .section-title { color: #ffd760; letter-spacing: 1.5px; margin-bottom: 12px; text-transform: uppercase; font-size: 0.85rem; }
            .details-grid { display: grid; gap: 12px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .card { padding: 16px; border-radius: 18px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,215,0,0.12); }
            .card strong { display: block; margin-top: 8px; font-size: 1rem; color: #fff; }
            .totals { border-radius: 18px; overflow: hidden; }
            .totals-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; background: rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,215,0,0.08); }
            .totals-row:last-child { border-bottom: none; background: rgba(255,215,0,0.12); }
            .totals-row span { color: #bdbdbd; }
            .totals-row strong { color: #fff; }
            .invoice-footer { margin-top: 24px; font-size: 0.9rem; color: rgba(255,255,255,0.72); }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="invoice-header">
              <div>
                <div class="invoice-title">STS Gold & Silvers</div>
                <div style="margin-top: 8px; color: #bdbdbd;">Order Invoice</div>
              </div>
              <div style="text-align: right; color: #bdbdbd;">${new Date().toLocaleString()}</div>
            </div>
            <div class="invoice-section">
              <div class="section-title">Customer</div>
              <div class="details-grid">
                <div class="card"><span>Name</span><strong>${invoiceOrder.customer_name || "Guest"}</strong></div>
                <div class="card"><span>Email</span><strong>${invoiceOrder.customer_email || invoiceOrder.email || "-"}</strong></div>
                <div class="card"><span>Phone</span><strong>${invoiceOrder.phone || "-"}</strong></div>
                <div class="card"><span>Delivery</span><strong>${invoiceOrder.address || "-"}</strong></div>
                <div class="card"><span>Location</span><strong>${invoiceOrder.city || "-"}, ${invoiceOrder.pincode || "-"}</strong></div>
              </div>
            </div>
            <div class="invoice-section">
              <div class="section-title">Order Details</div>
              <div class="details-grid">
                <div class="card"><span>Product</span><strong>${product.name}</strong></div>
                <div class="card"><span>Category</span><strong>${invoiceOrder.category || product.category || product.category_name || "-"}</strong></div>
                <div class="card"><span>Weight</span><strong>${invoiceOrder.weight || cleanWeight} g</strong></div>
                <div class="card"><span>Rate</span><strong>₹${invoiceOrder.rate ? Number(invoiceOrder.rate).toLocaleString() : "0"}/g</strong></div>
              </div>
            </div>
            <div class="invoice-section totals">
              <div class="totals-row"><span>Subtotal</span><strong>₹${Number(invoiceOrder.subtotal || 0).toLocaleString()}</strong></div>
              <div class="totals-row"><span>GST (3%)</span><strong>₹${Number(invoiceOrder.gst || 0).toLocaleString()}</strong></div>
              <div class="totals-row"><span>Total</span><strong>₹${Number(invoiceOrder.total || 0).toLocaleString()}</strong></div>
            </div>
            <div class="invoice-footer">This bill is generated by STS Gold & Silvers order system. Use browser print to save as PDF.</div>
          </div>
        </body>
      </html>
    `;

    const invoiceWindow = window.open("", "_blank");
    if (invoiceWindow) {
      invoiceWindow.document.write(invoiceHtml);
      invoiceWindow.document.close();
      invoiceWindow.focus();
      invoiceWindow.print();
    }
  };

const submitReview = async () => {

  const { data: authData } =
    await supabase.auth.getUser();

  const user = authData?.user;

  if (!user) {
    alert("Please login first.");
    return;
  }

  if (!rating) {
    alert("Please select rating.");
    return;
  }

  const { error } = await supabase
    .from("reviews")
    .insert([
      {
        product_id: product.id,
        user_id: user.id,
        customer_name: user.user_metadata?.full_name || "Customer",
        rating: Number(rating),
        review: reviewText || ""
      }
    ]);

  if (error) {
    console.error("FULL REVIEW ERROR:", error);
    alert(error.message);
    return;
  }

  alert("Review submitted successfully!");
};

  if (loading) {
    return (
      <div className="product-details-page">
        <Navbar />
        <div className="details-loading">Loading product information...</div>
      </div>
    );
  }

  console.log("PRODUCT =", product);
  console.log("RATE =", rate);

  return (
    <div className="product-details-page">
      <Navbar />

      {orderLoading && (
        <div className="processing-overlay">
          <div className="processing-modal">
            <h3>Processing Your Order</h3>
            <p>Your invoice will open immediately.</p>
            <div className="processing-spinner" />
          </div>
        </div>
      )}

      {showToast && (
        <div className="success-toast">
          <div className="toast-box">
            <div className="toast-icon">✓</div>
            <div className="toast-content">
              <p>Order Placed Successfully</p>
              <span>Your order is now being processed.</span>
            </div>
          </div>
        </div>
      )}

      <div className="details-hero">
        <div className="container">
          <button className="details-back" onClick={() => navigate(-1)}>
            ← Back to Collection
          </button>
          <div className="details-badge">Premium Jewelry</div>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
        </div>
      </div>

      <div className="details-body">
        <div className="container">
          <div className="details-grid">
            <section className="details-left glass-panel">
              <div className="image-panel">
                <div className="main-image">
                  <img src={product.image_url} alt={product.name} />
                </div>
                <div className="thumbnail-row">
                  {[product.image_url, product.image_url, product.image_url].map((src, index) => (
                    <div className={`thumb-item ${index === 0 ? "active" : ""}`} key={index}>
                      <img src={src} alt={`${product.name} ${index + 1}`} />
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="details-right">
              <div className="details-info glass-panel">
                <div className="details-top">
                  <div>
                    <span className="premium-label">Premium Collection</span>
                    <h2>{product.name}</h2>
                    <p className="details-category">{product.category_name || product.category || product.name || "Luxury"} Collection</p>
                  </div>
                  <div className="price-block">
                    <span className="price-label">Today's Live Rate</span>
                    <strong>
                      {rateLoading ? "Loading Rate..." : rate ? `₹${rate}/g` : "Rate unavailable"}
                    </strong>
                  </div>
                </div>

                <div className="product-summary">
                  <div>
                    <span>Category</span>
                    <strong>{product.category_name || product.category || product.name}</strong>
                  </div>
                  <div>
                    <span>Available Weights</span>
                    <strong>{weightOptions.map((weight) => `${weight}g`).join(" / ")}</strong>
                  </div>
                  <div>
                    <span>Stock Available</span>
                    <strong>{product.stock_qty || 0} units</strong>
                  </div>
                </div>

                {product.stock_qty && product.stock_qty < 5 && (
                  <div className="low-stock-alert">
                    ⚠️ <strong>Low Stock Alert:</strong> Only {product.stock_qty} {product.stock_qty === 1 ? "unit" : "units"} remaining!
                  </div>
                )}


                <p className="details-copy">{product.description}</p>
              </div>

              <section className="order-panel glass-panel">
                <div className="order-panel-header">
                  <h3>Luxury Order</h3>
                  <span>Choose weight, review totals, and place your order.</span>
                </div>

                <form className="order-form" onSubmit={(e) => { e.preventDefault(); placeOrder(); }}>
                  {errorMessage && <div className="form-error">{errorMessage}</div>}
                  {successMessage && <div className="form-success">{successMessage}</div>}

                  <div className="form-row">
                    <label>
                      Customer Name
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Full name"
                        required
                      />
                    </label>
                    <label>
                      Email
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="Email address"
                        required
                      />
                    </label>
                    <label>
                      Phone
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Phone number"
                        required
                      />
                    </label>
                  </div>

                  <div className="form-row">
                    <label>
                      City
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="City"
                        required
                      />
                    </label>
                    <label>
                      Pincode
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="Pincode"
                        required
                      />
                    </label>
                  </div>

                  <label>
                    Delivery Address
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street address, house number, apartment"
                      required
                    />
                  </label>

                  <label>
                    Select Weight
                    <select
                      value={selectedWeight}
                      onChange={(e) => {
                        setSelectedWeight(e.target.value);
                        setCustomWeight("");
                      }}
                    >
                      {weightOptions.map((weight) => (
                        <option key={weight} value={weight}>
                          {weight} g
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Or enter custom weight (grams)
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={customWeight}
                      onChange={(e) => setCustomWeight(e.target.value)}
                      placeholder="e.g. 2.5"
                    />
                  </label>

                  <label>
                    Payment Method
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      required
                    >
                      <option value="COD">Cash on Delivery</option>
                      <option value="UPI">UPI</option>
                      <option value="Card">Card Payment</option>
                    </select>
                  </label>

                  <label>
                    Notes
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any custom requests or delivery notes"
                      rows="3"
                    />
                  </label>

                  <div className="order-summary">
                    <div className="summary-row">
                      <p>Weight {cleanWeight} g</p>
                    </div>
                    <div className="summary-row">
                      <p>
                        Subtotal ₹{subtotal.toLocaleString()}
                      </p>
                    </div>
                    <div className="summary-row">
                      <p>
                        GST (3%) ₹{gst.toFixed(0)}
                      </p>
                    </div>
                    <div className="summary-row total-row">
                      <p>
                        Final Total ₹{finalTotal.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <button type="submit" className="order-button" disabled={orderLoading || rateLoading || !rate}>
                    {orderLoading ? "Placing Order..." : "Place Order"}
                  </button>

                  {successMessage && (
                    <div className="invoice-actions">
                      <button type="button" className="btn-invoice" onClick={downloadInvoice}>
                        Download Bill / Print
                      </button>
                    </div>
                  )}
                </form>
              </section>
              {/* Reviews Section */}
              <section className="reviews-panel glass-panel">
                <h3>Customer Reviews</h3>
                <div className="reviews-summary">
                  <div className="avg-rating">
                    <strong>⭐ {rating || averageRating} / 5</strong>
                    <div className="small-meta">({reviews.length || 0} Reviews)</div>
                  </div>
                  <div className="reviews-actions">
                    <label>Sort:</label>
                    <select value={reviewsSort} onChange={(e) => setReviewsSort(e.target.value)}>
                      <option value="latest">Latest</option>
                      <option value="highest">Highest Rated</option>
                      <option value="lowest">Lowest Rated</option>
                    </select>
                  </div>
                </div>

                <div className="submit-review">
                  <h4>Write a review</h4>
                  <div className="star-select">
                    {[1,2,3,4,5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={rating >= star ? "active-star" : ""}
                        onClick={() => setRating(star)}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                  <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Share your experience" />
                  <div className="review-actions">
                    <button onClick={submitReview} className="submit-review-btn">Submit Review</button>
                  </div>
                </div>

                <div className="reviews-list">
                  {reviewsLoading ? (
                    <p>Loading reviews...</p>
                  ) : reviews.length === 0 ? (
                    <p>No reviews yet. Be the first to review this piece.</p>
                  ) : (
                    reviews.map((r) => (
                      <div className="review-item" key={r.id}>
                        <div className="review-head">
                          <strong>{r.customer_name || r.user_name || r.user_id || 'Customer'}</strong>
                          <div className="review-rating">{Array.from({length: r.rating}).map((_,i)=>(<span key={i}>⭐</span>))}</div>
                        </div>
                        <div className="review-body">{r.review || r.review_text}</div>
                        <div className="review-date">{new Date(r.created_at).toLocaleDateString()}</div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;
