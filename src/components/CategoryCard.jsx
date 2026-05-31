import React from "react";
import "../styles/category.css";

export default function CategoryCard({ category, onClick }) {
  return (
    <div className="category-card" onClick={() => onClick(category)}>
      <div className="category-image">
        <img src={category.image_url} alt={category.name} />
      </div>
      <div className="category-content">
        <h3>{category.name}</h3>
      </div>
    </div>
  );
}
