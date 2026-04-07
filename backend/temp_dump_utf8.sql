--
-- PostgreSQL database dump
--

\restrict LEcuoQulfm4w1WHEnMdOgR6UGgudUcnqw2DIl9yHe8mH4m1QLmjlzfc10RNW8nJ

-- Dumped from database version 17.9
-- Dumped by pg_dump version 17.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.registrations DROP CONSTRAINT IF EXISTS registrations_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.registrations DROP CONSTRAINT IF EXISTS registrations_event_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.events DROP CONSTRAINT IF EXISTS events_venue_id_fkey;
ALTER TABLE IF EXISTS ONLY public.events DROP CONSTRAINT IF EXISTS events_organizer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bookings DROP CONSTRAINT IF EXISTS bookings_venue_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bookings DROP CONSTRAINT IF EXISTS bookings_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bookings DROP CONSTRAINT IF EXISTS bookings_event_id_fkey;
ALTER TABLE IF EXISTS ONLY public.venues DROP CONSTRAINT IF EXISTS venues_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_uid_key;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS ONLY public.registrations DROP CONSTRAINT IF EXISTS registrations_pkey;
ALTER TABLE IF EXISTS ONLY public.registrations DROP CONSTRAINT IF EXISTS registrations_event_id_user_id_key;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_pkey;
ALTER TABLE IF EXISTS ONLY public.events DROP CONSTRAINT IF EXISTS events_pkey;
ALTER TABLE IF EXISTS ONLY public.bookings DROP CONSTRAINT IF EXISTS bookings_pkey;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.notifications;
DROP VIEW IF EXISTS public.event_stats;
DROP TABLE IF EXISTS public.venues;
DROP TABLE IF EXISTS public.registrations;
DROP TABLE IF EXISTS public.events;
DROP TABLE IF EXISTS public.bookings;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    venue_id uuid,
    user_id uuid,
    event_id uuid,
    start_time timestamp without time zone NOT NULL,
    end_time timestamp without time zone NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT bookings_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    organizer_id uuid,
    venue_id uuid,
    start_time timestamp without time zone NOT NULL,
    end_time timestamp without time zone NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying,
    max_attendees integer,
    created_at timestamp without time zone DEFAULT now(),
    poster_url character varying(500),
    CONSTRAINT events_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'pending_approval'::character varying, 'published'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: registrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.registrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid,
    user_id uuid,
    status character varying(20) DEFAULT 'registered'::character varying,
    registered_at timestamp without time zone DEFAULT now(),
    CONSTRAINT registrations_status_check CHECK (((status)::text = ANY ((ARRAY['registered'::character varying, 'attended'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: venues; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.venues (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    capacity integer NOT NULL,
    location character varying(255),
    amenities jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: event_stats; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.event_stats AS
 SELECT e.id,
    e.title,
    e.status,
    e.max_attendees,
    count(r.id) AS registration_count,
    v.name AS venue_name
   FROM ((public.events e
     LEFT JOIN public.registrations r ON (((e.id = r.event_id) AND ((r.status)::text <> 'cancelled'::text))))
     LEFT JOIN public.venues v ON ((e.venue_id = v.id)))
  GROUP BY e.id, e.title, e.status, e.max_attendees, v.name;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(20) DEFAULT 'student'::character varying,
    department character varying(100),
    created_at timestamp without time zone DEFAULT now(),
    phone character varying(20),
    branch character varying(100),
    section character varying(20),
    uid character varying(50),
    bio text,
    avatar_url character varying(500),
    designation character varying(255),
    employee_id character varying(100),
    office character varying(255),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['student'::character varying, 'faculty'::character varying, 'admin'::character varying])::text[])))
);


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bookings (id, venue_id, user_id, event_id, start_time, end_time, status, created_at) FROM stdin;
e8b53948-ace1-4da3-88b9-c55fa2608775	f6c94913-ac43-45a4-bb4f-8bd0c4004e79	c005e938-98ea-402c-b1ab-147b5b11a885	\N	2026-03-27 14:48:00	2026-03-27 15:48:00	approved	2026-03-27 23:48:37.916123
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.events (id, title, description, organizer_id, venue_id, start_time, end_time, status, max_attendees, created_at, poster_url) FROM stdin;
b5d99624-147d-40ec-a7c0-6026751cc6fb	welfare		0a264d21-99bc-4cd0-8f99-422f075d59c7	29ec0efd-eb76-455f-9b73-8f3010d1c470	2026-04-06 09:37:00	2026-04-06 10:42:00	published	150	2026-03-28 18:39:13.869398	/uploads/1774703353860-95414003.png
5e54f689-0453-4c7e-96c9-49de8a6f6d98	Git Good	GIT GOOD is a hands-on training workshop designed to introduce students and beginners to the fundamentals of Git and GitHub, the most widely used tools for version control and collaborative software development.	0a264d21-99bc-4cd0-8f99-422f075d59c7	f6c94913-ac43-45a4-bb4f-8bd0c4004e79	2026-04-01 09:30:00	2026-04-01 16:26:00	published	200	2026-03-31 15:43:54.667597	/uploads/1774952034587-421050947.jpeg
1b58b757-0bf8-4a16-ac09-2537ad04d352	Advanced IOT Seminar	The programme focuses on the application of IoT and cyber-physical systems in agriculture, including smart monitoring, automation, and data-driven farming techniques. Participants will gain practical exposure to real-world solutions that improve efficiency, sustainability, and productivity in agriculture.	0a264d21-99bc-4cd0-8f99-422f075d59c7	9e9442dc-6310-4584-9d06-59f2fee71f59	2026-03-26 12:00:00	2026-03-27 12:25:00	published	400	2026-03-31 16:03:51.739238	/uploads/1774953231535-448093137.jpeg
8d3c1091-1c86-4838-ac17-b646dcf35049	Urban Symphony	The conclave will feature distinguished speakers from reputed national and international institutions, sharing insights on urban development, sustainability, and architectural innovation.	0a264d21-99bc-4cd0-8f99-422f075d59c7	9e9442dc-6310-4584-9d06-59f2fee71f59	2026-04-12 10:30:00	2026-04-12 12:30:00	published	100	2026-03-31 19:29:40.873249	/uploads/1774965580855-464007332.jpeg
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, message, is_read, created_at) FROM stdin;
02a60c25-a611-4a45-b11f-af2d17f12adb	d25ceaf1-59aa-42e9-91e9-a32205696eca	New booking request for "c1 ground" from c005e938-98ea-402c-b1ab-147b5b11a885	f	2026-03-27 23:48:37.933979
9fb862d6-de47-40f1-a965-8714c815d405	0a264d21-99bc-4cd0-8f99-422f075d59c7	New booking request for "c1 ground" from c005e938-98ea-402c-b1ab-147b5b11a885	t	2026-03-27 23:48:37.938198
3349a06a-65f9-4bad-a4dd-250a21e140f7	c005e938-98ea-402c-b1ab-147b5b11a885	Your booking for "c1 ground" has been approved.	t	2026-03-27 23:48:53.880296
\.


--
-- Data for Name: registrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.registrations (id, event_id, user_id, status, registered_at) FROM stdin;
1981e443-78a8-4426-8532-e236810b4f0f	5e54f689-0453-4c7e-96c9-49de8a6f6d98	a701a410-0eda-4e93-b5b2-c47f122ecfb1	registered	2026-03-31 15:56:28.235231
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, password, role, department, created_at, phone, branch, section, uid, bio, avatar_url, designation, employee_id, office) FROM stdin;
df2cea1e-cc1a-4014-b2f8-548d9a58fe54	Bhargav	bhargav@test.com	$2b$10$NgFGh3bOQnaodOIftsdStupOQIWrlC4osdBoPLwJBqKnUBrO8QY/u	student	Computer Science	2026-03-26 15:42:50.027483	\N	\N	\N	\N	\N	\N	\N	\N	\N
d25ceaf1-59aa-42e9-91e9-a32205696eca	Admin User	admin2@test.com	$2b$10$ZmAB0z6RBXn0VijZQf77aeoZXcVbfzyfMDPfNj1rGP/v1XDwDDPGC	admin	Administration	2026-03-26 15:55:46.774492	\N	\N	\N	\N	\N	\N	\N	\N	\N
a701a410-0eda-4e93-b5b2-c47f122ecfb1	bhargav	24bcs11028@cuchd.in	$2b$10$peBgjCjibYmwKVkB8k3A3uFwu9UkAitHvkKT2Y0Z6ztTCQkYFEknO	student	Computer Science	2026-03-26 20:50:13.40969	\N	\N	\N	\N	\N	\N	\N	\N	\N
c005e938-98ea-402c-b1ab-147b5b11a885	karan	24bcs11033@cuchd.in	$2b$10$81sxDzl34L9kDfcmR73gjuvMg8Zy4E.PmfXEdauCkUQ6BYSe8TCcS	faculty	cse	2026-03-26 21:03:02.958835	\N	\N	\N	\N	\N	\N	\N	\N	\N
32f0a06f-0e1c-48fc-9b2e-7375ae090d66	Priyanshu patel	24bcs12606@cuchd.in	$2b$10$5.qJ.h5HfrIwTZcp6PycZu/YjdNSBwzUEeTJXigkH1A.WpvvI.wE.	student	Computer Science	2026-03-30 10:43:43.914161	\N	\N	\N	\N	\N	\N	\N	\N	\N
ba57b0df-c6de-4583-bef6-0d1ad71a7091	vaibhav	24bcs12275@cuchd.in	$2b$10$mfAqIsfn83t2B17z6LxgZ.rbnP2ai9k0ZSwv5tO7vvYHfMdI/TET6	student	Computer Science	2026-03-31 14:30:56.262099	\N	\N	\N	\N	\N	\N	\N	\N	\N
0a264d21-99bc-4cd0-8f99-422f075d59c7	Ashutosh	bhargav3509@gmail.com	$2b$10$9ONTj3FST7G3876/sPgWX.k7/yvjxeKiCZGCqfs7im6Su4Lji2xi.	admin	cse	2026-03-26 21:00:41.982312						\N	\N	\N	\N
\.


--
-- Data for Name: venues; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.venues (id, name, capacity, location, amenities, is_active, created_at) FROM stdin;
29ec0efd-eb76-455f-9b73-8f3010d1c470	Main Auditorium	500	Block A, Ground Floor	{"ac": true, "wifi": true, "projector": true, "wheelchair_accessible": true}	t	2026-03-26 16:03:17.391605
f6c94913-ac43-45a4-bb4f-8bd0c4004e79	c1 ground	400	chandigarh university	{}	t	2026-03-27 11:59:29.066762
9e9442dc-6310-4584-9d06-59f2fee71f59	Seminar Hall	300	C2-Block	{}	t	2026-03-31 16:00:39.720484
\.


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: registrations registrations_event_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registrations
    ADD CONSTRAINT registrations_event_id_user_id_key UNIQUE (event_id, user_id);


--
-- Name: registrations registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registrations
    ADD CONSTRAINT registrations_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_uid_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_uid_key UNIQUE (uid);


--
-- Name: venues venues_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venues
    ADD CONSTRAINT venues_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: bookings bookings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: bookings bookings_venue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id);


--
-- Name: events events_organizer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_organizer_id_fkey FOREIGN KEY (organizer_id) REFERENCES public.users(id);


--
-- Name: events events_venue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id);


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: registrations registrations_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registrations
    ADD CONSTRAINT registrations_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: registrations registrations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registrations
    ADD CONSTRAINT registrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict LEcuoQulfm4w1WHEnMdOgR6UGgudUcnqw2DIl9yHe8mH4m1QLmjlzfc10RNW8nJ

