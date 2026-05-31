import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [metalType, setMetalType] = useState("gold");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase.from("categories").select("*").order("created_at", { ascending: false });
    if (!error) setCategories(data || []);
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) setImage(file);
  };

  const addCategory = async (e) => {
    e.preventDefault();
    if (!name || !metalType || !image) return alert("Fill all fields");
    setLoading(true);
    try {
      const fileName = `${Date.now()}-${image.name}`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, image);
      if (uploadError) throw uploadError;
      const imageUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${fileName}`;
      const { error } = await supabase.from("categories").insert([{ name, metal_type: metalType, image_url: imageUrl }]);
      if (error) throw error;
      setName("");
      setImage(null);
      fetchCategories();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id) => {
    if (!confirm("Delete category?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return alert(error.message);
    fetchCategories();
  };

  return (
    <div className="category-manager">
      <div className="section-header">
        <h2>Category Manager</h2>
        <p>Add, edit, or delete categories for Gold and Silver</p>
      </div>

      <form onSubmit={addCategory} className="product-form">
        <div className="form-group">
          <label>Category Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Metal Type</label>
          <select value={metalType} onChange={(e) => setMetalType(e.target.value)}>
            <option value="gold">Gold</option>
            <option value="silver">Silver</option>
          </select>
        </div>
        <div className="form-group">
          <label>Category Image</label>
          <input type="file" accept="image/*" onChange={handleImage} required />
        </div>
        <button className="btn-submit" type="submit" disabled={loading}>{loading ? "Adding..." : "Add Category"}</button>
      </form>

      <div className="categories-list">
        {categories.map((c) => (
          <div key={c.id} className="category-row">
            <img src={c.image_url} alt={c.name} width={80} />
            <div style={{marginLeft:12}}>
              <strong>{c.name}</strong>
              <div>{c.metal_type}</div>
            </div>
            <div style={{marginLeft:12}}>
              <button className="btn" onClick={() => deleteCategory(c.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
