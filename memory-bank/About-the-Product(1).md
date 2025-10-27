# About the Product — AI Usage Guide

This document defines the product vision, audience, purpose, and evolving direction of the application.  
It provides **contextual memory** for the AI to ensure all code and features align with the product’s goals and identity.

---

## 🧩 AI Interaction Rules

1. **Always review this document before implementing, refactoring, or suggesting new features.**  
   Use this file to align development choices with the product’s intent, tone, and audience.

2. **When updating or refining product details:**
   - Edit only the relevant sections (Purpose, Target Audience, etc.).  
   - Maintain the existing Markdown heading structure.  
   - Avoid removing historical context unless it’s outdated or replaced with updated data.  
   - When a major change occurs (like a new direction or rebrand), summarize it in the “Product Evolution Log.”

3. **When adding new information:**
   - Place it under the correct section heading.  
   - Use clear, concise, human-readable language.  
   - Maintain professional tone and formatting consistency.

4. **Do not change section titles or structure.**
   - Keep this format intact so the AI can reliably read and update fields.

5. **Use dates for all updates.**
   - Include timestamps in “Product Evolution Log” whenever meaningful updates occur.

---

## 🧱 Product Information Schema

Use the following structure to describe the product.  
Each section contains reserved comment blocks (`<!-- -->`) that signal where to write or edit content.

---

## 🪄 Product Name
<!--
    Insert the official name of the product here.
-->
CoachBoard — Sports Coaching Command Center (Supabase Edition)

---

## 🎯 Purpose / Mission
<!--
    Describe what the product is designed to accomplish and the core problem it solves.
-->
Enable coaches of multiple sports (basketball, soccer, football, baseball, hockey, etc.) to **plan**, **communicate**, and **execute** effectively via a unified platform for **roster management**, **playbooks**, **live game control (play calling, substitutions, time tracking)**, and **post-game analytics**.

---

## 👥 Target Audience
<!--
    Describe the intended users or market segments this product serves.
-->
- Primary: Coaches (youth, high school, college, amateur/semi-pro)  
- Secondary: Assistant coaches, players, team managers  
- Tertiary: Parents (youth sports) for schedules and announcements

---

## 💡 Core Value Proposition
<!--
    Summarize what makes the product valuable or unique compared to alternatives.
-->
- **Multi-sport** workflows in a single app (shared primitives + sport-specific presets).  
- **Realtime** coordination (play-calling broadcast, chat, substitutions) powered by Supabase Realtime.  
- **Low-friction** auth + storage + DB via Supabase; deployable on modern serverless infra.  
- **Mobile-first** sideline UI; offline-friendly patterns for flaky stadium Wi‑Fi.  

---

## 🧩 MVP Objective
<!--
    Define the minimal feature set required for a viable launch.
    This should correspond to the MVP features in implementation-plan.md.
-->
- Supabase Auth with role-based access (coach/player) and team membership.  
- Team & Roster management (players, roles, jersey numbers, availability).  
- Playbook designer (save plays as image + JSON diagram).  
- Live Game Dashboard (play calls → realtime broadcast; basic substitutions & timers).  
- Basic Stats capture and summary charts.  
- Announcements feed (coach → team).

---

## 🧠 Long-Term Vision
<!--
    Describe future expansion goals, potential features, integrations, or business directions.
-->
- AI-assisted play suggestions based on opponent and historical stats.  
- Video tagging and telestration on uploaded clips.  
- PWA offline mode with queueing + sync.  
- Multi-team organizations, scouting reports, and opponent playbooks.  
- Permissions granularity (assistant roles, parent portal).

---

## 🧭 Design & Experience Principles
<!--
    Define key design guidelines and user experience philosophies.
    Examples: simplicity, clarity, accessibility, modern UI, responsive layout, etc.
-->
- **Simplicity & clarity**: zero-conf workflows; 2–3 tap common actions.  
- **Responsiveness**: mobile/tablet first; adaptable to desktop.  
- **Accessibility**: color contrast, keyboard nav, ARIA roles for critical components.  
- **Consistency**: Tailwind 3.4 tokens; shadcn/ui primitives; predictable state flows.  
- **Observability**: log key actions (play call, sub, stat) for robust post-game audits.

---

## 🧰 Technical Overview
<!--
    List core technologies, frameworks, and platforms used (frontend, backend, database, hosting, etc.).
    Example: "Frontend: React + Vite | Backend: Flask | Database: Supabase | Deployment: Vercel MCP"
-->
- **Frontend**: React (Vite) + Tailwind CSS v3.4 + shadcn/ui + Zustand/Redux  
- **Backend/DB**: Supabase (PostgreSQL, Realtime, Auth, Storage)  
- **Auth**: Supabase Auth (email/magic links/password) + RLS policies  
- **Realtime**: Supabase Realtime Channels (presence/play calls/chat)  
- **Storage**: Supabase Storage (play images, exports, media)  
- **Charts**: Recharts / Chart.js  
- **Hosting**: Vercel (frontend) + Supabase (managed backend)

---

## 🧱 Product Structure Overview
<!--
    Optionally, summarize major app sections or components at a high level (e.g., Dashboard, Profile, Reports).
    This helps the AI understand the architecture contextually.
-->
- **Auth** (login/signup, role capture)  
- **Dashboard** (teams overview, next games, quick actions)  
- **Teams** (roster, availability, attendance, roles)  
- **Playbook** (designer, library, share/broadcast)  
- **Games** (scheduler, live dashboard: timer, subs, play calls, stats)  
- **Analytics** (post-game summaries, player trends)  
- **Messages** (announcements & chat)

---

## 📈 Product Evolution Log
> _Chronological updates describing how the product concept, goals, or positioning have changed over time._

<!--
    Example:
    - 2025-10-08 — Initial concept defined.
    - 2025-10-20 — Added analytics and trend visualization to MVP scope.
-->
- 2025-10-15 — Defined Supabase-based MVP with multi-sport support, realtime play calls, and Tailwind 3.4 UI.

---

## 🔒 File Integrity Notes
- Preserve Markdown headings and section order.  
- Keep whitespace between sections.  
- Avoid embedding raw code here — this file is conceptual, not technical.  
- AI should write clear, concise, descriptive English.  
- Always timestamp meaningful updates.
