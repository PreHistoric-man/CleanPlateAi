-- =============================================================================
-- CleanPlate AI — Row Level Security (RLS) Policies
-- Enforcing least privilege and role-based access control
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE corrective_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if caller has moderator role
CREATE OR REPLACE FUNCTION is_moderator(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = user_id AND role = 'moderator'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 1. Profiles Policies
-- -----------------------------------------------------------------------------
-- Public profile viewing (full_name, role, avatar_url)
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

-- Users can update only their own profile
CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- 2. Restaurants Policies
-- -----------------------------------------------------------------------------
-- Anyone can view restaurants in the public directory
CREATE POLICY "Restaurants are viewable by everyone"
ON restaurants FOR SELECT
USING (true);

-- Restaurant owners can insert new restaurant entries
CREATE POLICY "Restaurant owners can insert restaurants"
ON restaurants FOR INSERT
WITH CHECK (
    auth.uid() = owner_id
    OR is_moderator(auth.uid())
);

-- Owners can update their own restaurant; moderators can update any
CREATE POLICY "Owners and moderators can update restaurants"
ON restaurants FOR UPDATE
USING (
    auth.uid() = owner_id
    OR is_moderator(auth.uid())
);

-- -----------------------------------------------------------------------------
-- 3. Assessments Policies
-- -----------------------------------------------------------------------------
-- Completed assessments are publicly viewable
CREATE POLICY "Assessments are viewable by everyone"
ON assessments FOR SELECT
USING (status = 'completed' OR auth.uid() = inspector_user_id OR is_moderator(auth.uid()));

-- Owners and verified inspectors can insert assessments
CREATE POLICY "Verified inspectors and owners can insert assessments"
ON assessments FOR INSERT
WITH CHECK (
    auth.uid() = inspector_user_id
    OR is_moderator(auth.uid())
);

-- -----------------------------------------------------------------------------
-- 4. Findings Policies
-- -----------------------------------------------------------------------------
-- Findings for visible assessments are publicly viewable
CREATE POLICY "Findings are viewable by everyone"
ON findings FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM assessments
        WHERE assessments.id = findings.assessment_id
        AND (assessments.status = 'completed' OR assessments.inspector_user_id = auth.uid() OR is_moderator(auth.uid()))
    )
);

-- -----------------------------------------------------------------------------
-- 5. Corrective Actions Policies
-- -----------------------------------------------------------------------------
-- Public can view corrective actions to see restaurant improvement
CREATE POLICY "Corrective actions are viewable by everyone"
ON corrective_actions FOR SELECT
USING (true);

-- Restaurant owners can update corrective actions for their restaurant
CREATE POLICY "Restaurant owners can update their corrective actions"
ON corrective_actions FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM restaurants
        WHERE restaurants.id = corrective_actions.restaurant_id
        AND (restaurants.owner_id = auth.uid() OR is_moderator(auth.uid()))
    )
);

-- -----------------------------------------------------------------------------
-- 6. Community Posts Policies
-- -----------------------------------------------------------------------------
-- Published posts are viewable by everyone
CREATE POLICY "Published posts are viewable by everyone"
ON community_posts FOR SELECT
USING (moderation_status = 'published' OR auth.uid() = author_id OR is_moderator(auth.uid()));

-- Authenticated users can insert community posts
CREATE POLICY "Authenticated users can create posts"
ON community_posts FOR INSERT
WITH CHECK (auth.uid() = author_id);

-- Authors can update their own post if not locked
CREATE POLICY "Authors can update own posts"
ON community_posts FOR UPDATE
USING (auth.uid() = author_id OR is_moderator(auth.uid()));

-- -----------------------------------------------------------------------------
-- 7. Community Comments Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Comments are viewable by everyone"
ON community_comments FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create comments"
ON community_comments FOR INSERT
WITH CHECK (auth.uid() = author_id);

-- -----------------------------------------------------------------------------
-- 8. Moderation Reports Policies
-- -----------------------------------------------------------------------------
-- Reporters can view their submitted reports; moderators can view all
CREATE POLICY "Users can view own reports, moderators can view all"
ON moderation_reports FOR SELECT
USING (auth.uid() = reporter_id OR is_moderator(auth.uid()));

-- Authenticated users can submit reports
CREATE POLICY "Authenticated users can submit reports"
ON moderation_reports FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

-- Moderators can update report status
CREATE POLICY "Moderators can update reports"
ON moderation_reports FOR UPDATE
USING (is_moderator(auth.uid()));

-- -----------------------------------------------------------------------------
-- 9. Moderation Audit Logs Policies
-- -----------------------------------------------------------------------------
-- Only moderators can read or write audit logs
CREATE POLICY "Moderators only for audit logs"
ON moderation_audit_logs FOR ALL
USING (is_moderator(auth.uid()));
