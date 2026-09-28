# Architecture Walkthrough — Phase 0 & Phase 1

This document explains everything built so far: how the pieces talk to each
other, and what every file is for. Written as a reference to come back to,
not just a one-time read.

---

## 1. The big picture

Four layers, each one only trusting the layer directly next to it:

```
┌─────────────┐      HTTP/JSON       ┌──────────────┐      SQL/JDBC      ┌────────────┐
│   Frontend   │  ───────────────►   │   Backend    │  ───────────────►  │  Database  │
│ React + Vite │  ◄───────────────   │ Spring Boot  │  ◄───────────────  │ PostgreSQL │
│ :5173        │      JSON            │ :8081        │                     │ :5432      │
└─────────────┘                      └──────────────┘                     └────────────┘
                                                                                  ▲
                                                                                  │
                                                                          runs inside Docker
```

- **Frontend** never talks to the database directly. It only knows how to
  call the backend's REST endpoints.
- **Backend** never lets a request touch the database until Spring Security
  has decided whether that request is allowed to be there.
- **Database** doesn't know or care that Java or React exist — it just
  answers SQL queries from whoever connects with the right credentials.

This separation is why you can develop and restart each layer independently:
killing the frontend doesn't touch the backend's data, restarting the
backend doesn't wipe the database (as long as you don't run `docker compose
down -v`).

---

## 2. The database layer

**What it is:** a PostgreSQL 16 server running inside a Docker container,
not installed on Windows directly.

**How it starts:** `docker/docker-compose.yml` defines a single service
(`postgres`) and tells Docker to:
1. Pull the official `postgres:16` image
2. Create a container named `ai-knowledge-hub-db`
3. Mount `database/schema.sql` and `database/seed.sql` so they run
   automatically **the first time** the container's data volume is created
4. Expose port 5432 so things outside the container (like your Spring Boot
   app) can connect to it

**Why the SQL only runs once:** Postgres's Docker image only executes
`docker-entrypoint-initdb.d/*.sql` when it's initializing a *brand new*,
empty data directory. Once the `pgdata` volume exists and has data in it,
those scripts are skipped on every subsequent `docker compose up`. This is
why `docker compose down -v` (which deletes the volume) was the fix earlier
when tables weren't showing up — it forced Postgres to treat the next
startup as brand new again.

**What's actually in the database right now** (from your real `schema.sql`,
which grew beyond the original users/roles scope):
`users`, `roles`, `user_roles`, `workspaces`, `documents`,
`document_versions`, `permissions`, `chat_history`, `activity_logs`,
`notifications`. Only `users`, `roles`, and `user_roles` are actually wired
up to code so far — the rest are ready and waiting for Phase 2+.

---

## 3. The backend layer

**What it is:** a Spring Boot 4.1 application, running on Java 17, that
exposes REST endpoints and talks to Postgres via JPA/Hibernate.

### 3a. How the app boots

1. `KnowledgehubApplication.main()` runs, which calls
   `SpringApplication.run(...)`.
2. Spring scans the `com.enterpriseai.knowledgehub` package and finds every
   class annotated `@Component`, `@Service`, `@RestController`,
   `@Repository`, `@Configuration`, etc., and registers them as **beans** —
   objects Spring manages and can hand to other beans that need them.
3. `application.properties` (or `.yml`) is read, providing the datasource
   URL/credentials, JWT secret, server port, and Hibernate settings.
4. Hibernate connects to Postgres using those credentials and — because
   `ddl-auto: validate` — checks that your `User` and `Role` Java classes
   actually match the real `users` and `roles` tables. If they don't match,
   the app refuses to start rather than silently creating a divergent
   schema. This is intentional: `schema.sql` is the single source of truth
   for the database shape, and the Java entities must stay honest to it.
5. Spring Security's filter chain (defined in `SecurityConfig`) is
   installed in front of every incoming request.
6. Tomcat (the embedded web server) starts listening on port 8081.

### 3b. What happens on `POST /auth/register`

This is the most important flow to understand — everything else follows
the same shape.

1. **Frontend** (`Register.jsx`) collects form input, calls
   `register({...})` from `api/client.js`, which does
   `axios.post('http://localhost:8081/auth/register', body)`.
2. **CORS check** — the browser first confirms the backend's
   `corsConfigurationSource()` bean allows requests from
   `http://localhost:5173`. If not, the browser blocks the request before
   your code even runs (this was the "Could not reach the server" issue).
3. **Spring Security filter chain** — the request passes through
   `JwtAuthFilter` (no token present yet on registration, so it just passes
   through untouched), then reaches `SecurityConfig`'s rule that
   `/auth/**` is `permitAll()` — no authentication required to register.
4. **`AuthController.register()`** receives the parsed JSON as a
   `RegisterRequest` DTO. `@Valid` triggers the validation annotations on
   that DTO (`@NotBlank`, `@Email`, `@Size(min = 8)`). If any fail, Spring
   throws `MethodArgumentNotValidException` **before your method body even
   runs**, and `GlobalExceptionHandler.handleValidation()` catches it and
   returns a 400 with a `fields` map — this is exactly the "Validation
   failed" response you saw.
5. **`AuthService.register()`** does the actual work:
   - Checks `userRepository.existsByEmail(...)` — rejects duplicates
   - Looks up the default `EMPLOYEE` role via `RoleRepository`
   - Hashes the plaintext password with `BCryptPasswordEncoder` — the raw
     password is never stored or logged
   - Builds a `User` entity and saves it via `userRepository.save(user)`,
     which Hibernate translates into an `INSERT INTO users ...` (and an
     `INSERT INTO user_roles ...` for the role link, because of the
     `@ManyToMany` mapping)
   - Immediately generates a JWT for the new user via `JwtService`, so they
     don't have to log in again right after registering
6. **Response** — `AuthController` wraps the result in an `AuthResponse`
   DTO (id, name, email, roles, token) and returns HTTP 201.
7. **Frontend** — `setSession(response)` in `AuthContext` stores the token
   and user info in `localStorage`, updates React state, and
   `navigate('/dashboard')` redirects you into the protected area.

### 3c. What happens on `POST /auth/login`

Same shape, but instead of creating a user, `AuthService.login()` hands the
email/password to Spring Security's `AuthenticationManager`, which uses the
`DaoAuthenticationProvider` we configured — that provider calls
`CustomUserDetailsService.loadUserByUsername(email)` to fetch the real user
from the database, then compares the submitted password against the stored
BCrypt hash. If it matches, a JWT is issued the same way as registration.
If not, Spring throws `BadCredentialsException`, which
`GlobalExceptionHandler` turns into a clean 401.

### 3d. What happens on every *other* request (e.g. a future protected route)

1. `JwtAuthFilter` runs on literally every request, before your controller
   ever sees it.
2. It looks for an `Authorization: Bearer <token>` header.
3. If present, `JwtService.extractEmail()` decodes the token's payload
   (this only works if the token was signed with your backend's own secret
   — anyone tampering with it invalidates the signature).
4. It loads that user via `CustomUserDetailsService`, confirms the token
   hasn't expired, and — if everything checks out — tells Spring Security
   "this request is authenticated as this user" by populating the
   `SecurityContextHolder`.
5. Only *then* does the request reach `SecurityConfig`'s
   `.anyRequest().authenticated()` rule, which now passes, and finally your
   `@RestController` method runs.

If any step fails, the filter just does nothing and lets the request
continue unauthenticated — which means it then gets rejected at step 5 with
a 401, rather than crashing outright.

---

## 4. The frontend layer

**What it is:** a React app built with Vite, using React Router for
navigation and a lightweight Context (`AuthContext`) instead of a heavier
state library — appropriate for how much state this app currently has (just
"who's logged in").

**Key idea — the API client is the only thing that knows about the
backend.** Every component calls functions from `api/client.js`
(`register()`, `login()`) rather than constructing `fetch`/`axios` calls
themselves. This means if the backend's URL or auth mechanism ever changes,
you only edit one file.

**Key idea — the token lives in `localStorage`, and an axios interceptor
attaches it automatically.** Once `AuthContext.setSession()` stores the
token, *every future request* made through the shared `client` instance in
`api/client.js` automatically gets an `Authorization: Bearer <token>`
header via the `client.interceptors.request.use(...)` block — you never
have to remember to attach it manually in each component.

**Key idea — `ProtectedRoute` is a gatekeeper, not a security boundary.**
It stops the *browser* from rendering the dashboard if there's no user in
context, which is good UX (no flash of content, clean redirect to
`/login`). But the *real* security is enforced entirely server-side by
`JwtAuthFilter` and `SecurityConfig` — a person could bypass
`ProtectedRoute` by editing the JS, but they still couldn't get real data
back from the backend without a valid token.

---

## 5. Full file structure & purpose

```
Enterprise-AI-Knowledge-Hub/
│
├── database/
│   ├── schema.sql          → Defines every table (users, roles, workspaces,
│   │                          documents, etc). Source of truth for DB shape.
│   │                          Runs once, on first container init.
│   └── seed.sql             → Inserts default roles + one admin user so the
│                               app isn't empty on first run.
│
├── docker/
│   └── docker-compose.yml   → Defines and runs the Postgres container.
│                               Mounts schema.sql/seed.sql for auto-init.
│                               Will later also define backend/frontend/
│                               ai-service containers.
│
├── backend/
│   ├── pom.xml               → Maven's manifest: declares Java 17, Spring
│   │                            Boot 4.1, and every library the project
│   │                            depends on (web, JPA, security, JWT, etc).
│   ├── src/main/resources/
│   │   └── application.properties → All runtime config: DB connection,
│   │                                 server port, JWT secret/expiry,
│   │                                 Hibernate behavior.
│   └── src/main/java/com/enterpriseai/knowledgehub/
│       ├── KnowledgehubApplication.java → The entry point. Boots Spring.
│       │
│       ├── entity/
│       │   ├── User.java     → Java mirror of the `users` table. Also
│       │   │                    declares the many-to-many link to Role via
│       │   │                    `user_roles`.
│       │   └── Role.java     → Java mirror of the `roles` table.
│       │
│       ├── repository/
│       │   ├── UserRepository.java → Auto-implemented by Spring Data JPA.
│       │   │                          Gives you findByEmail, save, etc,
│       │   │                          without writing any SQL.
│       │   └── RoleRepository.java → Same idea, for roles.
│       │
│       ├── dto/               → "Data Transfer Objects" — shapes for what
│       │   │                     goes over the wire, kept separate from
│       │   │                     entities so the DB schema and the API
│       │   │                     contract can evolve independently.
│       │   ├── RegisterRequest.java → What /auth/register expects as input,
│       │   │                           with validation annotations.
│       │   ├── LoginRequest.java    → What /auth/login expects as input.
│       │   └── AuthResponse.java    → What both endpoints return: user info
│       │                              + JWT.
│       │
│       ├── security/
│       │   ├── SecurityConfig.java  → The rulebook: which routes are public
│       │   │                           vs protected, CORS rules, password
│       │   │                           hashing strategy, and wiring the JWT
│       │   │                           filter into the request pipeline.
│       │   ├── JwtService.java      → Creates and decodes JWTs. The only
│       │   │                           class that touches the signing
│       │   │                           secret directly.
│       │   ├── CustomUserDetailsService.java → Bridges your `User` entity
│       │   │                                    to the shape Spring
│       │   │                                    Security expects, including
│       │   │                                    converting roles into
│       │   │                                    Spring's authority format.
│       │   └── JwtAuthFilter.java   → Runs on every request. Reads the
│       │                               Bearer token, validates it, and
│       │                               tells Spring Security who's calling.
│       │
│       ├── service/
│       │   └── AuthService.java     → The actual business logic for
│       │                               register/login. Controllers stay
│       │                               thin; logic lives here.
│       │
│       ├── controller/
│       │   ├── HealthController.java → GET /health — proves the whole
│       │   │                            stack (Spring → JPA → Postgres) is
│       │   │                            wired correctly.
│       │   └── AuthController.java   → POST /auth/register,
│       │                                POST /auth/login. Thin — just
│       │                                delegates to AuthService.
│       │
│       └── exception/
│           └── GlobalExceptionHandler.java → Catches exceptions thrown
│                                               anywhere in the app (bad
│                                               credentials, duplicate email,
│                                               failed validation) and turns
│                                               them into clean, consistent
│                                               JSON error responses instead
│                                               of raw stack traces.
│
└── frontend/
    ├── package.json          → Declares dependencies: React, React Router,
    │                            axios, Vite.
    ├── vite.config.js        → Dev server config (runs on port 5173).
    ├── index.html            → The single real HTML page; React takes over
    │                            from here. Also loads the Google Fonts used
    │                            by the design system.
    └── src/
        ├── main.jsx           → Entry point: mounts <App /> into the DOM.
        ├── App.jsx            → Defines all routes (/login, /register,
        │                        /dashboard) and wraps everything in
        │                        AuthProvider.
        ├── styles/
        │   └── global.css     → Design tokens (colors, fonts) as CSS
        │                        variables, plus base resets.
        ├── api/
        │   └── client.js      → The ONLY file that knows the backend's URL.
        │                        Wraps axios, auto-attaches the JWT to every
        │                        request, and turns backend error responses
        │                        into readable messages.
        ├── context/
        │   └── AuthContext.jsx → Holds "who is currently logged in" as
        │                          shared React state, backed by
        │                          localStorage so a page refresh doesn't
        │                          log you out.
        ├── components/
        │   ├── AuthLayout.jsx  → The shared split-screen shell (brand panel
        │   │                     + form panel) used by both Login and
        │   │                     Register.
        │   ├── FormField.jsx   → Reusable labeled input with error display,
        │   │                     so every form field looks/behaves the same.
        │   └── ProtectedRoute.jsx → Redirects to /login if there's no user
        │                             in context. UX convenience, not real
        │                             security (that's the backend's job).
        └── pages/
            ├── Login.jsx       → The sign-in form. Calls api/client's
            │                     login(), then AuthContext.setSession().
            ├── Register.jsx    → The sign-up form. Same pattern, calls
            │                     register().
            └── Dashboard.jsx   → Placeholder landing page after auth,
                                   proving the protected flow works. Phase 2
                                   will replace this with real workspace/
                                   document features.
```

---

## 6. The mental model to keep going forward

Every new feature you add from here follows the same five-layer pattern
you've now built once, end to end:

1. **Table** in `schema.sql` (if new data needs to be stored)
2. **Entity** in `entity/` (Java mirror of that table)
3. **Repository** in `repository/` (how to query it)
4. **Service** in `service/` (the actual logic/rules)
5. **Controller** in `controller/` (the HTTP endpoint), often paired with
   **DTOs** in `dto/` to define exactly what goes over the wire
6. **Frontend page/component** that calls it through `api/client.js`

You've now done this once for `users`/`roles`/auth. Phase 2 (workspaces and
document upload) is the same shape, applied to the `workspaces` and
`documents` tables that already exist in your schema but aren't wired to
code yet.