import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/category.css";

export default function CategoryGrid({ categories = [] }) {
  const navigate = useNavigate();

  return (
    <div className="categories-grid">
      {categories.map((category) => (
        <div
          key={category.id}
          className="category-card"
          onClick={() => navigate(`/category/${category.id}`)}
        >
          <h3>{category.name}</h3>
          <p>Explore Collection</p>
        </div>
      ))}
    </div>
  );
}
