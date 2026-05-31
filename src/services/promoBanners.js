import { supabase } from "./supabase";

export async function fetchActiveBanners() {
  // Fetch active banners and filter by dates client-side to handle NULLs
  const { data, error } = await supabase
    .from("promo_banners")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Failed to fetch active banners:", error);
    return [];
  }

  const nowDate = new Date();
  const filtered = (data || []).filter((b) => {
    const startOk = !b.start_date || new Date(b.start_date) <= nowDate;
    const endOk = !b.end_date || new Date(b.end_date) >= nowDate;
    return startOk && endOk;
  });

  return filtered;
}

export function subscribeToBanners(handler) {
  try {
    const channel = supabase
      .channel("public:promo_banners")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "promo_banners" },
        (payload) => {
          handler(payload);
        }
      )
      .subscribe();

    return channel;
  } catch (err) {
    console.error("Realtime subscribe error:", err);
    return null;
  }
}

export async function uploadBannerImage(file) {
  if (!file) return null;
  try {
    const filePath = `banners/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const { error: uploadError } = await supabase.storage
      .from("banners")
      .upload(filePath, file, { cacheControl: "3600", upsert: false });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("banners").getPublicUrl(filePath);
    return data?.publicUrl || null;
  } catch (err) {
    console.error("Banner image upload failed:", err);
    return null;
  }
}

export async function createBanner(payload) {
  const { data, error } = await supabase.from("promo_banners").insert([payload]);
  if (error) throw error;
  return data?.[0] || null;
}

export async function updateBanner(id, updates) {
  const { data, error } = await supabase.from("promo_banners").update(updates).eq("id", id);
  if (error) throw error;
  return data?.[0] || null;
}

export async function deleteBanner(id) {
  const { error } = await supabase.from("promo_banners").delete().eq("id", id);
  if (error) throw error;
  return true;
}
