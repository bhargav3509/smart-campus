-- ============================================================
-- Smart-Campus: Authentication & Authorization Upgrade
-- ============================================================

-- 1. Create authorized_users table
CREATE TABLE IF NOT EXISTS public.authorized_users (
    id SERIAL PRIMARY KEY,
    university_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    university_email VARCHAR(100) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL,
    assigned_role VARCHAR(20) NOT NULL CHECK (assigned_role IN ('student', 'faculty', 'admin')),
    registration_status VARCHAR(20) DEFAULT 'active' CHECK (registration_status IN ('active', 'inactive', 'suspended'))
);

-- 2. Add is_active and university_id columns to users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS university_id VARCHAR(50);

-- 3. Update users role CHECK constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check
    CHECK (role IN ('student', 'faculty', 'admin', 'super_admin'));

-- 4. Seed authorized_users
INSERT INTO public.authorized_users (university_id, full_name, university_email, department, assigned_role, registration_status)
VALUES
    ('STU001', 'Alice Johnson',      'alice.johnson@evesphere.edu',   'Computer Science',         'student', 'active'),
    ('STU002', 'Benjamin Carter',    'ben.carter@evesphere.edu',      'Electrical Engineering',   'student', 'active'),
    ('STU003', 'Priya Sharma',       'priya.sharma@evesphere.edu',    'Information Technology',   'student', 'active'),
    ('STU004', 'Marcus Williams',    'marcus.williams@evesphere.edu', 'Mechanical Engineering',   'student', 'active'),
    ('STU005', 'Sofia Chen',         'sofia.chen@evesphere.edu',      'Computer Science',         'student', 'active'),
    ('STU006', 'Rahul Mehta',        'rahul.mehta@evesphere.edu',     'Civil Engineering',        'student', 'active'),
    ('STU007', 'Emma Thompson',      'emma.thompson@evesphere.edu',   'Business Administration',  'student', 'active'),
    ('STU008', 'David Nguyen',       'david.nguyen@evesphere.edu',    'Computer Science',         'student', 'active'),
    ('FAC001', 'Dr. Anita Kapoor',   'anita.kapoor@evesphere.edu',   'Computer Science',         'faculty', 'active'),
    ('FAC002', 'Prof. James O''Brien','james.obrien@evesphere.edu',   'Electrical Engineering',   'faculty', 'active'),
    ('FAC003', 'Dr. Linda Park',     'linda.park@evesphere.edu',      'Information Technology',   'faculty', 'active'),
    ('FAC004', 'Prof. Rajesh Iyer',  'rajesh.iyer@evesphere.edu',     'Mechanical Engineering',   'faculty', 'active'),
    ('ADM001', 'Carol White',        'carol.white@evesphere.edu',     'Administration',           'admin',   'active')
ON CONFLICT DO NOTHING;

-- 5. Seed Super Admin if not already present
INSERT INTO public.users (name, email, password, role, is_active, university_id)
VALUES (
    'Super Admin',
    'superadmin@evesphere.edu',
    '$2b$12$Nq9rG/GfF1Jg94h6Jt.ZseY6u.H2V9e4u5x4k3J9h1q6Y2z0q2m5S', -- hash for 'SuperAdmin@2024!'
    'super_admin',
    true,
    'SUPER001'
)
ON CONFLICT (email) DO NOTHING;
