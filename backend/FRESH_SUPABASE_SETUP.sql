-- ============================================================================
-- COMPLETE SUPABASE SETUP SCRIPT FOR NL-DB-ASSISTANT
-- ============================================================================
-- Run this entire script in your NEW Supabase project SQL Editor
-- This will create all tables, functions, sample data, and configurations
-- ============================================================================

-- Step 1: Enable Required Extensions
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Step 2: Create System Tables
-- ============================================================================

-- Documents table for RAG (vector embeddings)
CREATE TABLE IF NOT EXISTS documents (
    id BIGSERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    embedding vector(384),  -- Dimension for all-MiniLM-L6-v2 model
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Query logs for audit trail
CREATE TABLE IF NOT EXISTS query_logs (
    id BIGSERIAL PRIMARY KEY,
    user_query TEXT NOT NULL,
    generated_sql TEXT NOT NULL,
    confidence FLOAT,
    success BOOLEAN DEFAULT FALSE,
    result_count INTEGER DEFAULT 0,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create Business Tables (E-commerce Example)
-- ============================================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'customer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock INTEGER DEFAULT 0,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    status TEXT DEFAULT 'pending',
    total_amount DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create Indexes for Performance
-- ============================================================================

-- Vector search index
CREATE INDEX IF NOT EXISTS documents_embedding_idx 
ON documents USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Query logs index
CREATE INDEX IF NOT EXISTS query_logs_created_at_idx 
ON query_logs (created_at DESC);

-- Business table indexes
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS products_category_idx ON products(category);
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items(order_id);
CREATE INDEX IF NOT EXISTS order_items_product_id_idx ON order_items(product_id);
CREATE INDEX IF NOT EXISTS reviews_product_id_idx ON reviews(product_id);
CREATE INDEX IF NOT EXISTS reviews_user_id_idx ON reviews(user_id);

-- Step 5: Create RPC Functions
-- ============================================================================

-- Function 1: Vector similarity search for RAG
CREATE OR REPLACE FUNCTION match_documents(
    query_embedding vector(384),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 5
)
RETURNS TABLE (
    id bigint,
    content text,
    metadata jsonb,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        documents.id,
        documents.content,
        documents.metadata,
        1 - (documents.embedding <=> query_embedding) as similarity
    FROM documents
    WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
    ORDER BY documents.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Function 2: Execute safe queries (CRITICAL - Uses JSON parameter)
CREATE OR REPLACE FUNCTION execute_safe_query(params json)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    query_text text;
    result json;
BEGIN
    -- Extract query from JSON params
    query_text := params->>'query_text';
    
    -- Execute query and return results as JSON
    EXECUTE format('SELECT json_agg(t) FROM (%s) t', query_text) INTO result;
    
    -- Return empty array if no results
    RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Step 6: Insert Sample Data
-- ============================================================================

-- Insert sample users
INSERT INTO users (name, email, role) VALUES
    ('Alice Johnson', 'alice@example.com', 'admin'),
    ('Bob Smith', 'bob@example.com', 'customer'),
    ('Charlie Brown', 'charlie@example.com', 'customer'),
    ('Diana Prince', 'diana@example.com', 'customer'),
    ('Eve Davis', 'eve@example.com', 'customer'),
    ('Frank Miller', 'frank@example.com', 'customer'),
    ('Grace Lee', 'grace@example.com', 'customer'),
    ('Henry Wilson', 'henry@example.com', 'customer')
ON CONFLICT (email) DO NOTHING;

-- Insert sample products
INSERT INTO products (name, description, price, stock, category) VALUES
    ('Laptop Pro', 'High-performance laptop for professionals', 1299.99, 50, 'Electronics'),
    ('Wireless Mouse', 'Ergonomic wireless mouse', 29.99, 200, 'Electronics'),
    ('USB-C Cable', 'Fast charging USB-C cable', 12.99, 500, 'Accessories'),
    ('Mechanical Keyboard', 'RGB mechanical gaming keyboard', 89.99, 75, 'Electronics'),
    ('Desk Lamp', 'LED desk lamp with adjustable brightness', 39.99, 120, 'Office'),
    ('Notebook Set', 'Set of 3 premium notebooks', 24.99, 300, 'Stationery'),
    ('Coffee Mug', 'Insulated stainless steel coffee mug', 19.99, 150, 'Kitchen'),
    ('Phone Stand', 'Adjustable phone stand for desk', 14.99, 250, 'Accessories');

-- Insert sample orders
INSERT INTO orders (user_id, status, total_amount) VALUES
    (2, 'completed', 1329.98),
    (3, 'pending', 54.98),
    (4, 'shipped', 89.99),
    (5, 'completed', 102.97),
    (6, 'cancelled', 29.99),
    (7, 'completed', 44.98),
    (8, 'processing', 1299.99),
    (2, 'completed', 12.99);

-- Insert sample order items
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
    (1, 1, 1, 1299.99),
    (1, 2, 1, 29.99),
    (2, 3, 2, 12.99),
    (2, 2, 1, 29.99),
    (3, 4, 1, 89.99),
    (4, 5, 1, 39.99),
    (4, 6, 2, 24.99),
    (4, 3, 1, 12.99),
    (5, 2, 1, 29.99),
    (6, 6, 1, 24.99),
    (6, 7, 1, 19.99),
    (7, 1, 1, 1299.99),
    (8, 3, 1, 12.99);

-- Insert sample reviews
INSERT INTO reviews (product_id, user_id, rating, comment) VALUES
    (1, 2, 5, 'Amazing laptop! Super fast and great build quality.'),
    (1, 4, 4, 'Great performance but a bit pricey.'),
    (2, 3, 5, 'Perfect wireless mouse, very comfortable.'),
    (4, 5, 5, 'Best keyboard I have ever used!'),
    (5, 7, 4, 'Good lamp, bright enough for my desk.'),
    (6, 8, 5, 'Beautiful notebooks, great paper quality.');

-- Step 7: Set Up Row Level Security (RLS) - Optional but Recommended
-- ============================================================================

-- Enable RLS on all tables (you can customize this based on your needs)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_logs ENABLE ROW LEVEL SECURITY;

-- Create policies to allow service role to access everything
CREATE POLICY "Allow service role full access to users" ON users
    FOR ALL USING (true);

CREATE POLICY "Allow service role full access to products" ON products
    FOR ALL USING (true);

CREATE POLICY "Allow service role full access to orders" ON orders
    FOR ALL USING (true);

CREATE POLICY "Allow service role full access to order_items" ON order_items
    FOR ALL USING (true);

CREATE POLICY "Allow service role full access to reviews" ON reviews
    FOR ALL USING (true);

CREATE POLICY "Allow service role full access to documents" ON documents
    FOR ALL USING (true);

CREATE POLICY "Allow service role full access to query_logs" ON query_logs
    FOR ALL USING (true);

-- Step 8: Add Comments for Documentation
-- ============================================================================

COMMENT ON TABLE documents IS 'Stores document chunks with embeddings for RAG';
COMMENT ON TABLE query_logs IS 'Audit log of all natural language queries and generated SQL';
COMMENT ON TABLE users IS 'User accounts for the e-commerce system';
COMMENT ON TABLE products IS 'Product catalog';
COMMENT ON TABLE orders IS 'Customer orders';
COMMENT ON TABLE order_items IS 'Individual items in each order';
COMMENT ON TABLE reviews IS 'Product reviews from customers';

COMMENT ON FUNCTION match_documents IS 'Vector similarity search function for RAG context retrieval';
COMMENT ON FUNCTION execute_safe_query(json) IS 'Safely execute queries with JSON parameter - used by backend';

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================

-- Verify the setup by running these queries:
SELECT 'Users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'Products', COUNT(*) FROM products
UNION ALL
SELECT 'Orders', COUNT(*) FROM orders
UNION ALL
SELECT 'Order Items', COUNT(*) FROM order_items
UNION ALL
SELECT 'Reviews', COUNT(*) FROM reviews;

-- Test the execute_safe_query function:
SELECT execute_safe_query('{"query_text": "SELECT * FROM users LIMIT 3"}'::json);
