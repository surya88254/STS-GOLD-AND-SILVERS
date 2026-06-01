import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";
import "../styles/UserLogin.css";

function UserLogin() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (session) {
      navigate("/home");
    }
  }, [navigate, session]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    if (error) {
      setErrorMessage(error.message || "Unable to sign in. Please try again.");
      setLoading(false);
      return;
    }

    navigate("/home");
  };

  return (
    <div className="auth-page">
      <div className="auth-panel glass-card">
        <div className="auth-header">
          <span className="auth-tag">Luxury Access</span>
          <h1>Welcome Back</h1>
          <p>Login to manage your premium orders and profile.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {errorMessage && <div className="auth-error">{errorMessage}</div>}

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            Password
            <div className="password-container">
              <input
                className="password-input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          <div className="remember-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Signing In..." : "Login"}
          </button>

          <div className="auth-footer">
            <p>
              New to STS? <span onClick={() => navigate("/signup")} className="auth-link">Create account</span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserLogin;
