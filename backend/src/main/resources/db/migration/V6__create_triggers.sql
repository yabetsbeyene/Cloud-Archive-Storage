-- ============================================================================
-- V6__create_triggers.sql
-- Organizational Digital Archive & Records Management System
--
-- Description:
-- Creates database trigger functions and triggers for automatic
-- timestamp updates and document reference generation.
--
-- Author: Guyo Boru
-- Version: 1.0
-- ============================================================================



-- ============================================================================
-- 1. AUTO UPDATE TIMESTAMP FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()

RETURNS TRIGGER

LANGUAGE plpgsql

AS
$$

BEGIN

    NEW.updated_at = NOW();

    RETURN NEW;

END;

$$;



-- ============================================================================
-- 2. AUTO GENERATE DOCUMENT REFERENCE FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_document_reference()

RETURNS TRIGGER

LANGUAGE plpgsql

AS
$$

BEGIN

    IF NEW.reference_number IS NULL
       OR TRIM(NEW.reference_number) = '' THEN

        NEW.reference_number := generate_reference_number();

    END IF;

    RETURN NEW;

END;

$$;



-- ============================================================================
-- 3. DEPARTMENTS
-- ============================================================================

CREATE TRIGGER trg_departments_updated_at

BEFORE UPDATE

ON departments

FOR EACH ROW

EXECUTE FUNCTION update_updated_at_column();



-- ============================================================================
-- 4. CATEGORIES
-- ============================================================================

CREATE TRIGGER trg_categories_updated_at

BEFORE UPDATE

ON categories

FOR EACH ROW

EXECUTE FUNCTION update_updated_at_column();



-- ============================================================================
-- 5. USERS
-- ============================================================================

CREATE TRIGGER trg_users_updated_at

BEFORE UPDATE

ON users

FOR EACH ROW

EXECUTE FUNCTION update_updated_at_column();



-- ============================================================================
-- 6. DOCUMENTS
-- ============================================================================

CREATE TRIGGER trg_documents_updated_at

BEFORE UPDATE

ON documents

FOR EACH ROW

EXECUTE FUNCTION update_updated_at_column();



-- ============================================================================
-- 7. DOCUMENT NOTES
-- ============================================================================

CREATE TRIGGER trg_document_notes_updated_at

BEFORE UPDATE

ON document_notes

FOR EACH ROW

EXECUTE FUNCTION update_updated_at_column();



-- ============================================================================
-- 8. DOCUMENT REFERENCE GENERATOR
-- ============================================================================

CREATE TRIGGER trg_generate_document_reference

BEFORE INSERT

ON documents

FOR EACH ROW

EXECUTE FUNCTION generate_document_reference();