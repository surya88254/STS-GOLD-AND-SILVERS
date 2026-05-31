import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { supabase } from "../services/supabase";
import "../styles/home.css";
import PromoBannerSlider from "../components/PromoBannerSlider";

function Home(){
  const [products, setProducts] = useState([]);
  const [scrollY, setScrollY] = useState(0);
  const [rates, setRates] = useState({ gold_rate: null, silver_rate: null });
  const [ratesLoading, setRatesLoading] = useState(true);
  const [goldRate, setGoldRate] = useState("");
  const [silverRate, setSilverRate] = useState("");

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .limit(3);
      if (data) setProducts(data);
    };

    const fetchRates = async () => {

      const { data, error } = await supabase
        .from("metal_rates")
        .select("*");

      console.log("FULL DATA =", data);

      if (error) return;

      const gold = data.find(
        item => item.metal_type === "gold"
      );

      const silver = data.find(
        item => item.metal_type === "silver"
      );

      setGoldRate(gold?.rate || "Unavailable");
      setSilverRate(silver?.rate || "Unavailable");
    };

    fetchFeaturedProducts();
    fetchRates();
    const interval = setInterval(fetchRates, 60000);
    return () => clearInterval(interval);
  }, []);

  console.log(goldRate, silverRate);

  return(
    <div className="home">
      <Navbar/>

      {/* ===== HERO SECTION ===== */}
      <section className="hero">
        <div className="hero-content" style={{ transform: `translateY(${scrollY * 0.5}px)` }}>
          <div className="hero-text fade-in">
            <h1 className="hero-title">
              <span className="text-gradient">LUXURY</span>
              <br />
              REDEFINED
            </h1>
            <p className="hero-subtitle">
              Exquisite Gold & Silver Collections
              <br />
              Crafted for the Discerning Few
            </p>
          </div>

          <div className="hero-buttons fade-in" style={{ animationDelay: "0.2s" }}>
            <Link to="/gold" className="btn btn-primary">
              Explore Gold
            </Link>
            <Link to="/silver" className="btn btn-secondary">
              Explore Silver
            </Link>
          </div>

          <div className="scroll-indicator fade-in" style={{ animationDelay: "0.4s" }}>
            <span>Scroll to discover</span>
            <div className="mouse">
              <div className="wheel"></div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PROMO BANNERS ===== */}
      <PromoBannerSlider />


      {/* ===== FEATURED PRODUCTS ===== */}
      <section className="featured">
        <div className="container">
          <div className="section-header fade-in">
            <h2>Featured Collections</h2>
            <p>Handpicked masterpieces from our vault</p>
          </div>

          <div className="rate-box">

  <h3>
    Gold → ₹{goldRate}/g
  </h3>

  <h3>
    Silver → ₹{silverRate}/g
  </h3>

</div>

          <div className="featured-grid">
            {products.length > 0 ? (
              products.map((product, index) => (
                <div 
                  key={product.id} 
                  className="featured-card glass-gold fade-in"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <div className="featured-image-wrapper">
                    <img src={product.image_url} alt={product.name} />
                    <div className="overlay-badge">{product.category}</div>
                  </div>
                  <div className="featured-info">
                    <h3>{product.name}</h3>
                    <p className="featured-weight">{product.weight}</p>
                    <p className="featured-description">{product.description}</p>
                    <Link to={`/product/${product.id}`} className="btn btn-small">
                      View Details
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-products">Loading featured collections...</p>
            )}
          </div>
        </div>
      </section>

      {/* ===== WHY CHOOSE US ===== */}
      <section className="why-us">
        <div className="container">
          <div className="section-header fade-in">
            <h2>Why STS Gold & Silvers</h2>
            <p>Excellence in every detail</p>
          </div>

          <div className="benefits-grid">
            <div className="benefit-card glass fade-in">
              <div className="benefit-icon">✨</div>
              <h3>Premium Quality</h3>
              <p>Certified 24K gold and 925 sterling silver with uncompromising purity</p>
            </div>

            <div className="benefit-card glass fade-in" style={{ animationDelay: "0.1s" }}>
              <div className="benefit-icon">🎨</div>
              <h3>Exquisite Design</h3>
              <p>Handcrafted by master artisans with meticulous attention to detail</p>
            </div>

            <div className="benefit-card glass fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="benefit-icon">🔒</div>
              <h3>Authenticity Guaranteed</h3>
              <p>Every piece comes with certificate of authenticity and lifetime support</p>
            </div>

            <div className="benefit-card glass fade-in" style={{ animationDelay: "0.3s" }}>
              <div className="benefit-icon">🚀</div>
              <h3>Fast Delivery</h3>
              <p>Secure packaging and express delivery to your doorstep</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="testimonials">
        <div className="container">
          <div className="section-header fade-in">
            <h2>Client Testimonials</h2>
            <p>Trusted by jewelry connoisseurs</p>
          </div>

          <div className="testimonials-grid">
            <div className="testimonial-card glass-gold fade-in">
              <div className="stars">★★★★★</div>
              <p>"Absolutely stunning collection. The quality and craftsmanship exceeded my expectations. A true luxury experience."</p>
              <div className="testimonial-author">— Aisha Patel</div>
            </div>

            <div className="testimonial-card glass-gold fade-in" style={{ animationDelay: "0.1s" }}>
              <div className="stars">★★★★★</div>
              <p>"The attention to detail is impeccable. This is the only place I trust for premium jewelry. Highly recommended!"</p>
              <div className="testimonial-author">— Rajesh Kumar</div>
            </div>

            <div className="testimonial-card glass-gold fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="stars">★★★★★</div>
              <p>"Every piece feels like owning a piece of art. STS is the epitome of luxury in jewelry."</p>
              <div className="testimonial-author">— Priya Verma</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== NEWSLETTER ===== */}
      <section className="newsletter">
        <div className="container">
          <div className="newsletter-content glass-gold">
            <h2>Join Our Exclusive Circle</h2>
            <p>Get early access to new collections and exclusive member benefits</p>
            <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Enter your email" required />
              <button type="submit" className="btn btn-primary">Subscribe</button>
            </form>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-section">
              <h4>STS Gold & Silvers</h4>
              <p>Luxury jewelry for the discerning few.</p>
            </div>
            <div className="footer-section">
              <h4>Collections</h4>
              <ul>
                <li><Link to="/gold">Gold Collection</Link></li>
                <li><Link to="/silver">Silver Collection</Link></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Customer Service</h4>
              <ul>
                <li><a href="#contact">Contact Us</a></li>
                <li><a href="#faq">FAQ</a></li>
                <li><a href="#shipping">Shipping</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Connect</h4>
              <ul>
                <li><a href="#instagram">Instagram</a></li>
                <li><a href="#facebook">Facebook</a></li>
                <li><a href="#twitter">Twitter</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 STS Gold & Silvers. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home;