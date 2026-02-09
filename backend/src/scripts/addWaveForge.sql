-- Add WaveForge to free_downloads table
INSERT INTO free_downloads (name, slug, description, version, file_size, filename, platform)
VALUES (
    'WaveForge',
    'waveforge',
    'Powerful wavetable synthesizer with advanced sound design capabilities. Shape and morph complex waveforms for unique sonic textures.',
    '1.0.0',
    '1.9 MB',
    'WaveForge.zip',
    ARRAY['Windows']
);
