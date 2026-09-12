-- =========================================================================
-- CONDOACCESS - DATABASE SCHEMA (PostgreSQL)
-- Optimized for Supabase Cloud Database
-- Target: Condomínio Residencial Jardins do Tatuapé (5 blocks, 340 apartments)
-- Developed by: Ana Carolina (Database Lead)
-- =========================================================================

-- Enable UUID generation extension if not active
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table: apartments
CREATE TABLE IF NOT EXISTS apartments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    block VARCHAR(10) NOT NULL, -- 'A', 'B', 'C', 'D', 'E'
    number VARCHAR(10) NOT NULL, -- Apartment number (e.g. '12', '104')
    floor INT NOT NULL, -- Floor index
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_block_number UNIQUE (block, number)
);

-- 2. Table: users
-- Captures residents, doormen (porteiros), janitors (zeladores, e.g. Sr. Francisco), and administrators
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('resident', 'doorman', 'janitor', 'administrator')),
    apartment_id UUID REFERENCES apartments(id) ON DELETE SET NULL, -- NULL for employees
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table: visitors
CREATE TABLE IF NOT EXISTS visitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    document_id VARCHAR(30) UNIQUE, -- CPF or RG for portaria identification
    visitor_type VARCHAR(30) NOT NULL CHECK (visitor_type IN ('visitor', 'contractor', 'delivery_person')),
    company VARCHAR(100), -- Nullable, used if contractor or delivery
    photo_url TEXT, -- Accessibility: helpful for visual verification by residents with low vision
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Table: visit_records (Replaces the paper logbooks)
CREATE TABLE IF NOT EXISTS visit_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visitor_id UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
    apartment_id UUID NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
    registered_by UUID NOT NULL REFERENCES users(id), -- Doorman who registered the entry
    entry_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    exit_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    notes TEXT
);

-- 5. Table: delivery_packages (Replaces manual package logging)
CREATE TABLE IF NOT EXISTS delivery_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    apartment_id UUID NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
    description TEXT NOT NULL, -- e.g. "Amazon Box", "Sedex Envelope"
    tracking_code VARCHAR(100),
    status VARCHAR(20) DEFAULT 'received' CHECK (status IN ('received', 'delivered')),
    received_by UUID NOT NULL REFERENCES users(id), -- Porteiro who received the delivery
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_to UUID REFERENCES users(id), -- Resident who collected it
    delivered_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- =========================================================================
-- DATABASE INDEXES FOR QUERY OPTIMIZATION
-- =========================================================================
-- Indexes accelerate searching during peak hours at the gate (portaria)
CREATE INDEX IF NOT EXISTS idx_apartments_block ON apartments(block);
CREATE INDEX IF NOT EXISTS idx_users_apartment ON users(apartment_id);
CREATE INDEX IF NOT EXISTS idx_visit_records_status ON visit_records(status);
CREATE INDEX IF NOT EXISTS idx_delivery_packages_status ON delivery_packages(status);
CREATE INDEX IF NOT EXISTS idx_delivery_packages_apartment ON delivery_packages(apartment_id);
