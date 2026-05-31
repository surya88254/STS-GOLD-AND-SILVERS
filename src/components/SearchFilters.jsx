import React, { useState } from "react";
import "../styles/SearchFilters.css";

const SearchFilters = ({
  onSearch,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [selectedWeights, setSelectedWeights] = useState([]);

  const weightOptions = ["1g", "2g", "5g", "10g", "20g"];

  const applyFilters = (updates) => {
    const filters = {
      searchTerm: updates.searchTerm !== undefined ? updates.searchTerm : searchTerm,
      priceRange: updates.priceRange !== undefined ? updates.priceRange : priceRange,
      weights: updates.selectedWeights !== undefined ? updates.selectedWeights : selectedWeights,
    };
    onSearch(filters);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    applyFilters({ searchTerm: value });
  };

  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    const nextRange = [...priceRange];
    const parsed = Number(value) || 0;
    if (name === "priceMin") {
      nextRange[0] = parsed;
    } else {
      nextRange[1] = parsed || 1000000;
    }
    setPriceRange(nextRange);
    applyFilters({ priceRange: nextRange });
  };

  const handleWeightToggle = (weight) => {
    const updated = selectedWeights.includes(weight)
      ? selectedWeights.filter((item) => item !== weight)
      : [...selectedWeights, weight];
    setSelectedWeights(updated);
    applyFilters({ selectedWeights: updated });
  };

  const handleReset = () => {
    setSearchTerm("");
    setPriceRange([0, 1000000]);
    setSelectedWeights([]);
    onSearch({
      searchTerm: "",
      priceRange: [0, 1000000],
      weights: [],
    });
  };

  return (
    <div className="filters-box">
      <div className="search-wrapper">
        <input
          type="text"
          className="search-input"
          placeholder="Search your luxury jewelry"
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      <div className="filters-grid">
        <div>
          <div className="filter-title">💰 Price Range</div>
          <div className="price-row">
            <input
              type="number"
              name="priceMin"
              value={priceRange[0]}
              onChange={handlePriceChange}
              min="0"
              className="filter-input"
            />
            <input
              type="number"
              name="priceMax"
              value={priceRange[1]}
              onChange={handlePriceChange}
              min="0"
              className="filter-input"
            />
          </div>
          <div className="price-range-label">
            ₹{priceRange[0].toLocaleString()} – ₹{priceRange[1].toLocaleString()}
          </div>
        </div>

        <div>
          <div className="filter-title">⚖ Weight</div>
          <div className="weight-grid">
            {weightOptions.map((weight) => (
              <button
                key={weight}
                type="button"
                className={`weight-btn ${selectedWeights.includes(weight) ? "active" : ""}`}
                onClick={() => handleWeightToggle(weight)}
              >
                {weight}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button type="button" className="reset-btn" onClick={handleReset}>
        ↺ Reset Filters
      </button>
    </div>
  );
};

export default SearchFilters;
