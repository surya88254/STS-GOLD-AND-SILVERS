import { supabase } from "./supabase";

export async function fetchWishlistIds(userId) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from("wishlist")
    .select("product_id")
    .eq("user_id", userId);

  if (error) {
    console.error("fetchWishlistIds error:", error);
    return [];
  }

  return data.map((r) => r.product_id);
}

export async function fetchWishlistEntries(userId) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from("wishlist")
    .select("id, product_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchWishlistEntries error:", error);
    return [];
  }

  return data;
}

export async function addToWishlist(userId, productId) {
  if (!userId || !productId) throw new Error("Missing user or product id");

  // Prevent duplicates by checking existence first
  const { data: existing, error: existErr } = await supabase
    .from("wishlist")
    .select("id")
    .match({ user_id: userId, product_id: productId })
    .maybeSingle();

  if (existErr) console.warn("wishlist exist check error:", existErr);
  if (existing) return existing;

  const { data, error } = await supabase
    .from("wishlist")
    .insert([{ user_id: userId, product_id: productId }])
    .select()
    .single();

  if (error) {
    console.error("addToWishlist error:", error);
    throw error;
  }

  return data;
}

export async function removeFromWishlist(userId, productId) {
  if (!userId || !productId) throw new Error("Missing user or product id");

  const { data, error } = await supabase
    .from("wishlist")
    .delete()
    .match({ user_id: userId, product_id: productId });

  if (error) {
    console.error("removeFromWishlist error:", error);
    throw error;
  }

  return data;
}
