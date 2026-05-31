import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaRegHeart, FaHeart, FaStar, FaBalanceScale, FaCheck } from "react-icons/fa";
import { supabase } from "../services/supabase";
import { addToWishlist, removeFromWishlist, fetchWishlistIds } from "../services/wishlist";
import { getRatingSummary } from "../services/reviews";
import { useCompare } from "../context/CompareContext";

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { compareList, addToCompare, removeFromCompare, isInCompare } = useCompare();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [ratingSummary, setRatingSummary] = useState({ avg: 0, count: 0 });
  const [showMaxAlert, setShowMaxAlert] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const userId = data.session?.user?.id;
        if (userId) {
          const ids = await fetchWishlistIds(userId);
          if (mounted) setIsWishlisted(ids.includes(product.id));
        }

        const summary = await getRatingSummary(product.id);
        if (mounted) setRatingSummary(summary || { avg: 0, count: 0 });
      } catch (err) {
        console.error("ProductCard load error:", err);
      }
    };

    load();
    return () => { mounted = false; };
  }, [product.id]);

  const handleCardClick = () => navigate(`/product/${product.id}`);

  const toggleWishlist = async (e) => {
    e.stopPropagation();
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id;
    if (!userId) {
      navigate("/login");
      return;
    }

    try {
      if (isWishlisted) {
        await removeFromWishlist(userId, product.id);
        setIsWishlisted(false);
      } else {
        await addToWishlist(userId, product.id);
        setIsWishlisted(true);
      }
    } catch (err) {
      console.error("wishlist toggle error:", err);
    }
  };

  const handleCompareClick = (e) => {
    e.stopPropagation();
    
    if (isInCompare(product.id)) {
      removeFromCompare(product.id);
      return;
    }

    if (compareList.length >= 2) {
      setShowMaxAlert(true);
      setTimeout(() => setShowMaxAlert(false), 3000);
      return;
    }

    addToCompare(product);
  };

  return (
    <div className="product-card">
      {showMaxAlert && (
        <div className="product-card-alert">
          ⚠️ Only 2 products can be compared
        </div>
      )}
      <div className="product-image-wrapper" onClick={handleCardClick}>
        <img 
          src={product.image_url} 
          alt={product.name}
          className="product-image"
        />
        {product.stock_qty && product.stock_qty < 5 && (
          <span className="stock-badge">Low Stock</span>
        )}
      </div>

      <div className="product-info">
        <div className="product-header">
          <h3 className="product-name">{product.name}</h3>
          <button className="wishlist-btn" onClick={toggleWishlist} aria-label="Toggle wishlist">
            {isWishlisted ? <FaHeart color="#ffd760" /> : <FaRegHeart />}
          </button>
        </div>

        <div className="product-meta-row">
          <p className="product-weight">{product.weight}g</p>
          <div className="small-rating">
            <FaStar color="#ffd760" /> <strong>{ratingSummary.avg || 0}</strong>
            <span className="rating-count">({ratingSummary.count || 0})</span>
          </div>
        </div>

        <div className="product-meta">
          <span className="metal-type">{product.metal_type}</span>
          {product.category && (
            <span className="category-tag">{product.category}</span>
          )}
        </div>

        <div className="product-buttons">
          <button className="compare-btn" onClick={handleCompareClick} aria-label="Compare product" title={isInCompare(product.id) ? "Remove from compare" : "Add to compare"}>
            {isInCompare(product.id) ? (
              <>
                <FaCheck /> Added
              </>
            ) : (
              <>
                <FaBalanceScale /> Compare
              </>
            )}
          </button>
          <button className="view-btn" onClick={(e) => { e.stopPropagation(); navigate(`/product/${product.id}`); }}>View Details</button>
        </div>

        <div className="product-footer">
          <p className="product-price">₹{product.price?.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
