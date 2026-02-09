-- Algorithmic Acid E-Commerce Database Schema
-- PostgreSQL 12+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE product_type AS ENUM ('digital', 'physical');
CREATE TYPE product_category AS ENUM ('soundscapes', 'templates', 'music', 'software', 'shirts', 'hoodies', 'pants', 'effects_pedals', 'midi_controllers', 'synthesizers');
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE payment_method AS ENUM ('card', 'paypal', 'cash', 'xmr');
CREATE TYPE inventory_event_type AS ENUM ('purchase', 'sale', 'adjustment', 'return', 'damaged', 'restock');
CREATE TYPE forecast_confidence AS ENUM ('low', 'medium', 'high');

-- ============================================
-- CORE TABLES
-- ============================================

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product categories with hierarchy support
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    parent_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table with flexible attributes
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    category product_category NOT NULL,
    product_type product_type NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    description TEXT,
    icon VARCHAR(50) DEFAULT '📦',
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,

    -- Inventory fields
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    low_stock_threshold INTEGER DEFAULT 10,
    optimal_stock_level INTEGER,
    reorder_point INTEGER,

    -- Digital product specific
    download_url TEXT,
    file_size_mb DECIMAL(10, 2),

    -- Physical product specific (stored as JSONB for flexibility)
    physical_attributes JSONB DEFAULT '{}',

    -- SKU and supplier info
    sku VARCHAR(100) UNIQUE,
    supplier_id UUID,
    supplier_sku VARCHAR(100),
    cost_price DECIMAL(10, 2),

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers table
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    website TEXT,
    lead_time_days INTEGER DEFAULT 7,
    minimum_order_quantity INTEGER DEFAULT 1,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key for supplier_id
ALTER TABLE products ADD CONSTRAINT fk_products_supplier
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;

-- Free downloads table (for free VST plugins, etc.)
CREATE TABLE free_downloads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    version VARCHAR(50) DEFAULT '1.0.0',
    file_size VARCHAR(50),
    filename VARCHAR(255) NOT NULL,
    platform VARCHAR(100)[] DEFAULT ARRAY['Windows'],
    download_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_free_downloads_active ON free_downloads(is_active);
CREATE INDEX idx_free_downloads_slug ON free_downloads(slug);

-- Traffic logs table for visitor analytics and network monitoring
CREATE TABLE traffic_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    method VARCHAR(10) NOT NULL,
    path TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    response_time INTEGER NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for traffic logs performance
CREATE INDEX idx_traffic_timestamp ON traffic_logs(timestamp DESC);
CREATE INDEX idx_traffic_path ON traffic_logs(path);
CREATE INDEX idx_traffic_status ON traffic_logs(status_code);
CREATE INDEX idx_traffic_user ON traffic_logs(user_id);
CREATE INDEX idx_traffic_method ON traffic_logs(method);

-- Orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_number VARCHAR(50) UNIQUE NOT NULL,

    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
    status order_status DEFAULT 'pending',
    payment_status payment_status DEFAULT 'pending',
    payment_method payment_method,
    payment_intent_id VARCHAR(255),

    -- Shipping info
    shipping_full_name VARCHAR(255),
    shipping_address TEXT,
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(100),
    shipping_zip_code VARCHAR(20),
    shipping_country VARCHAR(100) DEFAULT 'United States',
    tracking_number VARCHAR(255),

    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,

    product_name VARCHAR(255) NOT NULL,
    product_icon VARCHAR(50),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INVENTORY MANAGEMENT TABLES
-- ============================================

-- Inventory events log for tracking all stock changes
CREATE TABLE inventory_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    event_type inventory_event_type NOT NULL,
    quantity_change INTEGER NOT NULL,
    quantity_before INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,

    -- Reference to related order if applicable
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,

    unit_cost DECIMAL(10, 2),
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily inventory snapshots for trend analysis
CREATE TABLE inventory_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,

    stock_quantity INTEGER NOT NULL,
    sales_count INTEGER DEFAULT 0,
    restock_count INTEGER DEFAULT 0,
    adjustment_count INTEGER DEFAULT 0,

    average_daily_sales DECIMAL(10, 2) DEFAULT 0,
    days_until_stockout INTEGER,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(product_id, snapshot_date)
);

-- Sales velocity tracking (rolling windows)
CREATE TABLE sales_velocity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

    -- Different time windows
    sales_last_7_days INTEGER DEFAULT 0,
    sales_last_30_days INTEGER DEFAULT 0,
    sales_last_90_days INTEGER DEFAULT 0,

    avg_daily_sales_7d DECIMAL(10, 2) DEFAULT 0,
    avg_daily_sales_30d DECIMAL(10, 2) DEFAULT 0,
    avg_daily_sales_90d DECIMAL(10, 2) DEFAULT 0,

    trend_direction VARCHAR(20), -- 'increasing', 'stable', 'decreasing'
    trend_percentage DECIMAL(5, 2),

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(product_id)
);

-- ============================================
-- AI INVENTORY FORECASTING TABLES
-- ============================================

-- AI-generated forecasts
CREATE TABLE inventory_forecasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

    forecast_date DATE NOT NULL,
    forecast_horizon_days INTEGER NOT NULL, -- How many days ahead

    predicted_sales INTEGER NOT NULL,
    predicted_stock_level INTEGER NOT NULL,
    recommended_reorder_quantity INTEGER,

    confidence forecast_confidence DEFAULT 'medium',
    confidence_score DECIMAL(5, 2), -- 0-100

    -- AI reasoning and context
    model_version VARCHAR(50),
    reasoning TEXT,
    factors_considered JSONB DEFAULT '{}', -- Seasonality, trends, events, etc.

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(product_id, forecast_date, forecast_horizon_days)
);

-- Purchase recommendations from AI
CREATE TABLE purchase_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,

    recommended_quantity INTEGER NOT NULL,
    recommended_order_date DATE NOT NULL,
    expected_delivery_date DATE,

    estimated_cost DECIMAL(10, 2),
    priority_level INTEGER DEFAULT 5, -- 1-10, higher is more urgent

    reason TEXT NOT NULL,
    supporting_data JSONB DEFAULT '{}',

    -- Status tracking
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, ordered, rejected
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,

    auto_purchase_enabled BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI analysis reports
CREATE TABLE inventory_ai_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_type VARCHAR(50) NOT NULL, -- 'daily_summary', 'weekly_forecast', 'alert', 'optimization'

    title VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    detailed_analysis TEXT,

    -- Affected products
    product_ids UUID[] DEFAULT '{}',

    recommendations JSONB DEFAULT '{}',
    metrics JSONB DEFAULT '{}',

    severity VARCHAR(20), -- 'info', 'warning', 'critical'

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory alerts and notifications
CREATE TABLE inventory_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

    alert_type VARCHAR(50) NOT NULL, -- 'low_stock', 'stockout', 'overstock', 'trending'
    severity VARCHAR(20) DEFAULT 'warning', -- 'info', 'warning', 'critical'

    message TEXT NOT NULL,
    current_stock INTEGER,
    threshold_value INTEGER,

    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Products
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_type ON products(product_type);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_stock ON products(stock_quantity);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_name_search ON products USING gin(to_tsvector('english', name));
CREATE INDEX idx_products_desc_search ON products USING gin(to_tsvector('english', description));

-- Orders
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_number ON orders(order_number);

-- Order Items
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- Inventory Events
CREATE INDEX idx_inventory_events_product ON inventory_events(product_id);
CREATE INDEX idx_inventory_events_type ON inventory_events(event_type);
CREATE INDEX idx_inventory_events_created ON inventory_events(created_at DESC);
CREATE INDEX idx_inventory_events_order ON inventory_events(order_id);

-- Inventory Snapshots
CREATE INDEX idx_inventory_snapshots_product ON inventory_snapshots(product_id);
CREATE INDEX idx_inventory_snapshots_date ON inventory_snapshots(snapshot_date DESC);

-- Forecasts
CREATE INDEX idx_forecasts_product ON inventory_forecasts(product_id);
CREATE INDEX idx_forecasts_date ON inventory_forecasts(forecast_date);

-- Purchase Recommendations
CREATE INDEX idx_purchase_recs_product ON purchase_recommendations(product_id);
CREATE INDEX idx_purchase_recs_status ON purchase_recommendations(status);
CREATE INDEX idx_purchase_recs_priority ON purchase_recommendations(priority_level DESC);
CREATE INDEX idx_purchase_recs_date ON purchase_recommendations(recommended_order_date);

-- Alerts
CREATE INDEX idx_alerts_product ON inventory_alerts(product_id);
CREATE INDEX idx_alerts_resolved ON inventory_alerts(is_resolved);
CREATE INDEX idx_alerts_severity ON inventory_alerts(severity);
CREATE INDEX idx_alerts_created ON inventory_alerts(created_at DESC);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log inventory changes
CREATE OR REPLACE FUNCTION log_inventory_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.stock_quantity != NEW.stock_quantity) THEN
        INSERT INTO inventory_events (
            product_id,
            event_type,
            quantity_change,
            quantity_before,
            quantity_after,
            notes
        ) VALUES (
            NEW.id,
            'adjustment',
            NEW.stock_quantity - OLD.stock_quantity,
            OLD.stock_quantity,
            NEW.stock_quantity,
            'Stock quantity updated'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER track_product_stock_changes
    AFTER UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION log_inventory_change();

-- Function to create alerts when stock is low
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stock_quantity <= NEW.low_stock_threshold AND
       (OLD.stock_quantity IS NULL OR OLD.stock_quantity > NEW.low_stock_threshold) THEN
        INSERT INTO inventory_alerts (
            product_id,
            alert_type,
            severity,
            message,
            current_stock,
            threshold_value
        ) VALUES (
            NEW.id,
            'low_stock',
            CASE
                WHEN NEW.stock_quantity = 0 THEN 'critical'
                WHEN NEW.stock_quantity <= NEW.low_stock_threshold / 2 THEN 'warning'
                ELSE 'info'
            END,
            format('Product "%s" stock is low: %s units remaining', NEW.name, NEW.stock_quantity),
            NEW.stock_quantity,
            NEW.low_stock_threshold
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER alert_on_low_stock
    AFTER INSERT OR UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION check_low_stock();

-- Function to calculate order total
CREATE OR REPLACE FUNCTION calculate_order_total()
RETURNS TRIGGER AS $$
DECLARE
    new_total DECIMAL(10, 2);
BEGIN
    SELECT COALESCE(SUM(total_price), 0)
    INTO new_total
    FROM order_items
    WHERE order_id = COALESCE(NEW.order_id, OLD.order_id);

    UPDATE orders
    SET total_amount = new_total
    WHERE id = COALESCE(NEW.order_id, OLD.order_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_order_total_on_item_change
    AFTER INSERT OR UPDATE OR DELETE ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION calculate_order_total();

-- ============================================
-- VIEWS FOR ANALYTICS
-- ============================================

-- View for products needing reorder
CREATE OR REPLACE VIEW products_needing_reorder AS
SELECT
    p.id,
    p.name,
    p.sku,
    p.category,
    p.stock_quantity,
    p.low_stock_threshold,
    p.reorder_point,
    p.optimal_stock_level,
    sv.avg_daily_sales_30d,
    CASE
        WHEN sv.avg_daily_sales_30d > 0
        THEN FLOOR(p.stock_quantity / sv.avg_daily_sales_30d)
        ELSE 999
    END as days_until_stockout,
    s.name as supplier_name,
    s.lead_time_days
FROM products p
LEFT JOIN sales_velocity sv ON p.id = sv.product_id
LEFT JOIN suppliers s ON p.supplier_id = s.id
WHERE p.is_active = TRUE
  AND (p.stock_quantity <= p.reorder_point OR p.stock_quantity <= p.low_stock_threshold);

-- View for inventory health dashboard
CREATE OR REPLACE VIEW inventory_health_summary AS
SELECT
    p.id,
    p.name,
    p.category,
    p.stock_quantity,
    p.low_stock_threshold,
    sv.avg_daily_sales_30d,
    sv.trend_direction,
    CASE
        WHEN p.stock_quantity = 0 THEN 'out_of_stock'
        WHEN p.stock_quantity <= p.low_stock_threshold THEN 'low'
        WHEN p.stock_quantity > p.optimal_stock_level * 1.5 THEN 'overstock'
        ELSE 'healthy'
    END as stock_status,
    (SELECT COUNT(*) FROM inventory_alerts
     WHERE product_id = p.id AND is_resolved = FALSE) as active_alerts
FROM products p
LEFT JOIN sales_velocity sv ON p.id = sv.product_id
WHERE p.is_active = TRUE;
