
CREATE EXTENSION IF NOT EXISTS pgcrypto;



CREATE TYPE document_status AS ENUM (

    'DRAFT',

    'SUBMITTED',

    'UNDER_REVIEW',

    'APPROVED',

    'REJECTED',

    'ARCHIVED'

);


CREATE TYPE classification_level AS ENUM (

    'PUBLIC',

    'INTERNAL',

    'CONFIDENTIAL',

    'SECRET'

);


CREATE TYPE note_type AS ENUM (

    'GENERAL',

    'REVIEW',

    'REJECTION_REASON',

    'SYSTEM'

);


CREATE TYPE audit_action AS ENUM (

    'CREATE',

    'UPDATE',

    'DELETE',

    'VIEW',

    'UPLOAD',

    'DOWNLOAD',

    'LOGIN',

    'LOGOUT',

    'APPROVE',

    'REJECT',

    'ARCHIVE',

    'RESTORE'

);


CREATE TYPE resource_type AS ENUM (

    'DOCUMENT',

    'DOCUMENT_VERSION',

    'CATEGORY',

    'DEPARTMENT',

    'USER'

);


 
CREATE TABLE departments (

    department_id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    name VARCHAR(150) NOT NULL,

    description TEXT,

    parent_department_id UUID,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    created_by UUID,

    updated_by UUID,

    deleted_at TIMESTAMPTZ,

    deleted_by UUID,

    CONSTRAINT uq_departments_name
        UNIQUE(name)

);



 
CREATE TABLE categories (

    category_id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    name VARCHAR(150) NOT NULL,

    description TEXT,

    parent_category_id UUID,

    retention_period_months INTEGER,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    created_by UUID,

    updated_by UUID,

    deleted_at TIMESTAMPTZ,

    deleted_by UUID,

    CONSTRAINT uq_categories_name
        UNIQUE(name),

    CONSTRAINT chk_retention_period
        CHECK(retention_period_months >= 0)

);



 
CREATE TABLE users (

    user_sub UUID PRIMARY KEY,

    full_name VARCHAR(200)
        NOT NULL,

    email VARCHAR(255)
        NOT NULL,

    department_id UUID,

    is_active BOOLEAN
        NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    deleted_at TIMESTAMPTZ,

    deleted_by UUID,

    CONSTRAINT uq_users_email
        UNIQUE(email)

);


 
CREATE TABLE documents (

    document_id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    reference_number VARCHAR(50)
        NOT NULL,

    title VARCHAR(300)
        NOT NULL,

    description TEXT,

    category_id UUID
        NOT NULL,

    department_id UUID
        NOT NULL,

    classification classification_level
        NOT NULL DEFAULT 'INTERNAL',

    status document_status
        NOT NULL DEFAULT 'DRAFT',

    current_version_id UUID,

    archived_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    created_by UUID
        NOT NULL,

    updated_by UUID,

    deleted_at TIMESTAMPTZ,

    deleted_by UUID,

    CONSTRAINT uq_documents_reference_number
        UNIQUE(reference_number)

);



 
CREATE TABLE document_versions (

    version_id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    document_id UUID
        NOT NULL,

    version_number INTEGER
        NOT NULL,

    original_file_name VARCHAR(255)
        NOT NULL,

    stored_file_name VARCHAR(255)
        NOT NULL,

    file_path TEXT
        NOT NULL,

    mime_type VARCHAR(150)
        NOT NULL,

    file_size BIGINT
        NOT NULL,

    checksum_sha256 CHAR(64),

    uploaded_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    uploaded_by UUID
        NOT NULL,

    CONSTRAINT uq_document_version
        UNIQUE(document_id, version_number),

    CONSTRAINT chk_version_number
        CHECK(version_number > 0),

    CONSTRAINT chk_file_size
        CHECK(file_size > 0)

);

 
CREATE TABLE document_notes (

    note_id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    document_id UUID
        NOT NULL,

    note_type note_type
        NOT NULL DEFAULT 'GENERAL',

    note TEXT
        NOT NULL,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    created_by UUID
        NOT NULL,

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    updated_by UUID,

    deleted_at TIMESTAMPTZ,

    deleted_by UUID

);

 
CREATE TABLE document_workflow_history (

    workflow_id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    document_id UUID
        NOT NULL,

    from_status document_status,

    to_status document_status
        NOT NULL,

    comment TEXT,

    changed_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    changed_by UUID
        NOT NULL,

    CONSTRAINT chk_workflow_status_change
        CHECK (from_status IS DISTINCT FROM to_status)

);



CREATE TABLE audit_logs (

    audit_log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    actor_id UUID,

    action audit_action
        NOT NULL,

    resource_type resource_type
        NOT NULL,

    resource_id UUID,

    details JSONB,

    ip_address INET,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT now()

);


ALTER TABLE departments

ADD CONSTRAINT fk_departments_parent
FOREIGN KEY (parent_department_id)
REFERENCES departments(department_id)
ON DELETE SET NULL,

ADD CONSTRAINT fk_departments_created_by
FOREIGN KEY (created_by)
REFERENCES users(user_sub),

ADD CONSTRAINT fk_departments_updated_by
FOREIGN KEY (updated_by)
REFERENCES users(user_sub),

ADD CONSTRAINT fk_departments_deleted_by
FOREIGN KEY (deleted_by)
REFERENCES users(user_sub);



ALTER TABLE categories

ADD CONSTRAINT fk_categories_parent
FOREIGN KEY (parent_category_id)
REFERENCES categories(category_id)
ON DELETE SET NULL,

ADD CONSTRAINT fk_categories_created_by
FOREIGN KEY (created_by)
REFERENCES users(user_sub),

ADD CONSTRAINT fk_categories_updated_by
FOREIGN KEY (updated_by)
REFERENCES users(user_sub),

ADD CONSTRAINT fk_categories_deleted_by
FOREIGN KEY (deleted_by)
REFERENCES users(user_sub);


ALTER TABLE users

ADD CONSTRAINT fk_users_department
FOREIGN KEY (department_id)
REFERENCES departments(department_id),

ADD CONSTRAINT fk_users_deleted_by
FOREIGN KEY (deleted_by)
REFERENCES users(user_sub);


ALTER TABLE documents

ADD CONSTRAINT fk_documents_category
FOREIGN KEY (category_id)
REFERENCES categories(category_id),

ADD CONSTRAINT fk_documents_department
FOREIGN KEY (department_id)
REFERENCES departments(department_id),

ADD CONSTRAINT fk_documents_current_version
FOREIGN KEY (current_version_id)
REFERENCES document_versions(version_id)
DEFERRABLE INITIALLY DEFERRED,

ADD CONSTRAINT fk_documents_created_by
FOREIGN KEY (created_by)
REFERENCES users(user_sub),

ADD CONSTRAINT fk_documents_updated_by
FOREIGN KEY (updated_by)
REFERENCES users(user_sub),

ADD CONSTRAINT fk_documents_deleted_by
FOREIGN KEY (deleted_by)
REFERENCES users(user_sub);


ALTER TABLE document_versions

ADD CONSTRAINT fk_versions_document
FOREIGN KEY (document_id)
REFERENCES documents(document_id)
ON DELETE CASCADE,

ADD CONSTRAINT fk_versions_uploaded_by
FOREIGN KEY (uploaded_by)
REFERENCES users(user_sub);



ALTER TABLE document_notes

ADD CONSTRAINT fk_notes_document
FOREIGN KEY (document_id)
REFERENCES documents(document_id)
ON DELETE CASCADE,

ADD CONSTRAINT fk_notes_created_by
FOREIGN KEY (created_by)
REFERENCES users(user_sub),

ADD CONSTRAINT fk_notes_updated_by
FOREIGN KEY (updated_by)
REFERENCES users(user_sub),

ADD CONSTRAINT fk_notes_deleted_by
FOREIGN KEY (deleted_by)
REFERENCES users(user_sub);



ALTER TABLE document_workflow_history

ADD CONSTRAINT fk_workflow_document
FOREIGN KEY (document_id)
REFERENCES documents(document_id)
ON DELETE CASCADE,

ADD CONSTRAINT fk_workflow_changed_by
FOREIGN KEY (changed_by)
REFERENCES users(user_sub);




ALTER TABLE audit_logs

ADD CONSTRAINT fk_audit_actor
FOREIGN KEY (actor_id)
REFERENCES users(user_sub);


