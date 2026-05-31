import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/STS.png";
import "../styles/SplashScreen.css";

export default function SplashScreen() {
  const navigate = useNavigate();
  const { authChecked, session } = useAuth();

  useEffect(() => {
    if (!authChecked) return;

    const redirect = () => {
      if (session) {
        navigate("/home", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    };

    const timer = setTimeout(redirect, 3000);
    return () => clearTimeout(timer);
  }, [authChecked, navigate, session]);

  return (
    <div className="splash-screen">
      <div className="logo-stage">
        <div className="logo-wrapper">
          <img src={logo} alt="STS Gold & Silvers" className="logo" />
        </div>
        <div className="logo-ring" />
        <div className="logo-glow" />
        <div className="logo-sparkles">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
      <div className="splash-message">
        <span className="splash-label">STS Gold & Silvers</span>
        <p className="splash-text">Luxury jewelry redefined. Preparing your secure access.</p>
      </div>
    </div>
  );
}
