# Smart Campus Platform - In-Depth Viva Voce Guide

This is an advanced, in-depth guide detailing the internal workings of the Smart Campus (EveSphere) platform. It covers database schemas, specific code flows, and advanced technical questions.

## 1. Complete Architecture & Tech Stack

### **Frontend (Client-Side)**
- **Core Framework:** React.js (v19)
- **Routing:** React Router v7. `<PrivateRoute>` component handles role-based rendering.
- **Styling:** Tailwind CSS + PostCSS. Tailwind's utility-first approach allows for zero external CSS file dependencies.
- **State Management & Data Fetching:** 
  - `AuthContext`: A React Context provider that globally stores the user's `role` and `token`.
  - `@tanstack/react-query`: Used for caching API requests on the client side, preventing redundant network calls.
  - `axios`: Pre-configured via `src/services/api.js` to automatically attach the JWT token (stored in `localStorage`) to the `Authorization` header using an interceptor.

### **Backend (Server-Side)**
- **Core Framework:** Node.js + Express.js (v5)
- **Database Connection:** Uses the `pg` library (`Pool`) to connect to PostgreSQL. Raw SQL queries are used instead of an ORM (like Prisma or Sequelize) to ensure maximum performance and control over complex joins.
- **Authentication:** `jsonwebtoken` (JWT) for stateless sessions and `bcryptjs` for hashing user passwords before they enter the database.
- **External Integrations:**
  - **AWS S3 (`@aws-sdk/client-s3`):** Images uploaded via `multer` are streamed directly to S3. The Postgres database only stores the S3 URL (e.g., `poster_url`).
  - **Nodemailer:** Used in `emailService.js` to send real-time emails for event registrations, cancellations, and password resets.
  - **QRCode (`qrcode`):** The backend generates Base64 QR codes containing event registration URLs.

### **Infrastructure (DevOps)**
- **Docker Compose:** Orchestrates 4 containers:
  1. `postgres` (PostgreSQL 17, with volume mounting `postgres_data` for persistence).
  2. `redis` (Redis Cache for fast data retrieval).
  3. `backend` (Node API running on port 5001).
  4. `frontend` (React app running on port 80).

---

## 2. Relational Database Schema (PostgreSQL)

### Core Tables & Relationships
1. **`users` Table**
   - `id` (Primary Key)
   - `name`, `email` (Unique)
   - `password` (Hashed via bcrypt)
   - `role` (Enum: `student`, `faculty`, `admin`)
   
2. **`venues` Table**
   - `id` (Primary Key)
   - `name`

3. **`events` Table**
   - `id` (Primary Key)
   - `title`, `description`
   - `start_time`, `end_time`
   - `max_attendees`
   - `poster_url` (Stored as AWS S3 link)
   - `status` (e.g., `pending`, `published`)
   - `organizer_id` (Foreign Key referencing `users.id`)
   - `venue_id` (Foreign Key referencing `venues.id`)

4. **`registrations` Table (Many-to-Many Bridge)**
   - `event_id` (Foreign Key referencing `events.id`)
   - `user_id` (Foreign Key referencing `users.id`)
   - *Composite Primary Key (`event_id`, `user_id`) to prevent duplicate registrations.*

---

## 3. Deep Dive: Code Flow of "Registering for an Event"

If the examiner asks: *"Walk me through exactly what happens in the code when a student registers for an event."*

1. **Frontend Trigger:** Student clicks "Register" on the React frontend. An Axios POST request is made to `/api/events/:id/register`. The Axios interceptor automatically attaches the student's JWT token.
2. **Backend Authentication (Middleware):** The request hits the Express route. An authentication middleware runs, verifies the JWT using a secret key, and attaches the decoded user data (`req.user = { id, role }`) to the request.
3. **Controller Validation (`eventController.js`):** 
   - The backend runs a `SELECT` query to ensure the event exists.
   - It runs another `SELECT` query on the `registrations` table to check if the user is *already* registered. If yes, it returns a 400 Error.
4. **Database Insert:** The backend executes `INSERT INTO registrations (event_id, user_id) VALUES ($1, $2)`.
5. **Email Notification:** The backend calls `sendRegistrationConfirmation()` (from `emailService.js`), which connects to an SMTP server via Nodemailer to email the student their ticket.
6. **Frontend Update:** The frontend receives a 201 Created status, shows a success Toast notification, and React Query automatically refetches the student's dashboard data to show the newly registered event.

---

## 4. Advanced Viva Questions & Answers

**Q1: Why did you choose raw SQL (`pg` Pool) over an ORM like Prisma or Sequelize?**
> *Answer:* While ORMs speed up development, we chose raw SQL via the `pg` library because it gives us absolute control over query optimization. In endpoints like `getEvents`, we use dynamic `LEFT JOIN`s (joining events with users and venues) and dynamic `WHERE` clauses depending on the user's role and search parameters. Raw SQL ensures we don't suffer from the "N+1 query problem" common in ORMs.

**Q2: How do you handle file uploads, and why didn't you save images directly to the PostgreSQL database or local disk?**
> *Answer:* Saving images as `BLOB`s in a relational database bloats the database and ruins performance. Saving them to the local disk is a bad practice in modern cloud deployments (like Docker or Render) because containers are ephemeral—if the container restarts, the images are lost. Instead, we use `multer` to intercept the file, stream it directly to an AWS S3 bucket, and only save the S3 public URL string in the Postgres database.

**Q3: Can you explain how the Axios Interceptor works in your project?**
> *Answer:* In `src/services/api.js`, we configure an Axios interceptor on the request object. Before any HTTP request leaves the React app, the interceptor checks `localStorage` for a JWT. If it finds one, it mutates the request config to include `headers.Authorization = 'Bearer <token>'`. This centralizes our authentication logic so we don't have to manually attach tokens in every single component.

**Q4: How does the QR code generation work?**
> *Answer:* When an admin generates a QR code for an event, the backend uses the `qrcode` library to generate a Base64 image string. The QR data encodes a specific URL (e.g., `http://frontend/register-event/123`). The React frontend receives this Base64 string and renders it in an `<img>` tag. When a user scans it, their phone directs them to that specific React route to complete the registration.

**Q5: How does your Docker network allow the backend to talk to PostgreSQL?**
> *Answer:* In our `docker-compose.yml`, we define a custom bridge network called `smart-campus_default`. Containers on the same network can communicate using their service names as hostnames. So, in the backend's `.env` file, the `DB_HOST` is simply set to `postgres` (the name of the DB service), and Docker's internal DNS automatically resolves that to the correct container IP.

**Q6: What is a Many-to-Many relationship, and how is it implemented in your database?**
> *Answer:* A many-to-many relationship occurs when multiple records in one table relate to multiple records in another. For example, a User can attend many Events, and an Event has many Users attending. We resolve this by creating a "bridge" or "junction" table called `registrations`. It holds the `user_id` and `event_id` as foreign keys, linking the two entities together.
