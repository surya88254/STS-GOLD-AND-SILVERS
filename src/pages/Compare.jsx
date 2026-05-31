import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useCompare } from "../context/CompareContext";
import { FaBalanceScale, FaArrowLeft, FaCheck, FaTimes } from "react-icons/fa";
import "../styles/Compare.css";

function Compare() {
  const { compareList, removeFromCompare, clearCompare } = useCompare();
  const navigate = useNavigate();

  if (compareList.length === 0) {
    return (
      <>
        <Navbar />
        <div className="compare-container">
          <div className="compare-empty">
            <FaBalanceScale className="empty-icon" />
            <h2>No products selected</h2>
            <p>Select products to compare and view their side-by-side details.</p>
            <button
              className="compare-cta-btn"
              onClick={() => navigate("/home")}
            >
              Start Shopping
            </button>
          </div>
        </div>
      </>
    );
  }

  const getHigherValue = (val1, val2) => {
    if (typeof val1 !== "number" || typeof val2 !== "number") return null;
    return val1 > val2 ? "left" : val2 > val1 ? "right" : null;
  };

  const getLowerValue = (val1, val2) => {
    if (typeof val1 !== "number" || typeof val2 !== "number") return null;
    return val1 < val2 ? "left" : val2 < val1 ? "right" : null;
  };

  const comparisonFeatures = [
    {
      label: "Product Image",
      key: "image_url",
      type: "image",
    },
    {
      label: "Product Name",
      key: "name",
      type: "text",
    },
    {
      label: "Price",
      key: "price",
      type: "price",
      highlight: "lower",
    },
    {
      label: "Weight",
      key: "weight",
      type: "weight",
    },
    {
      label: "Metal Type",
      key: "metal_type",
      type: "text",
    },
    {
      label: "Making Charge",
      key: "making_charge",
      type: "number",
      highlight: "lower",
    },
    {
      label: "Wastage",
      key: "wastage",
      type: "number",
      highlight: "lower",
    },
    {
      label: "Purity",
      key: "purity",
      type: "text",
    },
    {
      label: "Category",
      key: "category",
      type: "text",
    },
    {
      label: "Stock Quantity",
      key: "stock_qty",
      type: "number",
    },
    {
      label: "Description",
      key: "description",
      type: "text",
    },
  ];

  const renderCellValue = (feature, product) => {
    const value = product[feature.key];

    if (!value) return "N/A";

    switch (feature.type) {
      case "image":
        return (
          <img
            src={value}
            alt={product.name}
            className="compare-product-image"
          />
        );
      case "price":
        return `₹${Number(value).toLocaleString()}`;
      case "weight":
        return `${value}g`;
      case "number":
        return Number(value).toFixed(2);
      case "text":
      default:
        return value;
    }
  };

  const getHighlight = (feature, product1, product2) => {
    if (feature.highlight === "lower") {
      return getLowerValue(product1[feature.key], product2[feature.key]);
    } else if (feature.highlight === "higher") {
      return getHigherValue(product1[feature.key], product2[feature.key]);
    }
    return null;
  };

  return (
    <>
      <Navbar />
      <div className="compare-container">
        <div className="compare-header">
          <button
            className="compare-back-btn"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft /> Back
          </button>
          <h1 className="compare-title">
            <FaBalanceScale /> Compare Products
          </h1>
          <button
            className="compare-clear-btn"
            onClick={clearCompare}
          >
            <FaTimes /> Clear All
          </button>
        </div>

        <div className="compare-table-wrapper">
          <table className="compare-table">
            <tbody>
              {comparisonFeatures.map((feature, idx) => {
                const highlight =
                  compareList.length === 2 &&
                  getHighlight(feature, compareList[0], compareList[1]);

                return (
                  <tr key={idx} className="compare-row">
                    <td className="compare-feature">
                      <span className="feature-label">{feature.label}</span>
                    </td>

                    {compareList.map((product, pidx) => (
                      <td
                        key={product.id}
                        className={`compare-value ${
                          highlight === (pidx === 0 ? "left" : "right")
                            ? "highlight"
                            : ""
                        }`}
                      >
                        {highlight === (pidx === 0 ? "left" : "right") && (
                          <FaCheck className="check-icon" />
                        )}
                        {renderCellValue(feature, product)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="compare-actions">
          {compareList.map((product) => (
            <div key={product.id} className="compare-action-card">
              <img
                src={product.image_url}
                alt={product.name}
                className="action-card-image"
              />
              <div className="action-card-content">
                <h3 className="action-card-title">{product.name}</h3>
                <p className="action-card-price">
                  ₹{product.price?.toLocaleString()}
                </p>
                <div className="action-card-meta">
                  <span className="meta-item">{product.weight}g</span>
                  <span className="meta-item">{product.metal_type}</span>
                </div>
              </div>
              <div className="action-card-buttons">
                <button
                  className="action-remove-btn"
                  onClick={() => removeFromCompare(product.id)}
                  title="Remove from compare"
                >
                  <FaTimes />
                </button>
                <button
                  className="action-view-btn"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {compareList.length === 1 && (
          <div className="compare-hint">
            <p>
              👇 Select another product to compare. You can compare up to 2
              products at a time.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

export default Compare;
