import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import "../styles/AdminLogin.css";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      alert("Login Success");
      navigate("/admin");
    }
  };

  return (
    <div className="admin-login-page">
      <div className="login-background">
        <span className="bg-glow"></span>
        <span className="bg-line bg-line-1"></span>
        <span className="bg-line bg-line-2"></span>
        <span className="bg-line bg-line-3"></span>
      </div>

      <div className="login-panel glass-card">
        <div className="panel-header">
          <span className="brand-badge">STS Admin</span>
          <h1>Admin Login</h1>
          <p>Secure access to inventory, products, and premium controls.</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <button
            type="button"
            className="back-button"
            onClick={() => navigate('/')}
          >
            ← Back to Home
          </button>

          <label className="input-group">
            <span>Email</span>
            <div className="input-wrap">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sts.com"
                required
              />
              <span className="input-icon">??</span>
            </div>
          </label>

          <label className="input-group">
            <span>Password</span>
            <div className="input-wrap">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <span className="input-icon">??</span>
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p className="login-caption">
            Premium admin access secured with Supabase authentication.
          </p>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin
