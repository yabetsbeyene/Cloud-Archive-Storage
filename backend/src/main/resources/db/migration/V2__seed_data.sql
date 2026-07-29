-- ============================================================================
-- V2__seed_data.sql
-- Organizational Digital Archive & Records Management System
--
-- Inserts initial master data.
--
-- Author: Guyo Boru
-- Version: 1.0
-- ============================================================================


-- ============================================================================
-- 1. DEPARTMENTS
-- ============================================================================

INSERT INTO departments
(
    department_id,
    name,
    description
)
VALUES

(
    gen_random_uuid(),
    'Administration',
    'Administrative Department'
),

(
    gen_random_uuid(),
    'Finance',
    'Finance and Accounting Department'
),

(
    gen_random_uuid(),
    'Human Resources',
    'Human Resource Management Department'
),

(
    gen_random_uuid(),
    'ICT',
    'Information and Communication Technology Department'
),

(
    gen_random_uuid(),
    'Procurement',
    'Procurement and Asset Management Department'
),

(
    gen_random_uuid(),
    'Legal',
    'Legal Affairs Department'
);



-- ============================================================================
-- 2. CATEGORIES
-- ============================================================================

INSERT INTO categories
(
    category_id,
    name,
    description,
    retention_period_months
)
VALUES

(
    gen_random_uuid(),
    'Policies',
    'Organizational policies and procedures',
    60
),

(
    gen_random_uuid(),
    'Contracts',
    'Contracts and agreements',
    120
),

(
    gen_random_uuid(),
    'Reports',
    'Operational and annual reports',
    36
),

(
    gen_random_uuid(),
    'Invoices',
    'Financial invoices',
    84
),

(
    gen_random_uuid(),
    'Letters',
    'Official correspondence',
    24
),

(
    gen_random_uuid(),
    'Circulars',
    'Internal circulars and notices',
    12
),

(
    gen_random_uuid(),
    'Meeting Minutes',
    'Minutes of meetings',
    60
);


