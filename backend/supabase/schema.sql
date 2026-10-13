-- =============================================================================
-- CleanPlate AI — Database Schema
-- Compatible with PostgreSQL 15+ / Supabase
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom Types & Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('customer', 'restaurant_owner', 'moderator');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE kitchen_zone AS ENUM (
        'prep_surface',
        'storage',
        'dishwashing',
        'waste_disposal',
        'equipment'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE finding_severity AS ENUM ('critical', 'high', 'medium', 'low');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE action_status AS ENUM ('pending', 'in_progress', 'resolved');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE report_status AS ENUM ('pending', 'approved', 'dismissed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE post_type AS ENUM ('review', 'question', 'discussion');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- -----------------------------------------------------------------------------
-- 1. Profiles Table (Linked with Supabase auth.users)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'customer',
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 2. Restaurants Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    area VARCHAR(100) NOT NULL,
    cuisine_type VARCHAR(100) NOT NULL,
    phone VARCHAR(30),
    website TEXT,
    image_url TEXT,
    is_claimed BOOLEAN NOT NULL DEFAULT FALSE,
    is_sample BOOLEAN NOT NULL DEFAULT FALSE,
    latest_score NUMERIC(4, 1),
    latest_grade VARCHAR(5),
    latest_assessed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for discovery search & filtering
CREATE INDEX IF NOT EXISTS idx_restaurants_name ON restaurants(name);
CREATE INDEX IF NOT EXISTS idx_restaurants_area ON restaurants(area);
CREATE INDEX IF NOT EXISTS idx_restaurants_city ON restaurants(city);
CREATE INDEX IF NOT EXISTS idx_restaurants_cuisine ON restaurants(cuisine_type);
CREATE INDEX IF NOT EXISTS idx_restaurants_score ON restaurants(latest_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_restaurants_owner ON restaurants(owner_id);

-- -----------------------------------------------------------------------------
-- 3. Assessments Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    inspector_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    zone kitchen_zone NOT NULL,
    photo_url TEXT NOT NULL,
    overall_score NUMERIC(4, 1) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    grade VARCHAR(5) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'completed',
    model_version VARCHAR(50) NOT NULL DEFAULT 'demo-v1.0',
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    disclaimer TEXT NOT NULL DEFAULT 'CleanPlate AI evaluates visible cleanliness only. Not an official regulatory or FSSAI inspection.',
    limitations TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assessments_restaurant ON assessments(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assessments_zone ON assessments(zone);

-- -----------------------------------------------------------------------------
-- 4. Findings Table (Itemized deductions)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity finding_severity NOT NULL,
    confidence NUMERIC(3, 2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    deduction_points NUMERIC(4, 1) NOT NULL CHECK (deduction_points >= 0),
    evidence_description TEXT,
    corrective_recommendation TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_findings_assessment ON findings(assessment_id);
CREATE INDEX IF NOT EXISTS idx_findings_severity ON findings(severity);

-- -----------------------------------------------------------------------------
-- 5. Corrective Actions Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS corrective_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    finding_id UUID REFERENCES findings(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    action_steps TEXT NOT NULL,
    status action_status NOT NULL DEFAULT 'pending',
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    follow_up_photo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_actions_restaurant ON corrective_actions(restaurant_id, status);

-- -----------------------------------------------------------------------------
-- 6. Community Posts / Reviews Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255),
    content TEXT NOT NULL,
    post_type post_type NOT NULL DEFAULT 'review',
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    is_moderated BOOLEAN NOT NULL DEFAULT FALSE,
    moderation_status VARCHAR(30) NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_restaurant ON community_posts(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author ON community_posts(author_id);

-- -----------------------------------------------------------------------------
-- 7. Community Comments / Owner Replies Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS community_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_owner_response BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON community_comments(post_id, created_at ASC);

-- -----------------------------------------------------------------------------
-- 8. Moderation Reports Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS moderation_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    target_type VARCHAR(50) NOT NULL, -- 'post', 'comment', 'restaurant_claim'
    target_id UUID NOT NULL,
    reason VARCHAR(100) NOT NULL,
    details TEXT,
    status report_status NOT NULL DEFAULT 'pending',
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON moderation_reports(status, created_at DESC);

-- -----------------------------------------------------------------------------
-- 9. Moderation Audit Logs Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS moderation_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moderator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id UUID NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_moderator ON moderation_audit_logs(moderator_id, created_at DESC);
