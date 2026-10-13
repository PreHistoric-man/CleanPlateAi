-- =============================================================================
-- CleanPlate AI — Seed Data
-- NOTE: All seeded entries are explicitly labelled as sample data (is_sample: true).
-- =============================================================================

-- Seed Users / Profiles (UUIDs match standard development UUID format)
INSERT INTO profiles (id, email, full_name, role, avatar_url, bio)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'owner.rajesh@cleanplate.demo', 'Rajesh Sharma', 'restaurant_owner', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 'Owner of Spice Route Kitchen with 15 years in hospitality.'),
    ('a0000000-0000-0000-0000-000000000002', 'owner.sarah@cleanplate.demo', 'Sarah Jenkins', 'restaurant_owner', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', 'Founder of Green Leaf Bistro, passionate about clean farm-to-table dining.'),
    ('a0000000-0000-0000-0000-000000000003', 'mod.vikram@cleanplate.demo', 'Vikram Patel', 'moderator', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'CleanPlate platform safety and compliance coordinator.'),
    ('a0000000-0000-0000-0000-000000000004', 'customer.ananya@cleanplate.demo', 'Ananya Deshmukh', 'customer', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', 'Food enthusiast and hygiene advocate in South Delhi.')
ON CONFLICT (id) DO NOTHING;

-- Seed Restaurants
INSERT INTO restaurants (id, owner_id, name, description, address, city, area, cuisine_type, phone, website, image_url, is_claimed, is_sample, latest_score, latest_grade, latest_assessed_at)
VALUES
    (
        'b0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000002',
        'Green Leaf Bistro',
        'Contemporary organic dining focused on wholesome meals and transparent kitchen standards.',
        '42 Indiranagar 100ft Road',
        'Bengaluru',
        'Indiranagar',
        'Organic & Healthy',
        '+91 80 4123 4567',
        'https://greenleafbistro.demo',
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
        TRUE,
        TRUE,
        94.5,
        'A',
        NOW() - INTERVAL '2 days'
    ),
    (
        'b0000000-0000-0000-0000-000000000002',
        'a0000000-0000-0000-0000-000000000001',
        'Spice Route Kitchen',
        'Traditional Mughlai & North Indian delicacies cooked in high-volume tandoor stations.',
        '18 Connaught Place, Block M',
        'New Delhi',
        'Connaught Place',
        'North Indian',
        '+91 11 2345 6789',
        'https://spiceroute.demo',
        'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800',
        TRUE,
        TRUE,
        86.0,
        'B',
        NOW() - INTERVAL '5 days'
    ),
    (
        'b0000000-0000-0000-0000-000000000003',
        NULL,
        'Coastal Harbor Seafood',
        'Fresh coastal curries, prawns, and grilled fish specialties.',
        '12 Marine Drive Promenade',
        'Mumbai',
        'Churchgate',
        'Seafood',
        '+91 22 6789 0123',
        NULL,
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
        FALSE,
        TRUE,
        71.0,
        'C',
        NOW() - INTERVAL '14 days'
    ),
    (
        'b0000000-0000-0000-0000-000000000004',
        NULL,
        'Urban Wok Street Kitchen',
        'Pan-Asian street food and wok-tossed noodles in Koramangala.',
        '55 4th Block, 80ft Road',
        'Bengaluru',
        'Koramangala',
        'Pan-Asian',
        '+91 80 9876 5432',
        NULL,
        'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800',
        FALSE,
        TRUE,
        NULL,
        NULL,
        NULL
    )
ON CONFLICT (id) DO NOTHING;

-- Seed Assessments
INSERT INTO assessments (id, restaurant_id, inspector_user_id, zone, photo_url, overall_score, grade, status, model_version, is_demo, disclaimer, limitations)
VALUES
    (
        'c0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000002',
        'prep_surface',
        'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800',
        94.5,
        'A',
        'completed',
        'demo-v1.0',
        TRUE,
        'CleanPlate AI assesses visible cleanliness only. Not an official regulatory inspection.',
        'Assessment limited to stainless prep surface and cutting board arrangement.'
    ),
    (
        'c0000000-0000-0000-0000-000000000002',
        'b0000000-0000-0000-0000-000000000002',
        'a0000000-0000-0000-0000-000000000001',
        'equipment',
        'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=800',
        86.0,
        'B',
        'completed',
        'demo-v1.0',
        TRUE,
        'CleanPlate AI assesses visible cleanliness only. Not an official regulatory inspection.',
        'Assessment focused on exhaust hood and commercial stove burners.'
    )
ON CONFLICT (id) DO NOTHING;

-- Seed Findings (Itemized deductions)
INSERT INTO findings (id, assessment_id, category, title, description, severity, confidence, deduction_points, evidence_description, corrective_recommendation)
VALUES
    (
        'd0000000-0000-0000-0000-000000000001',
        'c0000000-0000-0000-0000-000000000001',
        'Sanitization & Storage',
        'Sanitizing cloth resting on prep table',
        'A damp wiping towel was observed on the cutting surface rather than in an approved sanitizing bucket.',
        'low',
        0.92,
        5.5,
        'Visible folded cloth near center-right prep area',
        'Submerge kitchen wiping towels in designated sanitizing solution buckets between uses.'
    ),
    (
        'd0000000-0000-0000-0000-000000000002',
        'c0000000-0000-0000-0000-000000000002',
        'Grease Accumulation',
        'Heavy grease film on exhaust hood baffle filters',
        'Exhaust ventilation filters exhibit visible yellow-brown oil residues along edges.',
        'medium',
        0.89,
        9.0,
        'Dark residue build-up across upper vent baffles',
        'Degrease hood filters with commercial food-grade solvent and soak in high-temperature wash.'
    ),
    (
        'd0000000-0000-0000-0000-000000000003',
        'c0000000-0000-0000-0000-000000000002',
        'Equipment Cleanliness',
        'Food splatters around range drip trays',
        'Carbonized food debris and dried spices accumulating beneath burner grates.',
        'low',
        0.87,
        5.0,
        'Spills around rear left burner knobs and drip tray',
        'Remove grates daily and scrub drip trays with steel wool and neutralizing detergent.'
    )
ON CONFLICT (id) DO NOTHING;

-- Seed Corrective Actions
INSERT INTO corrective_actions (id, restaurant_id, finding_id, title, action_steps, status, resolved_at)
VALUES
    (
        'e0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000001',
        'd0000000-0000-0000-0000-000000000001',
        'Relocate wiping cloths to sanitizer bucket',
        '1. Set up color-coded bucket. 2. Verify 200ppm quat sanitizer test strip. 3. Train prep line cooks.',
        'resolved',
        NOW() - INTERVAL '1 day'
    ),
    (
        'e0000000-0000-0000-0000-000000000002',
        'b0000000-0000-0000-0000-000000000002',
        'd0000000-0000-0000-0000-000000000002',
        'Deep degrease exhaust hood baffles',
        '1. Soak filters in hot degreasing vat. 2. Wipe down hood stainless canopy. 3. Re-inspect before dinner shift.',
        'in_progress',
        NULL
    )
ON CONFLICT (id) DO NOTHING;

-- Seed Community Posts (Reviews & Discussions)
INSERT INTO community_posts (id, restaurant_id, author_id, title, content, post_type, rating, is_moderated, moderation_status)
VALUES
    (
        'f0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000004',
        'Super clean open kitchen!',
        'Loved dining here. You can see directly into the prep area from the counter. Everything looks spotless and chefs wear clean gear.',
        'review',
        5,
        FALSE,
        'published'
    ),
    (
        'f0000000-0000-0000-0000-000000000002',
        'b0000000-0000-0000-0000-000000000002',
        'a0000000-0000-0000-0000-000000000004',
        'Great food, glad to see proactive hygiene tracking',
        'Appreciate that Spice Route publishes their CleanPlate scores publicly. Hoping they keep up with hood filter cleanups!',
        'review',
        4,
        FALSE,
        'published'
    )
ON CONFLICT (id) DO NOTHING;

-- Seed Community Comments (Owner Responses)
INSERT INTO community_comments (id, post_id, author_id, content, is_owner_response)
VALUES
    (
        '01000000-0000-0000-0000-000000000001',
        'f0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000002',
        'Thank you Ananya! Maintaining visible kitchen transparency is our top priority every morning.',
        TRUE
    ),
    (
        '01000000-0000-0000-0000-000000000002',
        'f0000000-0000-0000-0000-000000000002',
        'a0000000-0000-0000-0000-000000000001',
        'Thank you for the review! Our cleaning team is currently addressing the exhaust filters in our weekly deep-clean cycle today.',
        TRUE
    )
ON CONFLICT (id) DO NOTHING;
