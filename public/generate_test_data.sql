-- Generate test visitor data for the last 30 days
-- This will create sample data to test the cumulative graph

-- Generate sample visitor data for the last 30 days
INSERT INTO visitor_analytics (session_id, page_type, visit_date, is_return_visitor, landing_page, user_agent)
SELECT 
    'session_' || generate_series || '_' || md5(random()::text),
    CASE floor(random() * 8)
        WHEN 0 THEN 'home'
        WHEN 1 THEN 'result'
        WHEN 2 THEN 'admission'
        WHEN 3 THEN 'contact'
        WHEN 4 THEN 'about'
        WHEN 5 THEN 'gallery'
        WHEN 6 THEN 'class'
        ELSE 'other'
    END,
    current_date - (floor(random() * 30) || ' days')::interval,
    CASE WHEN random() > 0.7 THEN true ELSE false END,
    'https://yourschool.com/' || CASE floor(random() * 8)
        WHEN 0 THEN 'home'
        WHEN 1 THEN 'result'
        WHEN 2 THEN 'admission'
        WHEN 3 THEN 'contact'
        WHEN 4 THEN 'about'
        WHEN 5 THEN 'gallery'
        WHEN 6 THEN 'class'
        ELSE 'other'
    END,
    'Mozilla/5.0 (Test Browser)'
FROM generate_series(1, 100);

-- This creates 100 sample visitor records spread across the last 30 days
-- Some will be return visitors, some new visitors
-- Distributed across different page types
