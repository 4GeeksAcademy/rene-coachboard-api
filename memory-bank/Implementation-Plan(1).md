# Implementation Plan — AI Usage Guide

This document serves as a **living implementation record** for the project.  
It defines all planned and completed features, milestones, and technical steps required to reach and evolve the MVP.

---

## 🧩 AI Interaction Rules

1. **Always read this file before beginning any new feature or code change.**  
   Use it to understand what features exist, their current status, and dependencies.

2. **When adding a new feature:**
   - Duplicate the “Feature Implementation Plan Model” shown below.  
   - Replace all placeholder fields (`[Feature Name]`, etc.) with real details.  
   - Insert the new feature under the appropriate section (MVP, Post-MVP, or Other).  
   - Maintain consistent formatting.

3. **When updating progress:**
   - Update the **Status** field.  
   - Check off relevant items in **Implementation Steps** and **Acceptance Criteria**.  
   - Update the **Last Updated** date.  
   - If implementation details evolve, expand the “Technical Breakdown” or “Testing Notes.”

4. **When completing a major milestone (e.g., MVP deployment):**
   - Add a short summary entry at the bottom under “Development Notes” describing what changed or was achieved.

5. **Do not delete or overwrite past feature sections.**
   - Instead, mark them as “Complete” and update the timestamp.
   - This document should reflect a chronological record of development history.

---

## 🧱 Feature Implementation Plan Model

Use this exact structure when creating or updating feature entries.

### Example Template

## Feature: [Feature Name]

**Purpose:**  
_Describe the intent and reason for this feature._

**User Story / Use Case:**  
_As a [user type], I want to [perform an action] so that I can [achieve benefit]._

**Dependencies / Prerequisites:**  
_List related systems, APIs, libraries, or other features required before this one can function._

**Technical Breakdown:**  
- _Frontend components/pages to build_  
- _Backend endpoints or database tables needed_  
- _Key logic or architectural notes_  

**Implementation Steps:**  
- [ ] Step 1: _Define or set up structure_  
- [ ] Step 2: _Build primary functionality_  
- [ ] Step 3: _Integrate with data sources or APIs_  
- [ ] Step 4: _Add validations/tests_  
- [ ] Step 5: _UI/UX refinements_

**Acceptance Criteria:**  
- [ ] _Feature works as intended_  
- [ ] _No errors in console/build_  
- [ ] _Responsive layout verified_  
- [ ] _Feature integrated with related systems_

**Testing & Validation Notes:**  
_Specify how to test functionality and what tools to use._

**Post-Implementation Actions:**  
_Follow-ups such as documentation, styling, or refactoring._

**Status:** Not Started / In Progress / Blocked / Complete  
**Last Updated:** YYYY-MM-DD

---

# 🧭 Implementation Sections

Below are the main phases of implementation.  
Each section contains **reserved space** where the AI (or a developer) should insert detailed feature entries using the model above.

---

## 🚀 MVP Features

### Feature: Authentication & Roles (Supabase Auth + Profiles)
**Purpose:**  
Establish secure login and role-aware access for **coach** and **player**, including team membership resolution.

**User Story / Use Case:**  
As a coach or player, I can authenticate via email/magic link/password and the app loads my teams and permissions.

**Dependencies / Prerequisites:**  
- Supabase project with Auth enabled  
- Tailwind 3.4, React, shadcn/ui  
- RLS enabled on all tables

**Technical Breakdown:**  
- Frontend: Login page, role capture modal on first login, session listener, route guards.  
- Backend/DB (Supabase): `profiles`, `teams`, `team_members`.  
- RLS: restrict selects/inserts/updates by `auth.uid()` membership and role.

**SQL (DDL):**
```sql
-- Profiles mirror for auth.users
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text check (role in ('coach','player')),
  avatar_url text,
  created_at timestamptz default now()
);

-- Teams and team membership
create table if not exists public.teams (
  id bigint generated always as identity primary key,
  name text not null,
  sport text not null,
  coach_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.team_members (
  team_id bigint references public.teams(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role_on_team text check (role_on_team in ('coach','assistant','player')) not null default 'player',
  jersey_number int,
  is_active boolean default true,
  primary key (team_id, user_id),
  created_at timestamptz default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;

create policy "profiles are self-visible" on public.profiles
  for select using (auth.uid() = user_id);
create policy "profiles are self-updatable" on public.profiles
  for update using (auth.uid() = user_id);

create policy "team coach can select team" on public.teams
  for select using (coach_id = auth.uid());
create policy "member can select their team" on public.teams
  for select using (exists (
  select 1 from public.team_members tm where tm.team_id = id and tm.user_id = auth.uid()
));

create policy "members manage own membership" on public.team_members
  for select using (user_id = auth.uid() or exists (
    select 1 from public.teams t where t.id = team_id and t.coach_id = auth.uid()
  ));
```

**Implementation Steps:**  
- [ ] Build auth UI, session handling, and role capture.  
- [ ] Create RLS policies and test different roles.  
- [ ] Implement team membership loading in dashboard.

**Acceptance Criteria:**  
- [ ] Users can log in and see their teams.  
- [ ] Coaches can see/manage their teams; players see only their own teams.  
- [ ] Unauthorized access is denied by RLS.

**Testing & Validation Notes:**  
Unit test hooks for session; RLS tests via PostgREST; Cypress e2e for route guards.

**Post-Implementation Actions:**  
Seed demo users/teams for previews.

**Status:** Not Started  
**Last Updated:** 2025-10-15

---

### Feature: Team & Roster Management
**Purpose:**  
Create/edit teams; manage roster (players, roles, numbers, availability).

**User Story / Use Case:**  
As a coach, I can add players to a team, assign numbers/roles, and track availability.

**Dependencies / Prerequisites:**  
Auth & Roles feature; UI library; RLS policies.

**Technical Breakdown:**  
- Frontend: TeamPage (list + detail), forms, availability calendar.  
- Backend/DB: `teams`, `team_members`, `availability`.

**SQL (DDL):**
```sql
create table if not exists public.availability (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  team_id bigint not null references public.teams(id) on delete cascade,
  date date not null,
  status text check (status in ('available','injured','absent','questionable')) not null default 'available',
  note text,
  created_at timestamptz default now(),
  unique (user_id, team_id, date)
);

alter table public.availability enable row level security;

create policy "member can see team availability" on public.availability
for select using (exists (
  select 1 from public.team_members tm where tm.team_id = availability.team_id and tm.user_id = auth.uid()
));
create policy "self can upsert own availability or coach edits team" on public.availability
for insert with check (
  user_id = auth.uid() and exists (select 1 from public.team_members tm where tm.team_id = availability.team_id and tm.user_id = auth.uid())
)
, for update using (
  user_id = auth.uid() or exists (select 1 from public.teams t where t.id = availability.team_id and t.coach_id = auth.uid())
);
```

**Implementation Steps:**  
- [ ] Team CRUD (coach only).  
- [ ] Add/remove members; edit jersey numbers and roles.  
- [ ] Availability UI with filters.

**Acceptance Criteria:**  
- [ ] Coach can manage team and roster.  
- [ ] Members can view and set their availability.  
- [ ] RLS prevents cross-team access.

**Status:** Not Started  
**Last Updated:** 2025-10-15

---

### Feature: Playbook Designer
**Purpose:**  
Design, store, and share plays. Each play has metadata, an image preview, and a JSON diagram for step-by-step animations.

**User Story / Use Case:**  
As a coach, I draw a play, save it, and broadcast it to assistants/players in real time.

**Dependencies / Prerequisites:**  
Auth & Roles; Storage; Realtime.

**Technical Breakdown:**  
- Frontend: `PlayDesigner` (Konva/Fabric), `PlayList`, `PlayDetail`.  
- Backend/DB: `plays`, `play_tags`; Storage buckets: `plays/diagrams`.  
- Realtime: channel `plays:team_{id}` for broadcast.

**SQL (DDL):**
```sql
create table if not exists public.plays (
  id bigint generated always as identity primary key,
  team_id bigint not null references public.teams(id) on delete cascade,
  title text not null,
  description text,
  sport_type text not null,
  diagram_json jsonb not null,  -- coordinates, frames, actors
  preview_image_url text,       -- Supabase Storage public path
  visibility text check (visibility in ('team','private')) not null default 'team',
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.play_tags (
  play_id bigint references public.plays(id) on delete cascade,
  tag text not null,
  primary key (play_id, tag)
);

alter table public.plays enable row level security;
alter table public.play_tags enable row level security;

create policy "team members can read plays" on public.plays
for select using (exists (
  select 1 from public.team_members tm where tm.team_id = plays.team_id and tm.user_id = auth.uid()
));
create policy "coach creates/updates plays" on public.plays
for insert with check (exists (select 1 from public.teams t where t.id = team_id and t.coach_id = auth.uid()))
, for update using (created_by = auth.uid() or exists (select 1 from public.teams t where t.id = team_id and t.coach_id = auth.uid()));
```

**Implementation Steps:**  
- [ ] Canvas tool to add/move players, paths, labels.  
- [ ] Save JSON + upload preview image to Storage.  
- [ ] Tagging and search; list with filters.

**Acceptance Criteria:**  
- [ ] Plays persist with image + JSON.  
- [ ] Only team members can view; only coach/author can edit.  
- [ ] Broadcast-ready payload exists.

**Status:** Not Started  
**Last Updated:** 2025-10-15

---

### Feature: Live Game Dashboard (Timers, Subs, Play Calls)
**Purpose:**  
Provide in-game control center for coaches: start/stop timers, manage substitutions/rotations, and broadcast selected plays in real time.

**User Story / Use Case:**  
As a coach, I can choose a play and all team clients immediately view it; I can track playtime and subs.

**Dependencies / Prerequisites:**  
Auth & Roles; Playbook Designer; Realtime.

**Technical Breakdown:**  
- Frontend: `GameDashboard` with timers, substitutions UI, play broadcast button, Realtime presence.  
- Backend/DB: `games`, `game_lineups`, `substitutions`, `play_calls`.  
- Realtime: channels per game `game:{id}` for presence, events.

**SQL (DDL):**
```sql
create table if not exists public.games (
  id bigint generated always as identity primary key,
  team_id bigint not null references public.teams(id) on delete cascade,
  opponent text,
  date timestamptz not null,
  location text,
  status text check (status in ('scheduled','live','final')) not null default 'scheduled',
  created_at timestamptz default now()
);

create table if not exists public.game_lineups (
  game_id bigint references public.games(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  starter boolean default false,
  primary key (game_id, user_id)
);

create table if not exists public.substitutions (
  id bigint generated always as identity primary key,
  game_id bigint not null references public.games(id) on delete cascade,
  out_user_id uuid not null references auth.users(id) on delete cascade,
  in_user_id uuid not null references auth.users(id) on delete cascade,
  timestamp_ms bigint not null,  -- relative to game clock start
  period int default 1,
  created_at timestamptz default now()
);

create table if not exists public.play_calls (
  id bigint generated always as identity primary key,
  game_id bigint not null references public.games(id) on delete cascade,
  play_id bigint not null references public.plays(id) on delete cascade,
  called_by uuid not null references auth.users(id) on delete cascade,
  context jsonb, -- e.g., "ATO", "baseline out-of-bounds", shot clock
  created_at timestamptz default now()
);

alter table public.games enable row level security;
alter table public.game_lineups enable row level security;
alter table public.substitutions enable row level security;
alter table public.play_calls enable row level security;

create policy "team members can read game data" on public.games
for select using (exists (
  select 1 from public.team_members tm where tm.team_id = games.team_id and tm.user_id = auth.uid()
));

create policy "coach manages games" on public.games
for insert with check (exists (select 1 from public.teams t where t.id = team_id and t.coach_id = auth.uid()))
, for update using (exists (select 1 from public.teams t where t.id = team_id and t.coach_id = auth.uid()));
```

**Implementation Steps:**  
- [ ] Game creation & lineup assignment.  
- [ ] Realtime presence + broadcast events for play calls.  
- [ ] Substitution logging and basic time-on-court calculation.

**Acceptance Criteria:**  
- [ ] Clients in the same game receive play calls instantly.  
- [ ] Sub logs compute minutes per player.  
- [ ] RLS enforces team-only visibility.

**Status:** Not Started  
**Last Updated:** 2025-10-15

---

### Feature: Stats & Analytics
**Purpose:**  
Capture per-player, per-game stats and render summaries/trends.

**User Story / Use Case:**  
As a coach, I can log events (e.g., points, shots, assists) and view post-game summaries and trends.

**Dependencies / Prerequisites:**  
Games; Team & Roster.

**Technical Breakdown:**  
- Frontend: stat event buttons, charts (Recharts).  
- Backend/DB: `stat_events` (event-sourced), `stat_views` (SQL view for summaries).

**SQL (DDL):**
```sql
create table if not exists public.stat_events (
  id bigint generated always as identity primary key,
  game_id bigint not null references public.games(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,   -- e.g., "shot_made_2", "shot_missed_3", "assist", "rebound_off", "steal"
  value numeric,              -- optional numeric value
  period int default 1,
  game_clock_ms bigint,       -- time in period
  metadata jsonb,             -- shot location, etc.
  created_at timestamptz default now()
);

-- Example materialized view (optional) to aggregate per game/player
-- create materialized view public.stat_summaries as
-- select game_id, user_id,
--   sum(case when event_type='shot_made_2' then 2 when event_type='shot_made_3' then 3 else 0 end) as points,
--   sum(case when event_type like 'shot_made_%' then 1 else 0 end) as fgm,
--   sum(case when event_type like 'shot_missed_%' then 1 else 0 end) as fga
-- from public.stat_events group by game_id, user_id;
```

**Implementation Steps:**  
- [ ] Event buttons → insert `stat_events`.  
- [ ] Summary queries for box score and charts.  
- [ ] Export CSV/PDF (frontend-generated).

**Acceptance Criteria:**  
- [ ] Box score accurate from events.  
- [ ] Charts show per-player and per-team trends.  
- [ ] RLS restricts to team members.

**Status:** Not Started  
**Last Updated:** 2025-10-15

---

### Feature: Communication (Announcements & Chat)
**Purpose:**  
Provide a simple communication layer for team-wide announcements and basic chat.

**User Story / Use Case:**  
As a coach, I post announcements; team members receive them. Team chat supports coordination.

**Dependencies / Prerequisites:**  
Auth & Roles; Teams; Realtime.

**Technical Breakdown:**  
- Frontend: `Announcements`, `ChatBox`.  
- Backend/DB: `announcements`, `messages`; Realtime channels `team:{id}:chat`.

**SQL (DDL):**
```sql
create table if not exists public.announcements (
  id bigint generated always as identity primary key,
  team_id bigint not null references public.teams(id) on delete cascade,
  title text not null,
  content text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  team_id bigint not null references public.teams(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

alter table public.announcements enable row level security;
alter table public.messages enable row level security;

create policy "team members can read msgs" on public.messages
for select using (exists (
  select 1 from public.team_members tm where tm.team_id = messages.team_id and tm.user_id = auth.uid()
));
create policy "team members can write msgs" on public.messages
for insert with check (exists (
  select 1 from public.team_members tm where tm.team_id = messages.team_id and tm.user_id = auth.uid()
));
create policy "coach posts announcements" on public.announcements
for insert with check (exists (
  select 1 from public.teams t where t.id = team_id and t.coach_id = auth.uid()
));
```

**Implementation Steps:**  
- [ ] Announcements CRUD (coach).  
- [ ] Chat send/receive via Realtime.  
- [ ] Notifications (optional service worker).

**Acceptance Criteria:**  
- [ ] Team-only visibility for messages.  
- [ ] New messages appear in <1s via Realtime.  
- [ ] Coach-only announcements creation enforced.

**Status:** Not Started  
**Last Updated:** 2025-10-15

---

## 🧩 Post-MVP Enhancements
- Video uploads + tagging (Storage + metadata table).  
- AI play suggestions.  
- Parent portal (read-only schedule and announcements).  
- Advanced permissions (assistants, trainers).  
- Offline queue + sync.

---

## 🧪 Experimental / Optional Features
- Voice control for play calls.  
- Computer-vision shot charting from video.  
- Wearables integration for fatigue tracking.

---

## 🧾 Deployment & Integration Tasks
- Env-specific RLS tests and seed data.  
- Storage buckets: `plays`, `exports`, `media` with appropriate policies.  
- Realtime channel naming: `team:{id}`, `game:{id}`; presence payload schema.  
- Error/event logging tables (optional).

---

## 🧠 Development Notes
- 2025-10-15 — Drafted MVP features with SQL DDL and RLS examples.  
