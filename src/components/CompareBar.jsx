import { useNavigate } from "react-router-dom";
import { useCompare } from "../context/CompareContext";
import { FaBalanceScale, FaTimes } from "react-icons/fa";
import "../styles/CompareBar.css";

const CompareBar = () => {
  const { compareList } = useCompare();
  const navigate = useNavigate();

  if (compareList.length === 0) return null;

  return (
    <div className="compare-bar-container">
      <div className="compare-bar-content">
        <div className="compare-bar-left">
          <FaBalanceScale className="compare-bar-icon" />
          <span className="compare-bar-text">
            Compare <strong>({compareList.length})</strong>
          </span>
        </div>

        <div className="compare-bar-products">
          {compareList.map((product) => (
            <span key={product.id} className="compare-bar-product-chip">
              {product.name}
            </span>
          ))}
        </div>

        <button
          className="compare-bar-btn"
          onClick={() => navigate("/compare")}
        >
          Compare Now
        </button>
      </div>
    </div>
  );
};

export default CompareBar;
