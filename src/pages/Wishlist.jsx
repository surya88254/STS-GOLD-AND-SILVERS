import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { supabase } from "../services/supabase";
import { fetchWishlistEntries, removeFromWishlist } from "../services/wishlist";
import "../styles/wishlist.css";

function Wishlist() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id;
      if (!userId) {
        navigate("/login");
        return;
      }

      const wishlist = await fetchWishlistEntries(userId);
      if (!mounted) return;
      setEntries(wishlist || []);

      if (wishlist.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const ids = wishlist.map((w) => w.product_id);
      const { data: prods, error } = await supabase.from("products").select("*").in("id", ids);
      if (error) {
        console.error("Wishlist: failed to load products", error);
        setProducts([]);
      } else {
        setProducts(prods || []);
      }

      setLoading(false);
    };

    load();
    return () => { mounted = false; };
  }, [navigate]);

  const handleRemove = async (productId) => {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id;
    if (!userId) return navigate("/login");

    try {
      await removeFromWishlist(userId, productId);
      setProducts((p) => p.filter((x) => x.id !== productId));
      setEntries((e) => e.filter((x) => x.product_id !== productId));
    } catch (err) {
      console.error("remove wishlist failed:", err);
      alert("Failed to remove from wishlist");
    }
  };

  if (loading) return (
    <div>
      <Navbar />
      <div className="wishlist-loading">Loading wishlist...</div>
    </div>
  );

  // Build merged wishlist entries (entry + product data)
  const wishlist = entries.map((entry) => {
    const prod = products.find((p) => p.id === entry.product_id) || {};
    return {
      ...entry,
      product_name: prod.name || prod.product_name || "",
      final_price: prod.final_price || prod.price || prod.final_total || 0,
      weight: prod.weight || 0,
      image_url: prod.image_url || prod.image || "",
      product_id: entry.product_id
    };
  });

  return (
    <div>
      <Navbar />
      <div className="wishlist-container">
        <h1 className="wishlist-title">Your Wishlist</h1>
        {wishlist.length === 0 ? (
          <div className="empty-wishlist">
            <p>♡ Your wishlist is empty</p>
          </div>
        ) : (
          <div className="wishlist-grid">
            {wishlist.map((item) => (
              <div className="wishlist-card" key={item.product_id}>

                <img src={item.image_url} alt={item.product_name} />

                <div className="wishlist-info">
                  <h3>{item.product_name}</h3>

                  <div className="wishlist-price">₹{Number(item.final_price || 0).toLocaleString()}</div>

                  <div className="wishlist-weight">{item.weight}g</div>
                </div>

                <div className="wishlist-actions">
                  <button onClick={() => navigate(`/product/${item.product_id}`)} className="view-btn">View Details</button>

                  <button onClick={() => handleRemove(item.product_id)} className="remove-btn">Remove</button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Wishlist;
