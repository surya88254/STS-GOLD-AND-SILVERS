import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { supabase } from "../services/supabase";
import SearchFilters from "../components/SearchFilters";
import ProductCard from "../components/ProductCard";
import { normalizeWeightList, matchesCategory, matchesWeight } from "../utils/filterHelpers";
import "../styles/gold.css";
import "../styles/ProductCard.css";

function CategoryProducts() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(null);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    searchTerm: "",
    priceRange: [0, 1000000],
    category: "",
    weights: [],
    metalType: "",
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError("");

        console.log("🔍 Fetching category with ID:", id);

        // Fetch the category first
        const { data: cat, error: catError } = await supabase
          .from("categories")
          .select("*")
          .eq("id", id)
          .single();

        if (catError) {
          console.error("❌ Category fetch error:", catError);
          setError("Category not found");
          setLoading(false);
          return;
        }

        console.log("✓ Category fetched:", cat);
        setCategory(cat);

        // Fetch products for this category
        console.log(`🔍 Fetching products for category_id: ${id}, metal_type: ${cat?.metal_type}`);

        const { data, error: prodError } = await supabase
          .from("products")
          .select("*")
          .eq("category_id", id);
        
        console.log("CATEGORY:", cat);
        console.log("PRODUCTS:", data);

        if (prodError) {
          console.error("❌ Products fetch error:", prodError);
          setError("Failed to load products");
          setProducts([]);
        } else {
          console.log("✓ Products fetched:", data);
          console.log(`📊 Total products found: ${data?.length || 0}`);
          setProducts(data || []);
        }
      } catch (err) {
        console.error("❌ Unexpected error:", err);
        setError("An unexpected error occurred");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetch();
    }
  }, [id]);

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Search filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term)
      );
    }

    // Price range filter
    filtered = filtered.filter(
      (p) => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
    );

    // Category filter
    if (filters.category) {
      filtered = filtered.filter((p) => {
        const productCategory = p.category || p.category_name || p.categories?.name || p.category?.name || "";
        const match = matchesCategory(productCategory, filters.category);
        console.log("PRODUCT CATEGORY:", p.category ?? p.categories?.name ?? p.category_name, "SELECTED CATEGORY:", filters.category, "MATCH:", match);
        return match;
      });
    }

    // Weight filter
    if (filters.weights.length > 0) {
      filtered = filtered.filter((p) => {
        const match = matchesWeight(p.weight, filters.weights);
        console.log("PRODUCT WEIGHT:", p.weight, "SELECTED WEIGHTS:", filters.weights, "MATCH:", match);
        return match;
      });
    }

    return filtered;
  }, [products, filters]);

  return (
    <div className="category-products-page">
      <Navbar />
      <section className="products-section">
        <div className="container">
          <div className="section-header">
            <h2>{category ? category.name : "Category"}</h2>
            <p>Products in this category</p>
            <button className="btn" onClick={() => navigate(-1)}>Back</button>
          </div>

          {error && <p style={{ color: "red", padding: "20px" }}>⚠️ {error}</p>}

          {/* Search & Filters Section */}
          {products.length > 0 && (
            <SearchFilters
              onSearch={setFilters}
              categories={category ? [{ name: category.name }] : []}
              metalTypes={[category?.metal_type || ""]}
              showMetalFilter={false}
            />
          )}

          {loading ? (
            <p>Loading products...</p>
          ) : products.length > 0 && filteredProducts.length > 0 ? (
            <div className="products-grid">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="no-products">
              <div className="empty-state-card">
                <span className="empty-state-icon">✨</span>
                <h3>No products in this category yet</h3>
                <p>
                  "{category?.name || "this category"}" does not have any products yet.
                  <br />Admins can add stock to this collection.
                </p>
              </div>
            </div>
          ) : (
            <div className="no-products">
              <div className="empty-state-card">
                <span className="empty-state-icon">🔍</span>
                <h3>No matching jewelry found</h3>
                <p>Try changing filters or reset to browse the category again.</p>
                <button
                  className="reset-filters-btn"
                  onClick={() =>
                    setFilters({
                      searchTerm: "",
                      priceRange: [0, 1000000],
                      category: "",
                      weights: [],
                      metalType: "",
                    })
                  }
                >
                  Reset filters
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default CategoryProducts;
