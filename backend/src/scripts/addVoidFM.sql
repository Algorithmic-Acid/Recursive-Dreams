-- Add VoidFM free VST plugin
INSERT INTO free_downloads (
  id,
  name,
  slug,
  description,
  version,
  file_size,
  filename,
  platform,
  download_count,
  is_active
) VALUES (
  uuid_generate_v4(),
  'Void FM',
  'void-fm',
  'A powerful FM synthesizer VST3 plugin featuring multiple operators, modulation routing, and ethereal sound design capabilities. Perfect for creating evolving pads, aggressive basses, and experimental textures. Includes preset management and a sleek cyberpunk interface.',
  '1.0.0',
  '1.6 MB',
  'VoidFM.zip',
  ARRAY['Windows'],
  0,
  TRUE
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  version = EXCLUDED.version,
  file_size = EXCLUDED.file_size,
  filename = EXCLUDED.filename,
  updated_at = CURRENT_TIMESTAMP;

-- Also add it to products table for visibility
INSERT INTO products (
  id,
  name,
  slug,
  category,
  product_type,
  price,
  description,
  icon,
  image_url,
  is_active,
  stock_quantity,
  metadata
) VALUES (
  uuid_generate_v4(),
  'Void FM',
  'void-fm',
  'software',
  'digital',
  0.00,
  'A powerful FM synthesizer VST3 plugin featuring multiple operators, modulation routing, and ethereal sound design capabilities. Perfect for creating evolving pads, aggressive basses, and experimental textures. Includes preset management and a sleek cyberpunk interface.',
  '🎹',
  '/images/voidfm.jpg',
  TRUE,
  999999,
  '{"download_file": "VoidFM.zip", "vst_type": "VST3", "free": true, "tags": ["FM Synthesis", "Synthesizer", "Sound Design", "Free"]}'::jsonb
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata,
  updated_at = CURRENT_TIMESTAMP;
