-- ============================================================
-- Smart-Campus / EveSphere — Supabase Schema
-- Paste this entire file into the Supabase SQL Editor and run.
-- ============================================================

-- ─── Extensions ────────────────────────────────────────────
-- gen_random_uuid() is built-in on Supabase (pgcrypto enabled by default)

-- ─── Tables ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.users (
    id              uuid                    DEFAULT gen_random_uuid() PRIMARY KEY,
    name            character varying(100)  NOT NULL,
    email           character varying(100)  NOT NULL UNIQUE,
    password        character varying(255)  NOT NULL,
    role            character varying(20)   DEFAULT 'student',
    department      character varying(100),
    phone           character varying(20),
    branch          character varying(100),
    section         character varying(20),
    uid             character varying(50)   UNIQUE,
    bio             text,
    avatar_url      character varying(500),
    designation     character varying(255),
    employee_id     character varying(100),
    office          character varying(255),
    -- Password reset (added via migrate-reset-token.js)
    reset_token         character varying(255),
    reset_token_expiry  timestamptz,
    created_at      timestamp without time zone DEFAULT now(),
    CONSTRAINT users_role_check CHECK (role IN ('student', 'faculty', 'admin'))
);

CREATE TABLE IF NOT EXISTS public.venues (
    id          uuid                    DEFAULT gen_random_uuid() PRIMARY KEY,
    name        character varying(100)  NOT NULL,
    capacity    integer                 NOT NULL,
    location    character varying(255),
    amenities   jsonb                   DEFAULT '{}'::jsonb,
    is_active   boolean                 DEFAULT true,
    created_at  timestamp without time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.events (
    id              uuid                    DEFAULT gen_random_uuid() PRIMARY KEY,
    title           character varying(255)  NOT NULL,
    description     text,
    organizer_id    uuid                    REFERENCES public.users(id),
    venue_id        uuid                    REFERENCES public.venues(id),
    start_time      timestamp without time zone NOT NULL,
    end_time        timestamp without time zone NOT NULL,
    status          character varying(20)   DEFAULT 'draft',
    max_attendees   integer,
    poster_url      character varying(500),
    created_at      timestamp without time zone DEFAULT now(),
    CONSTRAINT events_status_check CHECK (status IN ('draft', 'pending_approval', 'published', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS public.registrations (
    id              uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id        uuid    REFERENCES public.events(id) ON DELETE CASCADE,
    user_id         uuid    REFERENCES public.users(id),
    status          character varying(20) DEFAULT 'registered',
    registered_at   timestamp without time zone DEFAULT now(),
    CONSTRAINT registrations_event_id_user_id_key UNIQUE (event_id, user_id),
    CONSTRAINT registrations_status_check CHECK (status IN ('registered', 'attended', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS public.bookings (
    id          uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
    venue_id    uuid    REFERENCES public.venues(id),
    user_id     uuid    REFERENCES public.users(id),
    event_id    uuid    REFERENCES public.events(id) ON DELETE CASCADE,
    start_time  timestamp without time zone NOT NULL,
    end_time    timestamp without time zone NOT NULL,
    status      character varying(20) DEFAULT 'pending',
    created_at  timestamp without time zone DEFAULT now(),
    CONSTRAINT bookings_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id          uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     uuid    REFERENCES public.users(id),
    message     text    NOT NULL,
    is_read     boolean DEFAULT false,
    created_at  timestamp without time zone DEFAULT now()
);

-- ─── View ──────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.event_stats AS
SELECT
    e.id,
    e.title,
    e.status,
    e.max_attendees,
    COUNT(r.id) AS registration_count,
    v.name AS venue_name
FROM public.events e
LEFT JOIN public.registrations r ON (e.id = r.event_id AND r.status <> 'cancelled')
LEFT JOIN public.venues v ON (e.venue_id = v.id)
GROUP BY e.id, e.title, e.status, e.max_attendees, v.name;

-- ─── Seed Data (optional — comment out if you want a clean slate) ──

-- Venues
INSERT INTO public.venues (id, name, capacity, location, amenities, is_active, created_at)
VALUES
  ('29ec0efd-eb76-455f-9b73-8f3010d1c470', 'Main Auditorium', 500, 'Block A, Ground Floor', '{"ac": true, "wifi": true, "projector": true, "wheelchair_accessible": true}', true, '2026-03-26 16:03:17.391605'),
  ('f6c94913-ac43-45a4-bb4f-8bd0c4004e79', 'c1 ground',       400, 'chandigarh university', '{}', true, '2026-03-27 11:59:29.066762'),
  ('9e9442dc-6310-4584-9d06-59f2fee71f59', 'Seminar Hall',    300, 'C2-Block',               '{}', true, '2026-03-31 16:00:39.720484')
ON CONFLICT (id) DO NOTHING;

-- Users (passwords are bcrypt hashes — login credentials unchanged)
INSERT INTO public.users (id, name, email, password, role, department, created_at)
VALUES
  ('df2cea1e-cc1a-4014-b2f8-548d9a58fe54', 'Bhargav',        'bhargav@test.com',        '$2b$10$NgFGh3bOQnaodOIftsdStupOQIWrlC4osdBoPLwJBqKnUBrO8QY/u', 'student', 'Computer Science',  '2026-03-26 15:42:50.027483'),
  ('d25ceaf1-59aa-42e9-91e9-a32205696eca', 'Admin User',      'admin2@test.com',         '$2b$10$ZmAB0z6RBXn0VijZQf77aeoZXcVbfzyfMDPfNj1rGP/v1XDwDDPGC', 'admin',   'Administration',    '2026-03-26 15:55:46.774492'),
  ('a701a410-0eda-4e93-b5b2-c47f122ecfb1', 'bhargav',         '24bcs11028@cuchd.in',    '$2b$10$peBgjCjibYmwKVkB8k3A3uFwu9UkAitHvkKT2Y0Z6ztTCQkYFEknO', 'student', 'Computer Science',  '2026-03-26 20:50:13.40969'),
  ('c005e938-98ea-402c-b1ab-147b5b11a885', 'karan',           '24bcs11033@cuchd.in',    '$2b$10$81sxDzl34L9kDfcmR73gjuvMg8Zy4E.PmfXEdauCkUQ6BYSe8TCcS', 'faculty', 'cse',               '2026-03-26 21:03:02.958835'),
  ('32f0a06f-0e1c-48fc-9b2e-7375ae090d66', 'Priyanshu patel', '24bcs12606@cuchd.in',   '$2b$10$5.qJ.h5HfrIwTZcp6PycZu/YjdNSBwzUEeTJXigkH1A.WpvvI.wE.', 'student', 'Computer Science',  '2026-03-30 10:43:43.914161'),
  ('ba57b0df-c6de-4583-bef6-0d1ad71a7091', 'vaibhav',         '24bcs12275@cuchd.in',   '$2b$10$mfAqIsfn83t2B17z6LxgZ.rbnP2ai9k0ZSwv5tO7vvYHfMdI/TET6', 'student', 'Computer Science',  '2026-03-31 14:30:56.262099'),
  ('0a264d21-99bc-4cd0-8f99-422f075d59c7', 'Ashutosh',        'bhargav3509@gmail.com',  '$2b$10$9ONTj3FST7G3876/sPgWX.k7/yvjxeKiCZGCqfs7im6Su4Lji2xi.', 'admin',   'cse',               '2026-03-26 21:00:41.982312')
ON CONFLICT (id) DO NOTHING;

-- Events
INSERT INTO public.events (id, title, description, organizer_id, venue_id, start_time, end_time, status, max_attendees, created_at, poster_url)
VALUES
  ('b5d99624-147d-40ec-a7c0-6026751cc6fb', 'welfare',            '',                    '0a264d21-99bc-4cd0-8f99-422f075d59c7', '29ec0efd-eb76-455f-9b73-8f3010d1c470', '2026-04-06 09:37:00', '2026-04-06 10:42:00', 'published', 150, '2026-03-28 18:39:13.869398', NULL),
  ('5e54f689-0453-4c7e-96c9-49de8a6f6d98', 'Git Good',           'GIT GOOD is a hands-on training workshop...', '0a264d21-99bc-4cd0-8f99-422f075d59c7', 'f6c94913-ac43-45a4-bb4f-8bd0c4004e79', '2026-04-01 09:30:00', '2026-04-01 16:26:00', 'published', 200, '2026-03-31 15:43:54.667597', NULL),
  ('1b58b757-0bf8-4a16-ac09-2537ad04d352', 'Advanced IOT Seminar','The programme focuses on the application of IoT...', '0a264d21-99bc-4cd0-8f99-422f075d59c7', '9e9442dc-6310-4584-9d06-59f2fee71f59', '2026-03-26 12:00:00', '2026-03-27 12:25:00', 'published', 400, '2026-03-31 16:03:51.739238', NULL),
  ('8d3c1091-1c86-4838-ac17-b646dcf35049', 'Urban Symphony',     'The conclave will feature distinguished speakers...', '0a264d21-99bc-4cd0-8f99-422f075d59c7', '9e9442dc-6310-4584-9d06-59f2fee71f59', '2026-04-12 10:30:00', '2026-04-12 12:30:00', 'published', 100, '2026-03-31 19:29:40.873249', NULL)
ON CONFLICT (id) DO NOTHING;

-- Registrations
INSERT INTO public.registrations (id, event_id, user_id, status, registered_at)
VALUES
  ('1981e443-78a8-4426-8532-e236810b4f0f', '5e54f689-0453-4c7e-96c9-49de8a6f6d98', 'a701a410-0eda-4e93-b5b2-c47f122ecfb1', 'registered', '2026-03-31 15:56:28.235231')
ON CONFLICT (id) DO NOTHING;

-- Bookings
INSERT INTO public.bookings (id, venue_id, user_id, event_id, start_time, end_time, status, created_at)
VALUES
  ('e8b53948-ace1-4da3-88b9-c55fa2608775', 'f6c94913-ac43-45a4-bb4f-8bd0c4004e79', 'c005e938-98ea-402c-b1ab-147b5b11a885', NULL, '2026-03-27 14:48:00', '2026-03-27 15:48:00', 'approved', '2026-03-27 23:48:37.916123')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Done! Your Smart-Campus schema is ready on Supabase.
-- ============================================================
