import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { supabase } from "../services/supabase";
import "../styles/CustomDesign.css";

function CustomDesign() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    design_type: "Gold",
    jewelry_type: "Chain",
    weight: "2g",
    budget: "",
    delivery_date: "",
    specifications: "",
    reference_image: null,
    reference_image_url: "",
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) {
        navigate("/login");
        return;
      }
      setUserId(userId);

      // Fetch user profile for pre-fill
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone, email")
        .eq("id", userId)
        .single();

      if (profile) {
        setFormData((prev) => ({
          ...prev,
          name: profile.full_name || "",
          phone: profile.phone || "",
          email: profile.email || "",
        }));
      }
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const uploadImage = async (file) => {
    if (!file) return null;

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
    const filePath = `custom/${fileName}`;

    const { error } = await supabase.storage
      .from("custom-designs")
      .upload(filePath, file);

    if (error) {
      console.error(error);
      alert(error.message);
      return null;
    }

    const { data } = supabase.storage
      .from("custom-designs")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      setErrorMessage("Only JPG, JPEG, and PNG files are allowed.");
      return;
    }

    setUploading(true);
    setErrorMessage("");

    try {
      const imageUrl = await uploadImage(file);
      if (!imageUrl) throw new Error("Failed to upload image");

      setFormData((prev) => ({
        ...prev,
        reference_image: file,
        reference_image_url: imageUrl,
      }));

      setSuccessMessage("Image uploaded successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrorMessage(error.message || "Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // Validation
      if (!formData.name.trim()) throw new Error("Full Name is required.");
      if (!formData.phone.trim()) throw new Error("Phone Number is required.");
      if (!formData.reference_image) throw new Error("Reference Photo is required.");

      // Upload image before inserting DB row
      const imageUrl = await uploadImage(formData.reference_image);
      if (!imageUrl) throw new Error("Failed to upload reference image");

      const { error } = await supabase.from("custom_design_requests").insert([
        {
          user_id: userId,
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          design_type: formData.design_type,
          jewelry_type: formData.jewelry_type,
          weight: formData.weight,
          budget: formData.budget,
          delivery_date: formData.delivery_date,
          specifications: formData.specifications,
          reference_image: imageUrl,
          status: "Pending",
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      setSuccessMessage("✓ Your custom design request has been submitted successfully!");
      setTimeout(() => {
        navigate("/profile");
      }, 2000);
    } catch (error) {
      setErrorMessage(error.message || "Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="custom-design-page">
        <Navbar />
        <div className="loading-state">Loading...</div>
      </div>
    );
  }

  return (
    <div className="custom-design-page">
      <Navbar />

      <section className="custom-hero">
        <div className="container">
          <div className="hero-content fade-in">
            <h1 className="custom-title">Custom Jewelry Design Request</h1>
            <p className="custom-subtitle">Create your dream gold or silver masterpiece.</p>
          </div>
        </div>
      </section>

      <section className="custom-form-section">
        <div className="container">
          <div className="form-card glass-gold fade-in">
            {errorMessage && <div className="error-msg">{errorMessage}</div>}
            {successMessage && <div className="success-msg">{successMessage}</div>}

            <form onSubmit={handleSubmit} className="custom-form">
              {/* Row 1: Name & Phone */}
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                    required
                  />
                </div>
              </div>

              {/* Row 2: Email & Design Type */}
              <div className="form-row">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                  />
                </div>
                <div className="form-group">
                  <label>Design Type *</label>
                  <select
                    name="design_type"
                    value={formData.design_type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Gold">Gold</option>
                    <option value="Silver">Silver</option>
                    <option value="Both">Both</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Jewelry Type & Weight */}
              <div className="form-row">
                <div className="form-group">
                  <label>Jewelry Type *</label>
                  <select
                    name="jewelry_type"
                    value={formData.jewelry_type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Chain">Chain</option>
                    <option value="Ring">Ring</option>
                    <option value="Bracelet">Bracelet</option>
                    <option value="Earrings">Earrings</option>
                    <option value="Necklace">Necklace</option>
                    <option value="Kada">Kada</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Desired Weight (grams) *</label>
                  <select
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="2g">2g</option>
                    <option value="5g">5g</option>
                    <option value="10g">10g</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Budget & Delivery Date */}
              <div className="form-row">
                <div className="form-group">
                  <label>Budget Range (₹)</label>
                  <input
                    type="text"
                    name="budget"
                    value={formData.budget}
                    onChange={handleInputChange}
                    placeholder="e.g., 5000 - 10000"
                  />
                </div>
                <div className="form-group">
                  <label>Delivery Date Preference</label>
                  <input
                    type="date"
                    name="delivery_date"
                    value={formData.delivery_date}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Reference Photo Upload */}
              <div className="form-group full-width">
                <label>Upload Reference Photo (JPG/PNG) *</label>
                <div className="file-upload-wrapper">
                  <input
                    type="file"
                    id="reference-photo"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                  <label htmlFor="reference-photo" className="file-upload-label">
                    {uploading ? "Uploading..." : "Click to upload or drag & drop"}
                  </label>
                </div>
                {formData.reference_image_url && (
                  <div className="image-preview-container">
                    <img src={formData.reference_image_url} alt="Reference" className="preview-image" />
                    <p>Image uploaded successfully</p>
                  </div>
                )}
              </div>

              {/* Specifications */}
              <div className="form-group full-width">
                <label>Specifications / Special Instructions</label>
                <textarea
                  name="specifications"
                  value={formData.specifications}
                  onChange={handleInputChange}
                  placeholder="Describe design details, stone preferences, size, engraving, finishing style, etc."
                  rows="5"
                />
              </div>

              {/* Submit Button */}
              <button type="submit" className="btn btn-submit" disabled={submitting || uploading}>
                {submitting ? "Submitting..." : "Submit Request"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

export default CustomDesign;
