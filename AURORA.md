# Aurora — Product & Technical Overview

This document describes **what Aurora is**, how the product is structured, and the main **features and systems** implemented in this repository. It is intended for onboarding, stakeholders, and developers.

---

## What is Aurora?

**Aurora** is a mental-health–oriented **mobile companion and community app**. It combines:

1. **Peer community** — a feed of posts, comments, and themed **groups** where people can share experiences and support each other.  
2. **Aurora AI** — a **text** and **voice** conversational assistant designed to respond in a warm, therapeutic style (reflection, emotional naming, open questions). The AI can use **optional context** the user has chosen to share (for example journal entries, profile/health notes, and calendar items) to personalize support.  
3. **Personal tools** — **journals** with mood and symptoms, **insights**, a simple **calendar**, **direct messages**, and **notifications**.

Aurora is **not** a replacement for emergency services, clinical diagnosis, or a licensed therapist. The product includes **safety-oriented backend logic** (for example risk signal handling and content moderation hooks) and users should be directed to professional and crisis resources when appropriate.

The **primary language of the app experience** is **English**; the client also supports **localized strings** via a settings-driven translation layer.

---

## High-Level Architecture

| Layer | Technology | Role |
|--------|------------|------|
| **Mobile app** | **Expo / React Native** (Expo Router ~54), TypeScript | iOS & Android client, EAS updates, RevenueCat subscriptions |
| **Backend API** | **Node.js**, **Express**, **TypeScript**, **MongoDB** (Mongoose) | REST API, file uploads, AI orchestration, push-friendly jobs |
| **Real-time** | **WebSockets** (`/ws/chat`, `/ws/notifications`) | Chat delivery signals / notification channel (see server wiring) |
| **AI providers** | **Anthropic (Claude)** and **OpenAI** (as implemented in services) | Streaming and non-streaming chat completions, journal-style analysis where used |
| **Email** | **SendGrid** | Transactional email (e.g. verification flows) |

Typical deployment: **API** hosted (e.g. **Railway**), database **MongoDB**, static/media via **uploads** and/or **GridFS** patterns as configured in the backend.

---

## Mobile App — Information Architecture

### Main tabs (authenticated shell)

After login, the bottom navigation centers on five areas:

| Tab | Route | Purpose |
|-----|--------|---------|
| **Feed** | `(tabs)/index` | Home timeline of community **posts** |
| **Connect** | `(tabs)/groups` | **Groups** discovery and membership |
| **Aurora** | `(tabs)/aurora` | Hub for the AI experience, journaling shortcuts, daily quote–style content, premium gating entry points |
| **Messages** | `(tabs)/chat` | **Direct message** conversations list |
| **Profile** | `(tabs)/profile` | Own profile, settings entry, avatar, stats |

The Aurora tab uses a distinctive **visual “core”** (animated blob-style branding) in the tab bar.

### Other important screens (non-exhaustive)

- **Auth**: register, login, forgot/reset password, email verification, optional phone verification flow.  
- **Posts**: create post, post detail, edit post; support for **images** and **video** metadata as modeled on the backend.  
- **Users**: profiles, followers/following lists, search users.  
- **Groups**: group detail, members, group settings.  
- **Chat**: per-user **conversation** thread (`conversation/[userId]`), WebSocket-backed freshness for unread counts.  
- **AI**: `text-chat` (streaming UI), `voice` (voice session with consent), `ai-select` style flows, AI data info screens.  
- **Journal**: multiple journal flows — create/browse entries, insights, settings, entry detail.  
- **Wellness / profile data**: `health-info` for structured **healthInfo** (mental/physical conditions, medications, therapies, lifestyle).  
- **Calendar**: personal events (API under `/api/calendar`).  
- **Ideas**: in-app **feature / feedback board** with categories and voting.  
- **Settings & account**: theme, fonts, sounds, icon selector, subscription, help, privacy/terms, account settings, blocked users (surfaced in chat flows).  
- **Onboarding**: first-run overlay and steps (store-driven), coordinated with tab bar visibility.  
- **Pixel / Habbo-style avatar**: customizable **pixel character** and related previews; optional **pixel room / lounge** routes exist for richer avatar presentation.

---

## Core Functionalities

### 1. Community feed & posts

- Users publish **posts** with **content**, optional **title**, **tags**, and a **post type**: `post`, `question`, or `story`.  
- **Likes** and **comments** are supported; comment counts are maintained on the post model.  
- Posts may be scoped to a **group** via `groupId` or appear on the global feed depending on product rules in controllers and the client.  
- **Reporting** fields exist on posts (and other entities) for moderation workflows.  
- **Saved posts** can be associated with the user model for later reading.

### 2. Groups (“Connect”)

- **Groups** have name, description, tags, **public/private** flag, **admins** and **members**, optional **cover** styling, **country** targeting, and optional **health condition** focus labels.  
- Members can browse and join communities aligned with topics (depression, anxiety, ADHD, etc., as seeded in dev data).

### 3. Direct messaging

- **Messages** between users, conversation listing, unread counts.  
- **WebSocket** integration on the client (e.g. tab layout) refreshes unread badges when messages arrive.

### 4. Notifications

- REST endpoints under `/api/notifications` for in-app notification feeds.  
- **Push tokens** are stored per user (platform, device); **Expo notifications** on the client.  
- **WebSocket** endpoint `/ws/notifications` for live notification channel (server-side handler).  
- Backend may schedule **inactivity**-style reminders (see `startInactivityCron` and related user timestamp fields).

### 5. User identity, profile & safety

- **Accounts**: email/username/password (password rules enforced in schema), optional **Facebook**-linked sign-in path on the API, email verification tokens, password reset tokens.  
- **Profiles**: display name, bio, optional photo **avatar**, emoji-style **avatar character** with background color, **name color**, rich **pixelCharacter** JSON for the Habbo-style figure.  
- **Social graph**: `following` arrays, dedicated flows for followers/following.  
- **Blocking**: `blockedUsers` — used to filter chat and social surfaces (e.g. hide blocked users from chat lists).  
- **Therapist flag**: `isTherapist` can mark accounts (used in demo seeds and UI affordances).  
- **Protected accounts** (e.g. review accounts) can be marked so they are not wiped by certain seed scripts.

### 6. Aurora AI (text & voice)

**Text (`/api/ai/chat`, `/api/ai/chat/complete`)**  
- Authenticated users send chat payloads; the server builds a **therapeutic system prompt** (strict style rules: reflect → name → explore, banned clichés, no roleplay asterisks, etc.).  
- **Context assembly** can include formatted **health info**, **journal** snippets, **calendar** items, and **retrieved memories** (embedding-based memory service) so replies stay relevant without “announcing” private data in a meta way.  
- **Risk detection** pipeline can classify elevated risk and attach **crisis resources** messaging when appropriate.  
- **Content moderation** step can screen user input before model calls.  
- Responses may be **streamed** to the client for low perceived latency.

**Voice (`voice` screen + `useVoiceTherapy`)**  
- Voice capture and playback path with UI states (listening, processing, speaking).  
- **AI consent** gate: users must explicitly grant AI data use consent (see `consentStore` / `AiConsentCard`) before voice features operate fully.

**Important**  
- Aurora is positioned as **supportive conversation**, not a licensed clinician. Crisis copy and resources are part of the safety design.

### 7. Journals & insights

- Data model supports **multiple journals** per user (`Journal` + `JournalEntry`).  
- Entries include **text**, optional **audio** URL + **transcription**, **media** attachments, **mood** scale, **symptoms**, **tags**, optional **prompt**, **privacy** flag, and optional **AI insights** (sentiment, themes, therapeutic feedback, follow-up questions, timestamps).  
- The app exposes flows for writing, browsing, and viewing **insights** aggregated from entries (service layer `journalService`).

### 8. Personal calendar

- CRUD and **upcoming** endpoints under `/api/calendar` for user-owned events.  
- Selected events can be folded into **AI context** so Aurora can gently acknowledge upcoming stressors or routines when generating replies.

### 9. Ideas board

- Users submit **ideas** with category (`feature`, `improvement`, `bug-fix`, `design`, `other`) and status (`open`, `in-progress`, etc.).  
- **Upvotes / downvotes** are user lists on each idea (with MongoDB index constraints handled carefully in maintenance code).

### 10. Therapists presence (lightweight)

- Public-style endpoint such as **`/api/therapists/online-count`** for showing approximate **online therapist** counts (implementation in `therapistController`) — used for trust/transparency style UI rather than full telehealth booking in this repo slice.

### 11. Subscriptions & premium

- **RevenueCat** (`react-native-purchases`) with a defined **premium entitlement**.  
- Hooks such as `useRequirePremium` / `usePremium` gate journal or Aurora-adjacent features per product rules.  
- **Subscription** screen includes paywall UI, packages, and analytics hooks (e.g. Facebook / TikTok attribution helpers where configured).

### 12. Themes, accessibility & polish

- **Dark/light** theming via a theme hook and centralized tokens (`SPACING`, `TYPOGRAPHY`, etc.).  
- **Font settings** for readability.  
- **Sounds** screen for optional audio feedback.  
- **Localization**: `useTranslation` reads **language** from settings and resolves keys through the locale module.

### 13. Legal & trust

- **Privacy policy** and **terms of service** routes.  
- **Help & support** and **AI data info** screens to explain how AI and data interact.

### 14. Developer / operations extras

- **Health check**: `GET /health`.  
- **Database seeding** script (`npm run seed`) and **`ensureDemoPosts`** routine that **adds** realistic demo posts/comments on server start **without deleting** production user data (titles are idempotent keys).  
- **`POST /api/seed`** exists in **non-production** environments for full reset-style seeding (dangerous; disabled when `NODE_ENV=production`).  
- **Upload API** with rate limits; files may be served from **GridFS** or local `uploads` fallback depending on environment.

---

## Backend API Surface (summary)

All under `/api` unless noted:

| Area | Prefix | Notes |
|------|--------|--------|
| Auth | `/api/auth` | Stricter rate limit |
| Posts | `/api/posts` | CRUD, feed logic, likes |
| Comments | `/api/comments` | Threaded on posts |
| Groups | `/api/groups` | Membership, discovery |
| Messages | `/api/messages` | DM threads |
| Users | `/api/users` | Profiles, follow, block, health info updates |
| Notifications | `/api/notifications` | Feed + read state |
| Journal | `/api/journal`, `/api/journals` | Legacy vs multi-journal split |
| Ideas | `/api/ideas` | Voting board |
| AI | `/api/ai` | Protected chat |
| Therapists | `/api/therapists` | Lightweight counts |
| Calendar | `/api/calendar` | Protected CRUD |
| Upload | `/api/upload` | Stricter rate limit |
| Seed | `/api/seed` | **Disabled in production** |

WebSockets: `/ws/chat`, `/ws/notifications`.

---

## Repository Layout (conceptual)

```
Aurora/
├── frontend/          # Expo React Native app (Expo Router)
├── backend/           # Express API, models, jobs, AI services
└── AURORA.md          # This document
```

---

## Versioning & delivery

- **Mobile**: `frontend/package.json` **version** and **EAS Update** channels (`production`, `preview`) for OTA-style JS updates on top of native builds.  
- **Backend**: compiled with **TypeScript**; `npm start` runs `dist/server.js` in production-style flows.

---

## Summary

**Aurora** is a **community-first mental wellness application** with a **strong AI companion layer**, **journaling and insights**, **groups and DMs**, and **subscription-gated premium** experiences—backed by a **MongoDB + Express** API, **real-time WebSockets**, and **multi-provider LLM** integration with **safety and moderation** hooks. Use this document as a map to the codebase and as a concise product specification for new contributors.
