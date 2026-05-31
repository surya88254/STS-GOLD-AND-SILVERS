import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaUser } from "react-icons/fa";
import { supabase } from "../services/supabase";
import { fetchWishlistIds } from "../services/wishlist";
import "../styles/navbar.css";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);

      if (data.session?.user?.id) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("profile_photo")
          .eq("id", data.session.user.id)
          .maybeSingle();

        setAvatarUrl(profileData?.profile_photo || null);
      } else {
        setAvatarUrl(null);
      }
    };

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.id) {
        supabase
          .from("profiles")
          .select("profile_photo")
          .eq("id", session.user.id)
          .maybeSingle()
          .then(({ data: profileData }) => {
            setAvatarUrl(profileData?.profile_photo || null);
          });
      } else {
        setAvatarUrl(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Fetch wishlist count when session changes
  useEffect(() => {
    let mounted = true;
    const loadWishlist = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const userId = data.session?.user?.id;
        if (!userId) {
          if (mounted) setWishlistCount(0);
          return;
        }

        const ids = await fetchWishlistIds(userId);
        if (mounted) setWishlistCount(ids.length || 0);
      } catch (err) {
        console.error("wishlist load error:", err);
      }
    };

    loadWishlist();

    // Subscribe to wishlist table changes for live updates
    const sub = supabase
      .channel("public:wishlist")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "wishlist" }, (payload) => {
        // If insert for current user, increment
        supabase.auth.getSession().then(({ data }) => {
          if (data.session?.user?.id === payload.record.user_id) {
            setWishlistCount((c) => c + 1);
          }
        });
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "wishlist" }, (payload) => {
        supabase.auth.getSession().then(({ data }) => {
          if (data.session?.user?.id === payload.old.user_id) {
            setWishlistCount((c) => Math.max(0, c - 1));
          }
        });
      })
      .subscribe();

    return () => {
      mounted = false;
      try { supabase.removeChannel(sub); } catch (err) { console.warn('remove channel error', err); }
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
    setDropdownOpen(false);
    navigate("/");
  };

  const profileLink = session ? "/profile" : "/login";

  // Close mobile menu when clicking outside, and lock body scroll when open
  useEffect(() => {
    const closeMenu = () => setMenuOpen(false);

    if (menuOpen) {
      document.addEventListener("click", closeMenu);
      // prevent background scroll when mobile nav is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("click", closeMenu);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <nav className="navbar glass">
      <div className="nav-container">
        <div
          className="nav-left"
          onMouseEnter={() => setDropdownOpen(true)}
          onMouseLeave={() => setDropdownOpen(false)}
        >
          <Link
            to={profileLink}
            className={`nav-link nav-icon-button ${location.pathname === "/profile" ? "active" : ""}`}
            data-tooltip="Profile"
            onClick={() => setDropdownOpen(false)}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile avatar" className="nav-icon-image" />
            ) : (
              <FaUser size={22} />
            )}
          </Link>

          {session && dropdownOpen && (
            <div className="profile-dropdown">
              <Link
                to="/profile"
                className="dropdown-item"
                onClick={() => { setMenuOpen(false); setDropdownOpen(false); }}
              >
                My Profile
              </Link>
              <Link
                to="/my-orders"
                className="dropdown-item"
                onClick={() => { setMenuOpen(false); setDropdownOpen(false); }}
              >
                My Orders
              </Link>
              <Link
                to="/track-order"
                className="dropdown-item"
                onClick={() => { setMenuOpen(false); setDropdownOpen(false); }}
              >
                Track Order
              </Link>
              <button className="dropdown-item dropdown-logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>

        <Link to="/home" className="logo">
          STS
        </Link>

        <button
          className="hamburger"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((prev) => !prev);
          }}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          <span className={`hamburger-line ${menuOpen ? "active" : ""}`}></span>
          <span className={`hamburger-line ${menuOpen ? "active" : ""}`}></span>
          <span className={`hamburger-line ${menuOpen ? "active" : ""}`}></span>
        </button>

        {/* Mobile backdrop to dim page and capture outside clicks */}
        <div
          className={`nav-backdrop ${menuOpen ? "open" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(false);
          }}
        />

        <div
          className={`nav-links ${menuOpen ? "open" : ""}`}
          onClick={(e) => e.stopPropagation()}
        >
          <Link
            to="/home"
            className={`nav-link ${location.pathname === "/home" ? "active" : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            Home
          </Link>
          <Link
            to="/gold"
            className={`nav-link ${location.pathname === "/gold" ? "active" : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            Gold
          </Link>
          <Link
            to="/silver"
            className={`nav-link ${location.pathname === "/silver" ? "active" : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            Silver
          </Link>
          <Link
            to="/contact"
            className={`nav-link ${location.pathname === "/contact" ? "active" : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            CONTACTS
          </Link>
          <Link
            to="/wishlist"
            className={`nav-link ${location.pathname === "/wishlist" ? "active" : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            Wishlist {wishlistCount > 0 && <span className="wishlist-badge">({wishlistCount})</span>}
          </Link>
          <Link
            to="/admin-login"
            className={`nav-link admin-link ${location.pathname === "/admin-login" ? "active" : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            Admin
          </Link>
          {session ? (
            <button className="nav-link nav-button nav-link-text" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className={`nav-link ${location.pathname === "/login" ? "active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/signup"
                className={`nav-link nav-button gold-button ${location.pathname === "/signup" ? "active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                Signup
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;