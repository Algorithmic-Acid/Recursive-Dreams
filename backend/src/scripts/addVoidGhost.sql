INSERT INTO products (name, slug, description, price, category, product_type, icon, metadata)
VALUES (
  'V0ID_GHOST',
  'void-ghost',
  'Granular Haunter — Feed any sound into a 10-second circular buffer and shatter it into 64 simultaneous grains. Pitch-shift, reverse, scatter, and dissolve into pure ambient texture. Features Grain Cloud engine, Rot Engine tape saturation, Ego Death macro, Netrunner XY pad, Freeze mode, and Shimmer Reverb. The Black Moth Super Rainbow / Boards of Canada / Tim Hecker sound in a single plugin.',
  45.00,
  'software',
  'digital',
  '👻',
  '{"download_file": "V0ID_GHOST.zip", "file_size": "1.6 MB", "format": "VST3", "platform": "Windows", "version": "1.0.0"}'::jsonb
) RETURNING id, name, price;
