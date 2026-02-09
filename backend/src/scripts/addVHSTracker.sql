-- Add VHS Tracker product to the database
-- Run this on the production PostgreSQL database

-- First, get the Digital Dreams Distribution supplier ID
DO $$
DECLARE
    digital_supplier_id UUID;
BEGIN
    SELECT id INTO digital_supplier_id FROM suppliers WHERE name LIKE '%Digital%' LIMIT 1;

    -- Insert VHS Tracker product
    INSERT INTO products (
        name, slug, category, product_type, price, description, icon,
        stock_quantity, low_stock_threshold, optimal_stock_level,
        supplier_id, cost_price, sku, metadata
    ) VALUES (
        'VHS Tracker',
        'vhs-tracker',
        'software',
        'digital',
        15.00,
        'Emulates a VCR losing its tracking — the sound of actual failure. Horizontal dropout lines, color bleeding, tape hiss/rumble, and random sync loss glitches. 4 controls: Tracking Instability, Head Wear, Tape Age, Signal Strength.',
        '📼',
        9999,
        1,
        9999,
        digital_supplier_id,
        0,
        'VHSTRACKER',
        '{"pricing_variants": [{"id": "pay", "name": "Pay $15", "price": 15.00, "description": "Support the void"}, {"id": "steal", "name": "Steal It", "price": 0, "description": "Take it for free, no judgment"}], "download_file": "VHSTracker.zip", "is_downloadable": true}'::jsonb
    )
    ON CONFLICT (slug) DO UPDATE SET
        price = EXCLUDED.price,
        description = EXCLUDED.description,
        metadata = EXCLUDED.metadata,
        updated_at = CURRENT_TIMESTAMP;

    -- Initialize sales velocity for the new product
    INSERT INTO sales_velocity (
        product_id,
        sales_last_7_days,
        sales_last_30_days,
        sales_last_90_days,
        avg_daily_sales_7d,
        avg_daily_sales_30d,
        avg_daily_sales_90d,
        trend_direction
    )
    SELECT id, 0, 0, 0, 0, 0, 0, 'stable'
    FROM products WHERE slug = 'vhs-tracker'
    ON CONFLICT (product_id) DO NOTHING;

    RAISE NOTICE 'VHS Tracker product added successfully!';
END $$;
