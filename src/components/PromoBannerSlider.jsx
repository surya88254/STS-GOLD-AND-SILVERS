import { useEffect, useState, useRef } from "react";
import { fetchActiveBanners, subscribeToBanners } from "../services/promoBanners";
import "../styles/PromoBanner.css";

function Countdown({ endDate }) {
  const [remaining, setRemaining] = useState(() => getRemaining(endDate));

  function getRemaining(ed) {
    if (!ed) return null;
    const now = new Date();
    const end = new Date(ed);
    const diff = Math.max(0, end - now);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);
    return { days, hours, mins, secs, total: diff };
  }

  useEffect(() => {
    const t = setInterval(() => setRemaining(getRemaining(endDate)), 1000);
    return () => clearInterval(t);
  }, [endDate]);

  if (!remaining) return null;
  if (remaining.total <= 0) return <div className="promo-countdown">Offer ended</div>;
  return (
    <div className="promo-countdown">
      Offer Ends In: {String(remaining.days).padStart(2, "0")}d {String(remaining.hours).padStart(2, "0")}h {String(remaining.mins).padStart(2, "0")}m
    </div>
  );
}

export default function PromoBannerSlider() {
  const [banners, setBanners] = useState([]);
  const [index, setIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const autoplayRef = useRef(null);
  const fallback = "/default-banner.jpg";

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchActiveBanners();
        if (mounted) {
          console.log('PromoBannerSlider: initial fetch ->', (data || []).length, 'banners', (data || []).map(d => d.title));
          setBanners(data);
        }
      } catch (err) {
        console.error(err);
      }
    })();

    const channel = subscribeToBanners(async () => {
      const data = await fetchActiveBanners();
      console.log('PromoBannerSlider: realtime update ->', (data || []).length, 'banners', (data || []).map(d => d.title));
      setBanners(data);
    });

    return () => {
      mounted = false;
      try { channel?.unsubscribe(); } catch (e) {}
    };
  }, []);

  useEffect(() => {
    if (!banners || banners.length === 0) return;
    autoplayRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, 5000);
    return () => clearInterval(autoplayRef.current);
  }, [banners]);

  const changeIndex = (newIndex) => {
    clearInterval(autoplayRef.current);
    setIndex(newIndex);
  };

  const prevBanner = () => {
    if (!banners.length) return;
    changeIndex((index - 1 + banners.length) % banners.length);
  };

  const nextBanner = () => {
    if (!banners.length) return;
    changeIndex((index + 1) % banners.length);
  };

  const handleTouchStart = (event) => {
    setTouchStartX(event.touches[0].clientX);
  };

  const handleTouchEnd = (event) => {
    if (touchStartX === null) return;
    const touchEndX = event.changedTouches[0].clientX;
    const delta = touchEndX - touchStartX;
    setTouchStartX(null);

    if (Math.abs(delta) < 50) return;
    if (delta > 0) {
      prevBanner();
    } else {
      nextBanner();
    }
  };

  if (!banners || banners.length === 0) return null;

  return (
    <section className="promo-slider">
      <div
        className="promo-slider-inner"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="promo-track" style={{ transform: `translateX(-${index * 100}%)` }}>
          {banners.map((b, i) => (
            <article
              key={b.id}
              className={`promo-slide ${i === index ? "active" : ""}`}
              aria-hidden={i === index ? "false" : "true"}
            >
              <div className="promo-card" style={{ background: `linear-gradient(135deg,#050505,#111111,#1a1200)` }}>
                <div className="promo-glow" />
                <div className="promo-shimmer" />

                <div className="promo-content">
                  <div className="promo-left">
                    <div className="badge">{b.display_order === 1 ? "🔥 HOT OFFER" : ""}</div>
                    <h2 className="lux-title">{b.title || "FESTIVAL SALE"}</h2>
                    <h4 className="lux-sub">{b.subtitle || "Live Luxury Jewellery Offers"}</h4>
                    <p className="lux-desc">{b.description || "Premium collections with exclusive discounts."}</p>

                    <div className="cta-row">
                      <a className="btn-gold" href="/gold">{b.button_text || "Shop Now"}</a>
                      <Countdown endDate={b.end_date} />
                    </div>
                  </div>

                  <div className="promo-right">
                    <div className="image-wrap">
                      <img src={b.image_url || fallback} alt={b.title || "promo"} onError={(e) => { e.target.onerror = null; e.target.src = fallback; }} />
                    </div>
                  </div>
                </div>

                <div className="particles" aria-hidden="true">
                  <span></span><span></span><span></span><span></span><span></span>
                </div>

              </div>
            </article>
          ))}
        </div>

        {banners.length > 1 && (
          <>
            <button className="promo-arrow left" onClick={prevBanner} aria-label="Previous">❮</button>
            <button className="promo-arrow right" onClick={nextBanner} aria-label="Next">❯</button>

            <div className="promo-dots">
              {banners.map((_, i) => (
                <button
                  key={i}
                  className={`dot ${i === index ? "active" : ""}`}
                  onClick={() => changeIndex(i)}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
        <div className="promo-index-debug" aria-hidden="true">{index + 1}/{banners.length}</div>
      </div>
    </section>
  );
}
