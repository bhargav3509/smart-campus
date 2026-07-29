-- ============================================================
-- EveSphere — Study Resources Module Schema
-- Run this file in Supabase SQL Editor or psql to add new tables.
-- Existing tables (users, events, venues, etc.) are NOT modified.
-- ============================================================

-- ─── Departments ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.departments (
    id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name        character varying(100) NOT NULL UNIQUE,
    code        character varying(20) NOT NULL UNIQUE,
    is_active   boolean DEFAULT true,
    created_at  timestamp without time zone DEFAULT now()
);

-- ─── Subjects ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subjects (
    id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name            character varying(150) NOT NULL,
    code            character varying(30) NOT NULL,
    department_id   uuid REFERENCES public.departments(id) ON DELETE CASCADE,
    semester        integer NOT NULL CHECK (semester >= 1 AND semester <= 8),
    is_active       boolean DEFAULT true,
    created_at      timestamp without time zone DEFAULT now(),
    CONSTRAINT subjects_code_dept_unique UNIQUE (code, department_id)
);

-- ─── Resource Categories ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.resource_categories (
    id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name        character varying(100) NOT NULL UNIQUE,
    slug        character varying(100) NOT NULL UNIQUE,
    icon        character varying(50) DEFAULT '📄',
    is_active   boolean DEFAULT true,
    created_at  timestamp without time zone DEFAULT now()
);

-- ─── Resources ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.resources (
    id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title           character varying(255) NOT NULL,
    description     text,
    file_url        character varying(500),
    file_size       bigint DEFAULT 0,
    file_type       character varying(20),
    resource_type   character varying(50),
    external_url    character varying(500),
    department_id   uuid REFERENCES public.departments(id) ON DELETE SET NULL,
    semester        integer CHECK (semester >= 1 AND semester <= 8),
    subject_id      uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
    category_id     uuid REFERENCES public.resource_categories(id) ON DELETE SET NULL,
    uploaded_by     uuid REFERENCES public.users(id) ON DELETE CASCADE,
    tags            text[] DEFAULT '{}',
    is_featured     boolean DEFAULT false,
    download_count  integer DEFAULT 0,
    avg_rating      numeric(2,1) DEFAULT 0.0,
    status          character varying(20) DEFAULT 'active',
    created_at      timestamp without time zone DEFAULT now(),
    updated_at      timestamp without time zone DEFAULT now(),
    CONSTRAINT resources_status_check CHECK (status IN ('active', 'archived', 'deleted'))
);

-- ─── Resource Bookmarks ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.resource_bookmarks (
    id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         uuid REFERENCES public.users(id) ON DELETE CASCADE,
    resource_id     uuid REFERENCES public.resources(id) ON DELETE CASCADE,
    created_at      timestamp without time zone DEFAULT now(),
    CONSTRAINT resource_bookmarks_unique UNIQUE (user_id, resource_id)
);

-- ─── Resource Downloads ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.resource_downloads (
    id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         uuid REFERENCES public.users(id) ON DELETE CASCADE,
    resource_id     uuid REFERENCES public.resources(id) ON DELETE CASCADE,
    downloaded_at   timestamp without time zone DEFAULT now()
);

-- ─── Resource Ratings ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.resource_ratings (
    id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         uuid REFERENCES public.users(id) ON DELETE CASCADE,
    resource_id     uuid REFERENCES public.resources(id) ON DELETE CASCADE,
    rating          integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at      timestamp without time zone DEFAULT now(),
    CONSTRAINT resource_ratings_unique UNIQUE (user_id, resource_id)
);

-- ─── Resource Comments ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.resource_comments (
    id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         uuid REFERENCES public.users(id) ON DELETE CASCADE,
    resource_id     uuid REFERENCES public.resources(id) ON DELETE CASCADE,
    content         text NOT NULL,
    is_hidden       boolean DEFAULT false,
    created_at      timestamp without time zone DEFAULT now()
);

-- ─── Indexes ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_resources_department  ON public.resources(department_id);
CREATE INDEX IF NOT EXISTS idx_resources_subject     ON public.resources(subject_id);
CREATE INDEX IF NOT EXISTS idx_resources_category    ON public.resources(category_id);
CREATE INDEX IF NOT EXISTS idx_resources_uploaded_by ON public.resources(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_resources_semester    ON public.resources(semester);
CREATE INDEX IF NOT EXISTS idx_resources_status      ON public.resources(status);
CREATE INDEX IF NOT EXISTS idx_resources_created_at  ON public.resources(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resource_bookmarks_user ON public.resource_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_resource_downloads_user ON public.resource_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_resource_ratings_resource ON public.resource_ratings(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_comments_resource ON public.resource_comments(resource_id);

-- ─── Seed: Resource Categories ─────────────────────────────
INSERT INTO public.resource_categories (name, slug, icon) VALUES
    ('Lecture Notes',                'lecture-notes',       '📝'),
    ('Assignments',                  'assignments',         '📋'),
    ('Previous Year Question Papers','question-papers',     '📑'),
    ('Lab Manuals',                  'lab-manuals',         '🔬'),
    ('Practical Files',              'practical-files',     '🧪'),
    ('PPT Presentations',            'presentations',       '📊'),
    ('E-books',                      'ebooks',              '📚'),
    ('Tutorials',                    'tutorials',           '🎓'),
    ('Recorded Lectures',            'recorded-lectures',   '🎥'),
    ('Sample Programs',              'sample-programs',     '💻'),
    ('Reference Material',           'reference-material',  '📖'),
    ('Other',                        'other',               '📄')
ON CONFLICT (slug) DO NOTHING;

-- ─── Seed: Departments ─────────────────────────────────────
INSERT INTO public.departments (name, code) VALUES
    ('Computer Science',             'CSE'),
    ('Electronics',                  'ECE'),
    ('Mechanical',                   'ME'),
    ('Civil',                        'CE'),
    ('Information Technology',       'IT'),
    ('Electrical',                   'EE'),
    ('Administration',               'ADMIN')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- Done! Study Resources tables are ready.
-- ============================================================
