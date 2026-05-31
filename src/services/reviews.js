import { supabase } from "./supabase";

export async function getReviews(productId, sort = "latest") {
  if (!productId) return [];

  let query = supabase.from("reviews").select("*").eq("product_id", productId);

  if (sort === "latest") query = query.order("created_at", { ascending: false });
  if (sort === "highest") query = query.order("rating", { ascending: false });
  if (sort === "lowest") query = query.order("rating", { ascending: true });

  const { data, error } = await query;
  if (error) {
    console.error("getReviews error:", error);
    return [];
  }

  return data;
}

export async function upsertReview({ userId, productId, rating, review_text }) {
  if (!userId || !productId) throw new Error("Missing userId or productId");
  if (!rating) throw new Error("Rating required");

  // Check if exists
  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .match({ user_id: userId, product_id: productId })
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("reviews")
      .update({ rating, review_text, updated_at: new Date() })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) {
      console.error("upsertReview update error:", error);
      throw error;
    }

    return data;
  }

  const { data, error } = await supabase
    .from("reviews")
    .insert([{ user_id: userId, product_id: productId, rating, review_text }])
    .select()
    .single();

  if (error) {
    console.error("upsertReview insert error:", error);
    throw error;
  }

  return data;
}

export async function getRatingSummary(productId) {
  if (!productId) return { avg: 0, count: 0 };
  const { data, error } = await supabase
    .from("reviews")
    .select("rating", { count: "exact" })
    .eq("product_id", productId);

  if (error) {
    console.error("getRatingSummary error:", error);
    return { avg: 0, count: 0 };
  }

  const count = data.length || 0;
  const avg = count ? data.reduce((s, r) => s + (Number(r.rating) || 0), 0) / count : 0;
  return { avg: Number(avg.toFixed(2)), count };
}
