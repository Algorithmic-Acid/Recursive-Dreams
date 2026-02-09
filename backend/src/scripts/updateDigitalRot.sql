-- Update Digital Rot to have "Pay $25" and "Steal It" pricing variants
-- Run this against your PostgreSQL database

UPDATE products
SET metadata = '{"pricing_variants": [{"id": "standard", "name": "Pay $25", "price": 25.00, "description": "Support the void"}, {"id": "steal", "name": "Steal It", "price": 0, "description": "Take it for free, no judgment"}], "download_file": "DigitalRot.zip", "is_downloadable": true}'::jsonb,
    updated_at = CURRENT_TIMESTAMP
WHERE slug = 'digital-rot';

-- Verify the update
SELECT name, slug, price, metadata FROM products WHERE slug = 'digital-rot';
