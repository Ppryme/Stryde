# STRYDE Architecture

Version: 1.0

Stryde is an Offline-First Habit & Goal Tracker.

Core Stack

- Next.js App Router
- React 19.2.4
- Supabase
- Dexie.js
- Zustand
- Tailwind CSS
- next.js 19.2.4
- Capacitor (future)

Principles
- UI components must never communicate directly with Supabase, Dexie, or the Offline Queue. All data mutations must go through a Repository, and all UI interactions must go through a Custom Hook.
1. Offline First
2. Optimistic UI
3. Repository Pattern
4. Single Source of Truth
5. Clean Architecture
6. Components never directly access Supabase.

---------------------------------------------------

Layers

UI

↓

Hooks

↓

Repository

↓

Local Database (Dexie)

↓

Offline Queue

↓

Supabase

---------------------------------------------------

Responsibilities

UI

Responsible for:

- rendering
- animations
- loading states

Never:

- write SQL
- call Supabase directly
- decide online/offline logic

---------------------------------------------------

Hooks

Example:

useCheckIn()

Responsible for

- optimistic updates
- loading state
- calling repository

---------------------------------------------------

Repository

Repository is responsible for

- writing to Dexie
- queueing operations
- syncing online

Only repositories may communicate with Supabase.

---------------------------------------------------

Supabase

Cloud persistence only.

Never accessed directly from components.

---------------------------------------------------

Offline Queue

Stores mutations while offline.

Replay when online.

---------------------------------------------------

Analytics

Reads from IndexedDB.

Never directly from Supabase.

Supabase syncs into IndexedDB.

---------------------------------------------------

Global Loading

Allowed only for

- Authentication
- App startup

Never

- check-in
- habit edit
- sync

---------------------------------------------------

Component Rules

Components should never exceed one responsibility.

Bad:

HabitCard

↓

Dexie

↓

Supabase

↓

Queue

↓

Toast

↓

Animation

Good:

HabitCard

↓

useCheckIn()

---------------------------------------------------

Folder Rules

components

Pure UI

hooks

Business logic

repositories

Data access

lib

Utilities

stores

Global state

db

IndexedDB

sync

Background sync