import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";
import "../styles/UserSignup.css";

function UserSignup() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (session) {
      navigate("/home");
    }
  }, [navigate, session]);

  const handlePhotoChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password.trim(),
      options: {
        data: {
          full_name: fullName.trim(),
          phone: phone.trim(),
        },
      },
    });

    if (error) {
      setErrorMessage(error.message || "Unable to create account.");
      setLoading(false);
      return;
    }

    const user = data.user ?? (await supabase.auth.getUser()).data.user;
    const userId = user?.id;
    if (!userId) {
      setErrorMessage("Unable to determine authenticated user ID.");
      setLoading(false);
      return;
    }

    let photoUrl = null;

    if (photoFile && userId) {
      const filePath = `${userId}/${Date.now()}-${photoFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, photoFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(filePath);
        photoUrl = urlData.publicUrl;
      }
    }

    const { error: profileError } = await supabase.from("profiles").insert([
      {
        id: userId,
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        profile_photo: photoUrl,
        created_at: new Date().toISOString(),
      },
    ]);

    if (profileError) {
      setErrorMessage(profileError.message || "Unable to save profile details.");
      setLoading(false);
      return;
    }

    if (data.session) {
      navigate("/home");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-panel glass-card">
        <div className="auth-header">
          <span className="auth-tag">Premium Account</span>
          <h1>Create Your STS Profile</h1>
          <p>Sign up and store your orders with a luxurious profile experience.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {errorMessage && <div className="auth-error">{errorMessage}</div>}

          <label>
            Full Name
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name"
              required
            />
          </label>

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
            Phone Number
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              required
            />
          </label>

          <label>
            Password
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
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

          <label>
            Confirm Password
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              required
            />
          </label>

          <label className="photo-upload-label">
            Profile Photo (optional)
            <input type="file" accept="image/*" onChange={handlePhotoChange} />
            {photoPreview && <img className="photo-preview" src={photoPreview} alt="Preview" />}
          </label>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Creating Account..." : "Sign Up"}
          </button>

          <div className="auth-footer">
            <p>
              Already have an account? <span onClick={() => navigate("/login")} className="auth-link">Login now</span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserSignup;
