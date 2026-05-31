-- Create promo_banners table for Supabase
CREATE TABLE IF NOT EXISTS promo_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  subtitle TEXT,
  description TEXT,
  button_text TEXT,
  button_link TEXT,
  image_url TEXT,
  bg_color TEXT DEFAULT '#111111',
  display_order INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_promo_banners_active ON promo_banners(is_active);
CREATE INDEX IF NOT EXISTS idx_promo_banners_display_order ON promo_banners(display_order);
