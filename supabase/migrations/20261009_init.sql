-- Create memories table
CREATE TABLE IF NOT EXISTS public.memories (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  note TEXT DEFAULT '',
  image TEXT,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- Allow public read/write (since this is a private love website, no auth needed)
CREATE POLICY "Allow all operations" ON public.memories
  FOR ALL USING (true) WITH CHECK (true);

-- Create uploads storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to uploads bucket
CREATE POLICY "Public uploads read" ON storage.objects
  FOR SELECT USING (bucket_id = 'uploads');

CREATE POLICY "Public uploads insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "Public uploads delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'uploads');

-- Seed initial memories
INSERT INTO public.memories (id, date, note, image, images) VALUES
  ('3', '2026-09-20', 'Hayallerimi süsleyen kadın... 20/09/2026', '/facetime.jpeg', '{}'),
  ('2', '2026-08-15', 'Aşıkların şehrine, ismini veren fotoğraf, 15/08/2026', '/üsküdar.jpeg', '{}'),
  ('1', '2025-05-16', 'Aşkımın başladığı gün, 16/05/2025 ❤️', '/özbekistan.jpeg', '{}')
ON CONFLICT (id) DO NOTHING;
