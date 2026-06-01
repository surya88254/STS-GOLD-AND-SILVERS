import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import CategoryManager from "../components/CategoryManager";
import AdminPromoManager from "../components/AdminPromoManager";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Toaster, toast } from "react-hot-toast";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "../styles/admin.css";

function AdminDashboard(){
  const [activeTab, setActiveTab] = useState("products");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [productMetalType, setProductMetalType] = useState("Gold");
  const [categories, setCategories] = useState([]);
  const [finalPrice, setFinalPrice] = useState(0);
  const [metalRate, setMetalRate] = useState(0);
  const [rates, setRates] = useState({});
  const [weight, setWeight] = useState("");
  const [description, setDescription] = useState("");
  const [makingCharge, setMakingCharge] = useState(0);
  const [wastage, setWastage] = useState(0);
  const [stock, setStock] = useState(0);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ total: 0, gold: 0, silver: 0 });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [goldRate, setGoldRate] = useState("");
  const [silverRate, setSilverRate] = useState("");
  const [rateStatus] = useState("");
  const [ratesLoading] = useState(false);

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderActionLoading, setOrderActionLoading] = useState(false);
  const [orderStatusMessage, setOrderStatusMessage] = useState("");

  const [todayOrders, setTodayOrders] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [topSellingProduct, setTopSellingProduct] = useState({ name: "-", count: 0 });
  const [pendingOrders, setPendingOrders] = useState(0);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [metalSales, setMetalSales] = useState([]);
  const [monthlyOrders, setMonthlyOrders] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const [customRequests, setCustomRequests] = useState([]);
  const [, setCustomLoading] = useState(false);
  const [customStatusMessage, setCustomStatusMessage] = useState("");
  const [, setCustomActionLoading] = useState(false);
  const activeTabRef = useRef(activeTab);
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const navigate = useNavigate();

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

  const getStatusSlug = (status) =>
    normalizeStatus(status).toLowerCase().replace(/\s+/g, "-");

  const getStatusBadge = (status) => {
    const slug = getStatusSlug(status);
    return `status status-${slug}`;
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout error:", error);
      }
    } catch (err) {
      console.error("Logout exception:", err);
    } finally {
      navigate("/login", { replace: true });
    }
  };

  const fetchProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          categories (
            name,
            metal_type
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Products fetch error:", error);
        return;
      }

      console.log("════════════════════════════════════");
      console.log("✅ ADMIN PRODUCTS FETCHED");
      console.log("════════════════════════════════════");
      console.log("📊 Total products:", data?.length || 0);
      
      const goldCount = data?.filter(p => p.metal_type?.toLowerCase() === 'gold').length || 0;
      const silverCount = data?.filter(p => p.metal_type?.toLowerCase() === 'silver').length || 0;
      
      console.log("   Gold products:", goldCount);
      console.log("   Silver products:", silverCount);
      console.log("════════════════════════════════════");
      
      // Log each product's metal type for verification
      data?.forEach(p => {
        console.log(`   ✓ ${p.name} → metal_type: "${p.metal_type}"`);
      });

      setProducts(data || []);
    } catch (err) {
      console.error("❌ Products fetch exception:", err);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    const { data } = await supabase.from("products").select("*");
    if (data) {
      const gold = data.filter((p) => p.category === "Gold").length;
      const silver = data.filter((p) => p.category === "Silver").length;
      setStats({ total: data.length, gold, silver });
    }
  }, []);

  const calculatePrice = (product) => {
    const metalRate =
      product.metal_type?.toLowerCase() === "gold"
        ? rates.gold
        : rates.silver;

    const basePrice = Number(product.weight) * Number(metalRate);
    const makingCharge = Number(product.making_charge || 0);
    const wastageAmount = (basePrice * Number(product.wastage || 0)) / 100;

    return Math.round(basePrice + makingCharge + wastageAmount);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("metal_type", productMetalType.toLowerCase());

    if (error) {
      console.log(error);
      setCategories([]);
      return;
    }

    setCategories(data || []);
  };

  const fetchRates = async () => {
    const { data, error } = await supabase.from("metal_rates").select("*");

    if (error) {
      console.log(error);
      return;
    }

    const goldRate = data.find((r) => r.metal_type === "gold")?.rate || 0;
    const silverRate = data.find((r) => r.metal_type === "silver")?.rate || 0;

    setRates({ gold: goldRate, silver: silverRate });
    setGoldRate(goldRate);
    setSilverRate(silverRate);
  };

  const fetchMetalRate = async () => {
    try {
      const { data, error } = await supabase
        .from("metal_rates")
        .select("*")
        .eq("metal_type", productMetalType.toLowerCase())
        .single();

      if (error) {
        console.log(error);
        return;
      }

      setMetalRate(data.rate || 0);
    } catch (err) {
      console.log(err);
    }
  };

  const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString()}`;

  const buildLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        key: date.toISOString().split("T")[0],
      });
    }
    return days;
  };

  const buildLast12Months = () => {
    const months = [];
    const current = new Date();
    for (let i = 11; i >= 0; i -= 1) {
      const date = new Date(current.getFullYear(), current.getMonth() - i, 1);
      months.push({
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        label: date.toLocaleDateString("en-US", { month: "short" }),
      });
    }
    return months;
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const tomorrowStart = new Date(todayStart);
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);

      const { data: todayData, error: todayError, count: todayCount } = await supabase
        .from("orders")
        .select("id, final_total", { count: "exact" })
        .gte("created_at", todayStart.toISOString())
        .lt("created_at", tomorrowStart.toISOString());

      if (todayError) {
        console.error("Today's orders fetch error:", todayError);
      } else {
        setTodayOrders(todayCount || 0);
        setTodayRevenue(
          (todayData || []).reduce((sum, item) => sum + Number(item.final_total || 0), 0)
        );
      }

      const { data: allOrders, error: allOrdersError } = await supabase
        .from("orders")
        .select(
          `id, created_at, final_total, status, customer_email, customer_name, product_name, product_id, product, metal_type`
        )
        .order("created_at", { ascending: true });

      if (allOrdersError) {
        console.error("All orders fetch for analytics error:", allOrdersError);
        return;
      }

      const customerSet = new Set();
      const productCounts = {};
      const metalCounts = { gold: 0, silver: 0, other: 0 };
      const revenueByDay = buildLast7Days().reduce((acc, day) => {
        acc[day.key] = 0;
        return acc;
      }, {});
      const orderCountsByMonth = buildLast12Months().reduce((acc, month) => {
        acc[month.key] = 0;
        return acc;
      }, {});

      (allOrders || []).forEach((order) => {
        const customerKey =
          (order.customer_email || order.customer_name || "").trim().toLowerCase();
        if (customerKey) customerSet.add(customerKey);

        const productKey =
          order.product_name || order.product?.name || order.product?.product_name || "Unknown Product";
        productCounts[productKey] = (productCounts[productKey] || 0) + 1;

        const totalValue = Number(order.final_total || order.total || order.price || 0);
        const createdAtKey = order.created_at ? order.created_at.split("T")[0] : null;
        if (createdAtKey && revenueByDay[createdAtKey] !== undefined) {
          revenueByDay[createdAtKey] += totalValue;
        }

        const monthKey = order.created_at
          ? `${new Date(order.created_at).getFullYear()}-${String(
              new Date(order.created_at).getMonth() + 1
            ).padStart(2, "0")}`
          : null;
        if (monthKey && orderCountsByMonth[monthKey] !== undefined) {
          orderCountsByMonth[monthKey] += 1;
        }

        const metalValue =
          (order.product?.metal_type || order.metal_type || "").toString().toLowerCase();
        if (metalValue === "gold") metalCounts.gold += 1;
        else if (metalValue === "silver") metalCounts.silver += 1;
        else metalCounts.other += 1;
      });

      const topProductEntry = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0] || ["-", 0];
      setTopSellingProduct({ name: topProductEntry[0], count: topProductEntry[1] });
      setTotalCustomers(customerSet.size);

      const last7Trend = buildLast7Days().map((day) => ({
        date: day.label,
        revenue: Math.round(revenueByDay[day.key] || 0),
      }));
      setRevenueTrend(last7Trend);

      const salesData = [
        { name: "Gold", value: metalCounts.gold },
        { name: "Silver", value: metalCounts.silver },
      ].filter((item) => item.value >= 0);
      setMetalSales(salesData);

      const monthlyData = buildLast12Months().map((month) => ({
        month: month.label,
        orders: orderCountsByMonth[month.key] || 0,
      }));
      setMonthlyOrders(monthlyData);

      const { count: pendingCount, error: pendingError } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "Pending");
      if (pendingError) {
        console.error("Pending orders count error:", pendingError);
      } else {
        setPendingOrders(pendingCount || 0);
      }
    } catch (error) {
      console.error("Analytics fetch exception:", error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);

    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (ordersError) {
        console.error("Orders fetch error:", ordersError);
        setOrders([]);
        setOrdersLoading(false);
        return;
      }

      const productIds = Array.from(
        new Set(
          (ordersData || [])
            .map((order) => order.product_id)
            .filter(Boolean)
        )
      );

      let productsById = {};
      if (productIds.length > 0) {
        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select("id, name, category, image_url, price, weight")
          .in("id", productIds);

        if (productsError) {
          console.error("Products fetch for orders error:", productsError);
        } else {
          productsById = (productsData || []).reduce((acc, item) => {
            acc[item.id] = item;
            return acc;
          }, {});
        }
      }

      const enrichedOrders = (ordersData || []).map((order) => {
        const product = productsById[order.product_id] || order.products || order.product || {};
        const productName =
          order.product_name ||
          product.name ||
          "Unknown Product";
        const productImage =
          product.image_url ||
          "https://via.placeholder.com/60";
        const productPrice = Number(product.price || order.rate || 0);
        const normalizedStatus = normalizeStatus(order.status);

        return {
          ...order,
          product_name: productName,
          product_image: productImage,
          price: productPrice,
          product_weight: order.weight || product.weight || "",
          product,
          status: normalizedStatus,
        };
      });

      setOrders(enrichedOrders);
    } catch (error) {
      console.error("Orders fetch exception:", error);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchCustomRequests = async () => {
    setCustomLoading(true);

    const { data, error } = await supabase
      .from("custom_design_requests")
      .select("*")
      .order("created_at", { ascending: false });

    console.log(data);
    console.log(error);

    if (!error) {
      setCustomRequests(data || []);
    }

    setCustomLoading(false);
  };

  const fetchUnreadOrderCount = async () => {
    const { count, error } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("is_read", false);

    if (error) {
      console.error("Unread orders count error:", error);
      return;
    }

    console.log("Unread orders count:", count || 0);
  };

  const markOrdersRead = async () => {
    const { error } = await supabase
      .from("orders")
      .update({ is_read: true })
      .eq("is_read", false);

    if (error) {
      console.error("Mark orders read error:", error);
    }

    await fetchUnreadOrderCount();
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio(
        "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAIAESsAACJWAAACABAAZGF0YQAAAAA="
      );
      audio.play().catch(() => {});
    } catch (err) {
      console.error("Notification sound failed:", err);
    }
  };

  const handleNewOrderNotification = async (order) => {
    if (!order) return;

    toast.success(
      `🔔 New Order Received!\n\nCustomer: ${order.customer_name || "Unknown"}\nProduct: ${order.product_name || order.product || "Unknown Product"}\nAmount: ₹${order.amount || order.total || order.price || 0}\nStatus: ${order.status || "Pending"}`,
      {
        duration: 5000,
        style: {
          background: "#0f0b05",
          color: "#fff",
          border: "1px solid rgba(255, 215, 0, 0.35)",
          boxShadow: "0 12px 35px rgba(0,0,0,0.25)",
        },
      }
    );

    playNotificationSound();
    await fetchUnreadOrderCount();

    if (activeTabRef.current === "orders") {
      fetchOrders();
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchAnalytics();
    fetchUnreadOrderCount();
    fetchCustomRequests();
    fetchRates();
    fetchMetalRate();
    fetchCategories();
  }, []);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    const channel = supabase
      .channel("orders-live")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders"
        },
        (payload) => {
          handleNewOrderNotification(payload.new);
          fetchAnalytics();
          fetchUnreadOrderCount();
          if (activeTabRef.current === "orders") fetchOrders();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders"
        },
        () => {
          fetchAnalytics();
          fetchUnreadOrderCount();
          if (activeTabRef.current === "orders") fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (activeTab === "orders") {
      markOrdersRead();
      fetchOrders();
    }
  }, [activeTab]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchMetalRate();
    setCategory(""); // Reset category when metal type changes
    setSelectedCategoryId("");
    fetchCategories();
    console.log("🔄 Reset category dropdown for metal type:", productMetalType);
  }, [productMetalType]);

  useEffect(() => {
    const weightValue = parseFloat(weight) || 0;
    const makingValue = parseFloat(makingCharge) || 0;
    const wastageValue = parseFloat(wastage) || 0;

    const metalCost = metalRate * weightValue;

    const wastageAmount = (metalCost * wastageValue) / 100;

    const total = metalCost + makingValue + wastageAmount;

    // Update price as derived state
    setFinalPrice(total || 0);
  }, [weight, makingCharge, wastage, metalRate]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const uploadProduct = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!image) {
      alert("Select Image");
      setLoading(false);
      return;
    }

    try {
      const fileName = `${Date.now()}-${image.name}`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, image);

      if (uploadError) throw uploadError;

      const imageUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${fileName}`;
      const stockQty = parseInt(stock, 10) || 0;

      const productData = {
        name,
        description,
        metal_type: productMetalType.toLowerCase(),
        category_id: selectedCategoryId,
        weight: parseFloat(weight) || 0,
        price: finalPrice,
        making_charge: makingCharge,
        wastage: wastage,
        stock_qty: stockQty,
        image_url: imageUrl,
      };

      console.log("SELECTED CATEGORY ID:", selectedCategoryId);
      console.log("════════════════════════════════════");
      console.log("📦 INSERTING PRODUCT");
      console.log("════════════════════════════════════");
      console.log("  Product Name:", name);
      console.log("  Metal Type:", productMetalType, "→ stored as:", productMetalType.toLowerCase());
      console.log("  Category:", category);
      console.log("  Weight:", weight);
      console.log("  Price:", finalPrice);
      console.log("════════════════════════════════════");
      console.log("Full Product Data:", productData);
      console.log("════════════════════════════════════");

      const { data: insertedData, error } = await supabase.from("products").insert([productData]).select();

      if (error) throw error;

      console.log("✅ PRODUCT SAVED SUCCESSFULLY");
      console.log("   ID:", insertedData?.[0]?.id);
      console.log("   Name:", insertedData?.[0]?.name);
      console.log("   Metal Type:", insertedData?.[0]?.metal_type);
      console.log("   Category ID:", insertedData?.[0]?.category_id);

      setSuccessMsg("✓ Product Added Successfully!");
      setName("");
      setCategory("");
      setSelectedCategoryId("");
      setProductMetalType("Gold");
      setWeight("");
      setDescription("");
      setMakingCharge(0);
      setWastage(0);
      setStock(0);
      setImage(null);
      setImagePreview(null);

      setTimeout(() => setSuccessMsg(""), 3000);
      await fetchProducts();
      await fetchStats();
    } catch (error) {
      console.error("❌ Error inserting product:", error);
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    if (window.confirm("Are you sure?")) {
      try {
        const { error } = await supabase.from("products").delete().eq("id", id);
        if (error) throw error;
        await fetchProducts();
        await fetchStats();
      } catch (error) {
        alert("Error: " + error.message);
      }
    }
  };

  const saveRates = async () => {
    const { error } = await supabase
      .from("metal_rates")
      .upsert(
        [
          {
            metal_type: "gold",
            rate: goldRate,
          },
          {
            metal_type: "silver",
            rate: silverRate,
          },
        ],
        {
          onConflict: "metal_type",
        }
      );

    if (error) {
      console.log(error);
      alert(error.message);
      return;
    }

    alert("Rates Saved Successfully");
    fetchRates();
  };

  const handleUpdateOrderStatus = async (orderId, nextStatus) => {
    setOrderActionLoading(true);
    setOrderStatusMessage("");

    try {
      const normalized = normalizeStatus(nextStatus);
      const { error } = await supabase
        .from("orders")
        .update({ status: normalized })
        .eq("id", orderId);

      if (error) {
        console.error("Order status update failed:", error);
        setOrderStatusMessage(error.message || "Unable to update order status.");
        return;
      }

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: normalized } : order
        )
      );
      setOrderStatusMessage(`Order ${orderId.slice(0, 8)} updated to ${normalized}.`);
    } catch (error) {
      console.error("Order status update exception:", error);
      setOrderStatusMessage(error.message || "Unable to update status.");
    } finally {
      setOrderActionLoading(false);
      await fetchOrders();
    }
  };

  const handleDeleteOrder = async (orderId) => {
    const confirmed = window.confirm("Are you sure you want to permanently delete this order?");
    if (!confirmed) {
      console.log("Delete cancelled by user");
      return;
    }

    console.log("🗑️ ATTEMPTING TO DELETE ORDER:", orderId);
    setOrderActionLoading(true);
    setOrderStatusMessage("");

    try {
      // First, try to get the order to verify it exists
      const { data: existingOrder, error: fetchError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      console.log("Order exists?", existingOrder, "Fetch error:", fetchError);

      if (fetchError) {
        console.error("❌ Error fetching order:", fetchError);
        alert("❌ Order not found: " + fetchError.message);
        setOrderActionLoading(false);
        return;
      }

      // Now attempt delete
      console.log("🗑️ Executing delete for order:", orderId);
      const { error: deleteError, data: deleteData } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);

      console.log("Delete error:", deleteError);
      console.log("Delete data:", deleteData);

      if (deleteError) {
        console.error("❌ DELETE FAILED - Error:", deleteError);
        console.error("   Code:", deleteError.code);
        console.error("   Message:", deleteError.message);
        console.error("   Details:", deleteError.details);
        alert("❌ Delete failed!\n\nError: " + (deleteError.message || deleteError.code || "Unknown error"));
        setOrderStatusMessage("❌ " + (deleteError.message || "Unable to delete order."));
        setOrderActionLoading(false);
        return;
      }

      console.log("✅ ORDER DELETED SUCCESSFULLY");
      alert("✅ Order deleted successfully!");
      
      // Refresh orders list
      await fetchOrders();
      
      setOrderStatusMessage(`✅ Order deleted!`);
      if (selectedOrder?.id === orderId) {
        closeOrderModal();
      }
    } catch (err) {
      console.error("❌ EXCEPTION during delete:", err);
      alert("❌ Exception: " + err.message);
      setOrderStatusMessage("❌ " + err.message);
    } finally {
      setOrderActionLoading(false);
    }
  };

  const openOrderModal = async (order) => {
    console.log("🔍 Opening order modal for order ID:", order.id);
    console.log("📦 Order data from table:", order);
    
    setShowOrderModal(true);
    
    // Fetch full order details to ensure all fields are populated
    try {
      console.log("📡 Fetching full order details from Supabase...");
      const { data: fullOrder, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", order.id)
        .single();

      console.log("Response - Error:", error);
      console.log("Response - Full Order Data:", fullOrder);

      if (error) {
        console.error("❌ Error fetching full order details:", error);
        console.log("Falling back to basic order data from table");
        setSelectedOrder(order); // Fallback to the basic order
      } else {
        console.log("✅ Successfully loaded full order details");
        console.log("   Customer Name:", fullOrder?.customer_name);
        console.log("   Address:", fullOrder?.address);
        console.log("   Product Name:", fullOrder?.product_name);
        console.log("   Category:", fullOrder?.category);
        setSelectedOrder(fullOrder);
      }
    } catch (err) {
      console.error("❌ Exception in openOrderModal:", err);
      setSelectedOrder(order);
    }
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    setSelectedOrder(null);
  };

  const downloadInvoice = async () => {
    if (!selectedOrder) return;

    setInvoiceLoading(true);

    try {
      const invoiceElement = document.getElementById("invoice-content");
      
      if (!invoiceElement) {
        alert("Invoice template not found");
        setInvoiceLoading(false);
        return;
      }

      const canvas = await html2canvas(invoiceElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#fff"
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const invoiceFileName = `Invoice_${selectedOrder.id?.slice(0, 8)}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(invoiceFileName);
      console.log("✓ Invoice downloaded:", invoiceFileName);
    } catch (error) {
      console.error("Error generating invoice:", error);
      alert("Failed to generate invoice");
    } finally {
      setInvoiceLoading(false);
    }
  };

  return(

  <div className="admin-dashboard">
    <Toaster position="top-right" />
    <div className="admin-shell glass">
      <header className="dashboard-top-card">
        <div className="dashboard-top-copy">
          <span className="dashboard-chip">Admin Panel</span>
          <div>
            <h1>STS Admin Dashboard</h1>
            <p>Luxury jewelry operations in one premium boxed interface.</p>
          </div>
        </div>
        <button type="button" className="logout-button" onClick={handleLogout}>Logout</button>
      </header>

      <div className="dashboard-tabs">
        <button
          className={`tab-button ${activeTab === "products" ? "active" : ""}`}
          onClick={() => setActiveTab("products")}
        >
          Products
        </button>
        <button
          className={`tab-button ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          Orders
        </button>
        <button
          className={`tab-button ${activeTab === "analytics" ? "active" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          Analytics
        </button>
        <button
          className={`tab-button ${activeTab === "categories" ? "active" : ""}`}
          onClick={() => setActiveTab("categories")}
        >
          Categories
        </button>
        <button
          className={`tab-button ${activeTab === "promo" ? "active" : ""}`}
          onClick={() => setActiveTab("promo")}
        >
          📢 Promo Banners
        </button>
      </div>

      <div className="dashboard-content-panel glass">
        {activeTab === "analytics" && (
          <section className="analytics-section fade-in">
            <div className="stats-grid analytics-stats-grid">
              <div className="stat-card glass-gold">
                <div className="stat-icon">🛍️</div>
                <h3>Today's Orders</h3>
                <p className="stat-value">{analyticsLoading ? "..." : todayOrders}</p>
              </div>
              <div className="stat-card glass-gold">
                <div className="stat-icon">💰</div>
                <h3>Today's Revenue</h3>
                <p className="stat-value">{analyticsLoading ? "..." : formatCurrency(todayRevenue)}</p>
              </div>
              <div className="stat-card glass-gold">
                <div className="stat-icon">👥</div>
                <h3>Customers</h3>
                <p className="stat-value">{analyticsLoading ? "..." : totalCustomers}</p>
              </div>
              <div className="stat-card glass-gold">
                <div className="stat-icon">⏳</div>
                <h3>Pending Orders</h3>
                <p className="stat-value">{analyticsLoading ? "..." : pendingOrders}</p>
              </div>
              <div className="stat-card glass-gold">
                <div className="stat-icon">🔥</div>
                <h3>Top Product</h3>
                <p className="stat-value">{analyticsLoading ? "..." : topSellingProduct.name}</p>
                <span className="stat-subvalue">{analyticsLoading ? "" : `${topSellingProduct.count} Sales`}</span>
              </div>
            </div>

            <div className="charts-grid analytics-charts-grid">
              <div className="chart-card glass-gold">
                <div className="chart-header">
                  <h3>Revenue Trend — Last 7 Days</h3>
                  <p>Daily revenue performance</p>
                </div>
                <div className="chart-wrap">
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={revenueTrend} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid stroke="rgba(255,215,0,0.08)" strokeDasharray="4 4" />
                      <XAxis dataKey="date" tick={{ fill: "#f6e0a3", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(value) => `₹${value.toLocaleString()}`} tick={{ fill: "#f6e0a3", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: "#111", borderColor: "rgba(255,215,0,0.2)", color: "#fff" }} formatter={(value) => [`₹${value.toLocaleString()}`, "Revenue"]} />
                      <Legend wrapperStyle={{ color: "#f6e0a3" }} />
                      <Line type="monotone" dataKey="revenue" stroke="#ffd700" strokeWidth={3} dot={{ r: 4, fill: "#fff" }} activeDot={{ r: 6, fill: "#ffd700" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-card glass-gold">
                <div className="chart-header">
                  <h3>Gold vs Silver Sales</h3>
                  <p>Metal mix by order volume</p>
                </div>
                <div className="chart-wrap pie-wrap">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={metalSales} dataKey="value" nameKey="name" innerRadius={60} outerRadius={98} paddingAngle={4} stroke="rgba(255,215,0,0.12)">
                        {metalSales.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? "#ffd700" : "#b8a16f"} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#111", borderColor: "rgba(255,215,0,0.2)", color: "#fff" }} formatter={(value) => [value, "Orders"]} />
                      <Legend wrapperStyle={{ color: "#f6e0a3" }} verticalAlign="bottom" height={30} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === "promo" && (
          <section className="promo-section fade-in">
            <AdminPromoManager />
          </section>
        )}

        {activeTab === "products" && (
      <>
      {/* STATS SECTION */}
      <section className="stats-grid fade-in">
        <div className="stat-card glass-gold">
          <div className="stat-icon">📦</div>
          <h3>Total Products</h3>
          <p className="stat-value">{stats.total}</p>
        </div>
        <div className="stat-card glass-gold">
          <div className="stat-icon">✨</div>
          <h3>Gold Items</h3>
          <p className="stat-value">{stats.gold}</p>
        </div>
        <div className="stat-card glass-gold">
          <div className="stat-icon">💎</div>
          <h3>Silver Items</h3>
          <p className="stat-value">{stats.silver}</p>
        </div>
        <div className="stat-card glass-gold">
          <div className="stat-icon">📈</div>
          <h3>Latest Rates</h3>
          <p className="stat-value">{ratesLoading ? "..." : `G:${goldRate || "-"} / S:${silverRate || "-"}`}</p>
        </div>
      </section>

      {/* CONTENT GRID */}
      <div className="admin-content">
        {/* LEFT PANEL */}
        <section className="form-section admin-card glass-gold fade-in">
          <div className="section-header">
            <h2>Add New Product</h2>
            <p>Upload premium jewelry to your collection</p>
          </div>

          {successMsg && <div className="success-msg">{successMsg}</div>}

          <form onSubmit={uploadProduct} className="product-form">
              <div className="form-group">
                <label>Metal Type</label>
                <select
                  value={productMetalType}
                  onChange={(e) => {
                    console.log("🔄 METAL TYPE CHANGED:", e.target.value);
                    setProductMetalType(e.target.value);
                  }}
                >
                  <option value="Gold">Gold</option>
                  <option value="Silver">Silver</option>
                </select>
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const cat = categories.find(
                      (c) => c.id?.toString() === selectedId
                    );

                    setSelectedCategoryId(selectedId);
                    setCategory(cat?.name || "");
                  }}
                >
                  <option value="">Select Category</option>
                  {categories.map((categoryItem) => (
                    <option key={categoryItem.id} value={categoryItem.id}>
                      {categoryItem.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Weight</label>
                <input
                  type="text"
                  placeholder="e.g., 5g, 10g"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Stock Qty</label>
                <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Making Charge (₹)</label>
                <input type="number" value={makingCharge} onChange={(e) => setMakingCharge(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Wastage (%)</label>
                <input type="number" value={wastage} onChange={(e) => setWastage(e.target.value)} />
              </div>

            <div className="form-group full-width">
              <label>FINAL PRICE (AUTO)</label>
              <input value={`₹${finalPrice.toFixed(2)}`} readOnly />
            </div>

            <div className="form-group full-width">
              <label>Description</label>
              <textarea
                placeholder="Product description and details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="4"
              />
            </div>

            <div className="form-group full-width image-upload-panel product-image-group">
              <label>Product Image</label>
              <div className="image-upload">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  required
                />
                {imagePreview && (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview" />
                  </div>
                )}
              </div>
            </div>

            <button type="submit" className="submit-btn add-product-btn" disabled={loading}>
              {loading ? "Uploading..." : "Add Product"}
            </button>
          </form>

          <div className="section-divider"></div>

          <div className="rates-section rate-manager">
            <div className="section-header">
              <h2>Metal Rate Manager</h2>
              <p>Update today's gold and silver rates instantly.</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveRates();
              }}
              className="product-form"
            >
              <div className="rate-grid">
                <div className="form-group">
                  <label>Gold Rate (₹/g)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={goldRate}
                    onChange={(e) => setGoldRate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Silver Rate (₹/g)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={silverRate}
                    onChange={(e) => setSilverRate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {rateStatus && <div className="success-msg">{rateStatus}</div>}
              <button type="submit" className="save-rates-btn" disabled={ratesLoading}>
                {ratesLoading ? "Saving rates..." : "Save Rates"}
              </button>
            </form>
          </div>
        </section>

        {/* RIGHT PANEL */}
        <div>
          <section className="products-section glass-gold fade-in">
            <div className="section-header">
              <h2>Products Inventory</h2>
              <p>{products.length} items in collection</p>
            </div>

            {products.length > 0 ? (
              <div className="products-table-wrapper inventory-table-wrapper">
                <table className="products-table inventory-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Weight</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((productItem) => (
                      <tr key={productItem.id}>
                        <td>
                          <img className="table-img" src={productItem.image_url} alt={productItem.name} />
                        </td>
                        <td>{productItem.name}</td>
                        <td>{productItem.categories?.name || "No Category"}</td>
                        <td>₹{calculatePrice(productItem).toLocaleString()}</td>
                        <td>{productItem.weight}</td>
                        <td>
                          <button className="btn-delete" onClick={() => deleteProduct(productItem.id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">No products available yet.</div>
            )}
          </section>
        </div>
      </div>
      </>
      )}

      {activeTab === "categories" && (
        <section className="categories-tab">
          <CategoryManager />
        </section>
      )}

      {/* ORDERS TAB */}
      {activeTab === "orders" && (
      <section className="orders-section glass-gold fade-in">
        <div className="section-header">
          <h2>Order Management</h2>
          <p>Review and update order status.</p>
        </div>

        {orderStatusMessage && <div className="success-msg">{orderStatusMessage}</div>}

        {!ordersLoading ? (
            orders.length > 0 ? (
              <div className="products-table-wrapper">
                <table className="orders-table">
                  <colgroup>
                    <col style={{ width: "16%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "8%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "18%" }} />
                    <col style={{ width: "16%" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Product</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Actions</th>
                      <th>View</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const prodName = order.product_name || order.products?.name || order.product?.name || "Unknown Product";
                      const prodImage = order.products?.image_url || order.product?.image_url || "https://via.placeholder.com/60";
                      const unitPrice = Number(order.products?.price || order.product?.price || order.rate || 0);
                      const quantity = Number(order.quantity || 1);
                      const orderTotal = Number(order.total || order.final_total || unitPrice * quantity || 0);
                      return (
                        <tr
                          key={order.id}
                          style={{ cursor: "pointer" }}
                          onClick={() => openOrderModal(order)}
                        >
                          <td>{order.id?.slice(0, 8)}...</td>
                          <td>{order.customer_name}</td>
                          <td>
                            <div className="product-cell">
                              <img
                                src={prodImage}
                                alt={prodName}
                                className="product-thumb"
                                onError={(e) => { e.target.src = "https://via.placeholder.com/60"; }}
                              />
                              <span className="product-name">{prodName}</span>
                            </div>
                          </td>
                          <td>{orderTotal ? `₹${orderTotal.toLocaleString()}` : "-"}</td>
                          <td>
                            <div className="status-control-cell">
                              <span className={getStatusBadge(order.status)}>
                                {normalizeStatus(order.status)}
                              </span>
                              <select
                                className="status-select"
                                value={normalizeStatus(order.status)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleUpdateOrderStatus(order.id, e.target.value);
                                }}
                                disabled={orderActionLoading}
                              >
                                {ORDER_STATUS_STEPS.map((step) => (
                                  <option key={step} value={step}>
                                    {step}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>
                          <td>
                            <div className="order-actions-vertical">
                              <button
                                className="btn-action btn-delete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteOrder(order.id);
                                }}
                                disabled={orderActionLoading}
                              >
                                Delete
                              </button>
                              <button
                                className="btn-action btn-view"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openOrderModal(order);
                                }}
                                disabled={orderActionLoading}
                              >
                                View
                              </button>
                            </div>
                          </td>
                          <td>
                            <button
                              className="btn-action btn-view"
                              onClick={(e) => {
                                e.stopPropagation();
                                openOrderModal(order);
                              }}
                              title="View order details"
                            >
                              👁️ View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">No orders yet.</div>
            )
          ) : (
            <div className="empty-state">Loading orders...</div>
          )}
        </section>
      )}

      {/* CUSTOM DESIGN REQUESTS TAB */}
      {activeTab === "custom" && (
      <section className="custom-requests-section glass-gold fade-in">
        <div className="section-header">
          <h2>Custom Design Requests</h2>
          <p>Manage custom design requests and update their status.</p>
        </div>

        {customStatusMessage && <div className="success-msg">{customStatusMessage}</div>}

        {customRequests.length === 0 ? (
          <p>No custom design requests yet.</p>
        ) : (
          customRequests.map((request) => (
            <div key={request.id}>
              <img
                src={request.reference_image}
                width="120"
                alt=""
              />
              <h3>{request.name}</h3>
              <p>{request.design_type}</p>
              <p>{request.jewelry_type}</p>
              <p>{request.weight}</p>
              <p>{request.specifications}</p>
              <p>{request.status}</p>
            </div>
          ))
        )}


      </section>
      )}
      </div>
    </div>

      {/* ORDER DETAIL MODAL */}
      {showOrderModal && selectedOrder && (
        <div className="modal-overlay" onClick={closeOrderModal}>
          <div className="modal-content order-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order Details</h2>
              <button className="modal-close" onClick={closeOrderModal}>✕</button>
            </div>

            {console.log("📋 MODAL SHOWING ORDER DATA:", selectedOrder)}

            <div id="invoice-content" className="invoice-content">
              {/* INVOICE TEMPLATE FOR PDF */}
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <h1 style={{ fontSize: "28px", color: "#ffd760", marginBottom: "5px" }}>STS Luxury Jewellers</h1>
                <p style={{ fontSize: "12px", color: "#666" }}>Finest Gold & Silver Collections</p>
              </div>

              <div style={{ borderBottom: "2px solid #ffd760", paddingBottom: "15px", marginBottom: "15px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div>
                    <p style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "5px" }}>Invoice Number</p>
                    <p style={{ fontSize: "14px", fontWeight: "bold" }}>{selectedOrder.id?.slice(0, 12)}</p>
                    <p style={{ fontSize: "12px", color: "#666", marginTop: "10px" }}>Date: {new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "5px" }}>Order Status</p>
                    <p style={{ fontSize: "14px", fontWeight: "bold", color: "#ffd760" }}>{(selectedOrder.status || "Pending").toUpperCase()}</p>
                  </div>
                </div>
              </div>

              {/* CUSTOMER DETAILS */}
              <div style={{ marginBottom: "20px" }}>
                <p style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "10px", color: "#333" }}>CUSTOMER INFORMATION</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", fontSize: "13px" }}>
                  <div>
                    <p style={{ color: "#666" }}>Name</p>
                    <p style={{ fontWeight: "bold", marginBottom: "10px" }}>{selectedOrder.customer_name || "N/A"}</p>
                    <p style={{ color: "#666" }}>Email</p>
                    <p style={{ fontWeight: "bold" }}>{selectedOrder.customer_email || selectedOrder.email || selectedOrder.user_email || "N/A"}</p>
                    <p style={{ color: "#666", marginTop: "10px" }}>Phone</p>
                    <p style={{ fontWeight: "bold" }}>{selectedOrder.phone || "N/A"}</p>
                  </div>
                  <div>
                    <p style={{ color: "#666" }}>Address</p>
                    <p style={{ fontWeight: "bold", marginBottom: "10px" }}>{selectedOrder.address || "N/A"}</p>
                    <p style={{ color: "#666" }}>City</p>
                    <p style={{ fontWeight: "bold" }}>{selectedOrder.city || "N/A"} {selectedOrder.pincode || ""}</p>
                  </div>
                </div>
              </div>

              {/* PRODUCT DETAILS */}
              <div style={{ marginBottom: "20px", borderTop: "1px solid #ddd", paddingTop: "15px" }}>
                <p style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "10px", color: "#333" }}>PRODUCT INFORMATION</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px", fontSize: "13px" }}>
                  <div>
                    <p style={{ color: "#666", marginBottom: "6px" }}>Product Name</p>
                    <p style={{ fontWeight: "bold", marginBottom: "12px", fontSize: "15px" }}>
                      {selectedOrder.product_name || selectedOrder.product?.name || selectedOrder.products?.name || "Unknown Product"}
                    </p>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <p style={{ color: "#666" }}>Category</p>
                      <p style={{ fontWeight: "bold" }}>{selectedOrder.products?.category || selectedOrder.product?.category || selectedOrder.category || "N/A"}</p>
                    </div>
                    <div>
                      <p style={{ color: "#666" }}>Metal Type</p>
                      <p style={{ fontWeight: "bold" }}>{selectedOrder.products?.category || selectedOrder.product?.category || selectedOrder.category || "N/A"}</p>
                    </div>
                    <div>
                      <p style={{ color: "#666" }}>Weight</p>
                      <p style={{ fontWeight: "bold" }}>{selectedOrder.product_weight || selectedOrder.weight || selectedOrder.products?.weight || selectedOrder.product?.weight || "N/A"} g</p>
                    </div>
                    <div>
                      <p style={{ color: "#666" }}>Qty</p>
                      <p style={{ fontWeight: "bold" }}>{selectedOrder.quantity || 1}</p>
                    </div>
                    <div>
                      <p style={{ color: "#666" }}>Making Charge</p>
                      <p style={{ fontWeight: "bold" }}>₹{Number(selectedOrder.making_charge || selectedOrder.products?.making_charge || selectedOrder.product?.making_charge || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p style={{ color: "#666" }}>Wastage</p>
                      <p style={{ fontWeight: "bold" }}>{Number(selectedOrder.wastage || selectedOrder.products?.wastage || selectedOrder.product?.wastage || 0)}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* PRICE BREAKDOWN */}
              <div style={{ marginBottom: "20px", borderTop: "1px solid #ddd", paddingTop: "15px" }}>
                <p style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "10px", color: "#333" }}>PRICE BREAKDOWN</p>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "8px" }}>
                  <span style={{ color: "#666" }}>Unit Price</span>
                  <span>₹{Number(selectedOrder.products?.price || selectedOrder.product?.price || selectedOrder.rate || 0).toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "8px" }}>
                  <span style={{ color: "#666" }}>Quantity</span>
                  <span>{Number(selectedOrder.quantity || 1)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "8px" }}>
                  <span style={{ color: "#666" }}>Subtotal</span>
                  <span>₹{Number(selectedOrder.subtotal || (Number(selectedOrder.products?.price || selectedOrder.product?.price || selectedOrder.rate || 0) * Number(selectedOrder.quantity || 1)) || 0).toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "12px" }}>
                  <span style={{ color: "#666" }}>GST (3%)</span>
                  <span>₹{Number(selectedOrder.gst || 0).toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", fontWeight: "bold", borderTop: "2px solid #ffd760", paddingTop: "8px", color: "#ffd760" }}>
                  <span>TOTAL AMOUNT</span>
                  <span>₹{Number(selectedOrder.total || selectedOrder.final_total || (Number(selectedOrder.subtotal || 0) + Number(selectedOrder.gst || 0))).toLocaleString()}</span>
                </div>
              </div>

              {/* PAYMENT & STATUS */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", fontSize: "13px", borderTop: "1px solid #ddd", paddingTop: "15px" }}>
                <div>
                  <p style={{ color: "#666" }}>Payment Method</p>
                  <p style={{ fontWeight: "bold" }}>{selectedOrder.payment_method || "N/A"}</p>
                </div>
                <div>
                  <p style={{ color: "#666" }}>Special Notes</p>
                  <p style={{ fontWeight: "bold" }}>{selectedOrder.special_notes || "None"}</p>
                </div>
              </div>

              <div style={{ textAlign: "center", marginTop: "20px", paddingTop: "15px", borderTop: "1px solid #ddd", fontSize: "11px", color: "#999" }}>
                <p>Generated on {new Date().toLocaleString()}</p>
                <p>Thank you for your business! | STS Luxury Jewellers</p>
              </div>
            </div>

            {/* MODAL ACTIONS */}
            <div className="modal-actions" style={{ display: "flex", gap: "10px", marginTop: "20px", justifyContent: "flex-end" }}>
              <button
                className="btn-action btn-delete"
                onClick={() => handleDeleteOrder(selectedOrder.id)}
                disabled={orderActionLoading}
              >
                Delete Order
              </button>
              <button
                className="btn-action btn-deliver"
                onClick={downloadInvoice}
                disabled={invoiceLoading}
              >
                {invoiceLoading ? "Generating..." : "📥 Download Invoice"}
              </button>
              <button
                className="btn-action btn-confirm"
                onClick={closeOrderModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
);
}

export default AdminDashboard;
