import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { supabase } from "../services/supabase";
import CategoryGrid from "../components/CategoryGrid";
import SearchFilters from "../components/SearchFilters";
import ProductCard from "../components/ProductCard";
import { normalizeText, normalizeWeightList, matchesCategory, matchesWeight } from "../utils/filterHelpers";
import "../styles/silver.css";
import "../styles/ProductCard.css";

function Silver() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rate, setRate] = useState("Unavailable");
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    searchTerm: "",
    priceRange: [0, 1000000],
    category: "",
    weights: [],
    metalType: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      console.log("🔍 Fetching SILVER products with metal_type='Silver'");
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          categories(*)
        `)
        .eq("metal_type", "silver");

      if (error) {
        console.error("❌ Silver products fetch error:", error);
      } else {
        console.log("✅ SILVER PRODUCTS FETCHED:", data);
        console.log("📊 Silver product count:", data?.length || 0);
        setProducts(data || []);
      }

      setLoading(false);
    };

    const fetchRate = async () => {

      const { data, error } = await supabase
        .from("metal_rates")
        .select("*")
        .eq("metal_type","silver")
        .single();

      console.log(data);

      if(error){
        console.log(error);
        return;
      }

      setRate(data?.rate || "Unavailable");
    };

    const fetchCategories = async () => {
      const { data, error } = await supabase.from("categories").select("*").eq("metal_type","silver");
      if (error) {
        console.log(error);
        setCategories([]);
      } else {
        setCategories(data || []);
      }
    };

    fetchProducts();
    fetchRate();
    fetchCategories();
  }, []);

  // Filter products based on search and filters
  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    const selectedCategory = normalizeText(filters.category);
    const selectedWeights = normalizeWeightList(filters.weights);

    console.log("🔎 Applying SILVER filters", {
      category: filters.category,
      normalizedCategory: selectedCategory,
      weights: filters.weights,
      normalizedWeights: selectedWeights,
      priceRange: filters.priceRange,
      searchTerm: filters.searchTerm,
    });

    // Search filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase().trim();
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
    <div className="silver-page">
      <Navbar />

      <section className="silver-hero">
        <div className="hero-content fade-in">
          <h1 className="hero-title">SILVER COLLECTION</h1>
          <p className="hero-subtitle">Ethereal Beauty in 925 Sterling Silver</p>
        </div>
      </section>

      <section className="products-section">
        <div className="container">
          <div className="section-intro fade-in">
            <h2>Premium Silver Jewelry</h2>
            <p>Refined elegance in every lustrous piece</p>
          </div>

          <div className="rate-banner glass-silver fade-in">
            <div>
              <span className="rate-tag">TODAY'S RATE</span>
              <h2>₹{rate}/g</h2>
            </div>
          </div>

          {categories.length > 0 && (
            <section className="categories-section">
              <div className="container">
                <h2>Silver Categories</h2>
                <CategoryGrid categories={categories} onCategoryClick={(c)=>navigate(`/category/${c.id}`)} />
              </div>
            </section>
          )}

          {/* Search & Filters Section */}
          {products.length > 0 && (
            <SearchFilters
              onSearch={setFilters}
              categories={categories}
              metalTypes={["Silver"]}
              showMetalFilter={false}
            />
          )}

          {/* Products Display */}
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Loading premium collections...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="no-products">
              <div className="empty-state-card">
                <span className="empty-state-icon">✨</span>
                <h3>No silver pieces available</h3>
                <p>New lustrous arrivals are being prepared by our artisans.</p>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="no-products">
              <div className="empty-state-card">
                <span className="empty-state-icon">🔍</span>
                <h3>No matching jewelry found</h3>
                <p>Try changing filters or reset to browse the full silver collection.</p>
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
          ) : (
            <div className="products-grid">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="silver-cta">
        <div className="container">
          <div className="cta-content glass-silver fade-in">
            <h2>Interested in Custom Design?</h2>
            <p>Our master artisans can create your dream piece</p>
            <button className="btn btn-large" onClick={() => navigate("/custom-design")}>Request Custom Design</button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Silver;
