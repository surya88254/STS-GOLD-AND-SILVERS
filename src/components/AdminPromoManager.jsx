import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import "../styles/PromoBanner.css";

export default function AdminPromoManager() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [form, setForm] = useState({
    id: null,
    title: "",
    subtitle: "",
    description: "",
    button_text: "Shop Now",
    button_link: "/",
    image_url: "",
    bg_color: "#0b0b0b",
    display_order: 1,
    is_active: true,
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    return () => {
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    };
  }, [bannerPreview]);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("promo_banners").select("*").order("display_order", { ascending: true });
      if (error) throw error;
      setList(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setBannerFile(null);
    setBannerPreview(null);
    setForm({
      id: null,
      title: "",
      subtitle: "",
      description: "",
      button_text: "Shop Now",
      button_link: "/",
      image_url: "",
      bg_color: "#0b0b0b",
      display_order: 1,
      is_active: true,
      start_date: "",
      end_date: "",
    });
  }

  async function uploadBannerToStorage(file) {
    if (!file) return null;
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("banners")
        .upload(fileName, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        alert("Upload failed");
        return null;
      }

      const { data } = supabase.storage.from("banners").getPublicUrl(fileName);
      return data?.publicUrl || null;
    } catch (err) {
      console.error(err);
      alert("Upload failed");
      return null;
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (!bannerFile && !form.image_url) {
        alert("Select image");
        setLoading(false);
        return;
      }

      let image_url = form.image_url;
      if (bannerFile) {
        const uploadedUrl = await uploadBannerToStorage(bannerFile);
        if (!uploadedUrl) {
          setLoading(false);
          return;
        }
        image_url = uploadedUrl;
      }

      const payload = {
        title: form.title,
        subtitle: form.subtitle,
        description: form.description,
        button_text: form.button_text,
        button_link: form.button_link,
        image_url,
        bg_color: form.bg_color,
        display_order: Number(form.display_order) || 1,
        is_active: !!form.is_active,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      };

      if (form.id) {
        const { error } = await supabase.from("promo_banners").update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("promo_banners").insert([payload]);
        if (error) throw error;
      }

      await loadAll();
      resetForm();
    } catch (err) {
      console.error(err);
      alert("Failed to save banner");
    } finally {
      setLoading(false);
    }
  }

  function onEdit(b) {
    setBannerFile(null);
    setBannerPreview(null);
    setForm({
      id: b.id,
      title: b.title || "",
      subtitle: b.subtitle || "",
      description: b.description || "",
      button_text: b.button_text || "Shop Now",
      button_link: b.button_link || "/",
      image_url: b.image_url || "",
      bg_color: b.bg_color || "#0b0b0b",
      display_order: b.display_order || 1,
      is_active: b.is_active || false,
      start_date: b.start_date ? b.start_date.split("T")[0] : "",
      end_date: b.end_date ? b.end_date.split("T")[0] : "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onDelete(id) {
    if (!confirm("Delete this banner?")) return;
    setLoading(true);
    try {
      const { data: bannerData, error: fetchErr } = await supabase
        .from("promo_banners")
        .select("image_url")
        .eq("id", id)
        .single();
      if (fetchErr) throw fetchErr;
      const imageUrl = bannerData?.image_url;

      if (imageUrl) {
        try {
          const parsed = new URL(imageUrl);
          const parts = parsed.pathname.split("/storage/v1/object/public/");
          if (parts.length === 2) {
            const objectPath = parts[1];
            const pathParts = objectPath.split('/');
            const bucket = pathParts[0];
            const filePath = pathParts.slice(1).join('/');
            if (bucket && filePath) {
              const { error: delErr } = await supabase.storage.from(bucket).remove([filePath]);
              if (delErr) console.warn('Failed to remove storage file:', delErr);
            }
          }
        } catch (e) {
          console.warn('Could not parse or delete storage file for', imageUrl, e);
        }
      }

      const { error } = await supabase.from("promo_banners").delete().eq("id", id);
      if (error) throw error;
      await loadAll();
    } catch (err) {
      console.error(err);
      alert("Failed to delete");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(b) {
    try {
      const { error } = await supabase.from("promo_banners").update({ is_active: !b.is_active }).eq("id", b.id);
      if (error) throw error;
      await loadAll();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="promo-admin">
      <div className="promo-admin-form admin-card glass-gold">
        <h3>📢 Promo Banner Manager</h3>
        <form onSubmit={handleSubmit} className="promo-form">
          <div className="form-row">
            <label>Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>

          <div className="form-row">
            <label>Subtitle</label>
            <input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
          </div>

          <div className="form-row full">
            <label>Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          </div>

          <div className="form-row">
            <label>Button Text</label>
            <input value={form.button_text} onChange={(e) => setForm({ ...form, button_text: e.target.value })} />
          </div>

          <div className="form-row">
            <label>Button Link</label>
            <input value={form.button_link} onChange={(e) => setForm({ ...form, button_link: e.target.value })} />
          </div>

          <div className="form-row">
            <label>Background Color</label>
            <input type="color" value={form.bg_color} onChange={(e) => setForm({ ...form, bg_color: e.target.value })} />
          </div>

          <div className="form-row">
            <label>Display Order</label>
            <input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: e.target.value })} />
          </div>

          <div className="form-row">
            <label>Start Date</label>
            <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          </div>

          <div className="form-row">
            <label>End Date</label>
            <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          </div>

          <div className="form-row full image-upload-panel">
            <label>Banner Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setBannerFile(file);
                if (file) {
                  const url = URL.createObjectURL(file);
                  setBannerPreview(url);
                } else {
                  setBannerPreview(null);
                }
              }}
            />
            {bannerPreview && (
              <div className="image-preview">
                <img src={bannerPreview} alt="preview" />
              </div>
            )}
            {!bannerPreview && form.image_url && (
              <div className="image-preview">
                <img src={form.image_url} alt="preview" />
              </div>
            )}
          </div>

          <div className="form-row">
            <label>Active</label>
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Saving..." : form.id ? "Update Banner" : "Add Banner"}</button>
            <button type="button" className="btn" onClick={resetForm}>Reset</button>
          </div>
        </form>
      </div>

      <div className="promo-admin-list admin-card glass">
        <h4>Existing Banners</h4>
        {loading ? <p>Loading...</p> : (
          <div className="banner-list">
            {list.map((b) => (
              <div key={b.id} className="banner-item glass-gold">
                <div className="banner-left">
                  <img src={b.image_url} alt={b.title} />
                </div>
                <div className="banner-mid">
                  <strong>{b.title}</strong>
                  <div className="small">{b.subtitle}</div>
                  <div className="small muted">{b.description}</div>
                </div>
                <div className="banner-actions">
                  <button className="btn" onClick={() => onEdit(b)}>Edit</button>
                  <button className="btn" onClick={() => onDelete(b.id)}>Delete</button>
                  <button className="btn" onClick={() => toggleActive(b)}>{b.is_active ? "Deactivate" : "Activate"}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
