-- Fiber Management System - PostgreSQL Schema
-- Run this to set up the database manually if needed

CREATE DATABASE fiber_management;

\c fiber_management;

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'user' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ports table
CREATE TABLE ports (
    id SERIAL PRIMARY KEY,
    equipment_name VARCHAR(100) NOT NULL,
    equipment_ip VARCHAR(50) NOT NULL,
    equipment_type VARCHAR(50) NOT NULL,
    port_number VARCHAR(50) NOT NULL,
    port_type VARCHAR(50) NOT NULL,
    fibre_tag VARCHAR(50),
    ddf_name VARCHAR(50),
    ddf_port VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DDF Log table
CREATE TABLE ddf_log (
    id SERIAL PRIMARY KEY,
    ddf_name VARCHAR(100) NOT NULL,
    ddf_port VARCHAR(50) NOT NULL,
    connected_to VARCHAR(100),
    connection_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- OFC Routes table
CREATE TABLE ofc_routes (
    id SERIAL PRIMARY KEY,
    route_name VARCHAR(100) NOT NULL,
    start_location VARCHAR(100) NOT NULL,
    end_location VARCHAR(100) NOT NULL,
    route_length NUMERIC(10, 2),
    fiber_count INTEGER,
    core_utilization INTEGER,
    status VARCHAR(20) DEFAULT 'active',
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs table
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_ports_status ON ports(status);
CREATE INDEX idx_ports_equipment_name ON ports(equipment_name);
CREATE INDEX idx_ports_fibre_tag ON ports(fibre_tag);
CREATE INDEX idx_ddf_log_ddf_name ON ddf_log(ddf_name);
CREATE INDEX idx_ddf_log_status ON ddf_log(status);
CREATE INDEX idx_ofc_routes_status ON ofc_routes(status);
CREATE INDEX idx_ofc_routes_route_name ON ofc_routes(route_name);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
