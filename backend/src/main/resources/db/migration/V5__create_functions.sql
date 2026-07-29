-- ============================================================================
-- 1. DOCUMENT REFERENCE SEQUENCE
-- ============================================================================

CREATE SEQUENCE IF NOT EXISTS seq_document_reference
START 1
INCREMENT 1;



-- ============================================================================
-- 2. GENERATE DOCUMENT REFERENCE NUMBER
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_reference_number()

RETURNS VARCHAR(50)

LANGUAGE plpgsql

AS
$$

DECLARE

next_number BIGINT;

BEGIN

next_number := nextval('seq_document_reference');

RETURN

'DOC-'

|| EXTRACT(YEAR FROM CURRENT_DATE)

|| '-'

|| LPAD(next_number::TEXT,6,'0');

END;

$$;




-- ============================================================================
-- 3. CALCULATE NEXT VERSION
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_next_version(

p_document_id UUID

)

RETURNS INTEGER

LANGUAGE plpgsql

AS
$$

DECLARE

next_version INTEGER;

BEGIN

SELECT

COALESCE(MAX(version_number),0)+1

INTO next_version

FROM document_versions

WHERE document_id = p_document_id;

RETURN next_version;

END;

$$;


-- ============================================================================
-- 4. DOCUMENT EDITABLE CHECK
-- ============================================================================

CREATE OR REPLACE FUNCTION is_document_editable(

p_document_id UUID

)

RETURNS BOOLEAN

LANGUAGE plpgsql

AS
$$

DECLARE

current_status document_status;

BEGIN

SELECT

status

INTO current_status

FROM documents

WHERE document_id = p_document_id;

RETURN

current_status IN (

'DRAFT',

'REJECTED'

);

END;

$$;



