# STRYDE Architecture

**Version:** 1.0

Stryde is an **Offline-First Habit & Goal Tracker Application** built to feel fast and reliable even when the user has little or no internet connection.

The architecture is designed around a simple idea:

> **The UI should focus on the user, while the data layer focuses on the data.**

The UI should not need to know whether data is coming from Supabase, IndexedDB, or an offline queue. It should simply ask the application to perform an action and let the underlying layers handle the rest.

---

## Core Stack

* Next.js App Router
* React 19.2.4
* Supabase
* Dexie.js
* Zustand
* Tailwind CSS
* Capacitor *(future)*

---

# Architectural Principles

Stryde follows a few important principles that should guide development as the application grows.

### 1. Offline First

The application should work primarily from local data.

The user should be able to view their habits, goals, progress, and other important information even when they are offline.

Internet connectivity should enhance the application, not determine whether it works.

---

### 2. Optimistic UI

The interface should respond immediately to user actions.

For example, when a user checks off a habit, the checkmark should appear immediately instead of making the user wait for Supabase to respond.

The application can synchronize the change in the background.

---

### 3. Repository Pattern

Repositories provide a controlled way for the application to interact with data.

Components should not need to know how data is stored or synchronized.

Instead:

```text
Component
    ↓
Custom Hook
    ↓
Repository
    ↓
Data Layer
```

This keeps the UI independent from Supabase, Dexie, and the synchronization system.

---

### 4. Single Source of Truth

The application should avoid having different parts of the app maintaining their own conflicting versions of the same data.

For normal application usage, **IndexedDB acts as the primary local source of truth**.

Supabase acts as the cloud persistence and synchronization layer.

---

### 5. Clean Separation of Responsibilities

Each part of Stryde should have a clear job.

A component should render the interface.

A hook should handle UI-facing application interactions.

A repository should handle data operations.

The database should store data.

The sync system should handle synchronization.

Keeping these responsibilities separate makes the application easier to understand, test, and change.

---

### 6. Components Never Access Supabase Directly

Components should never contain Supabase calls.

If a component needs to create, update, or delete data, it should use a custom hook.

The hook communicates with the appropriate repository, and the repository handles the data operation.

---

# Application Layers

Stryde follows this general flow:

```text
UI
 ↓
Custom Hooks
 ↓
Repositories
 ↓
Local Database (Dexie / IndexedDB)
 ↓
Offline Queue
 ↓
Supabase
```

The important thing to remember is that **the UI does not skip layers**.

For example:

```text
HabitCard
    ↓
useCheckIn()
    ↓
checkInRepository
    ↓
Dexie
    ↓
Offline Queue
    ↓
Supabase
```

The exact path may vary depending on whether the user is online or offline, but the UI should not need to care about those details.

---

# Responsibilities

## UI

The UI is responsible for presenting the application to the user.

### The UI handles:

* Rendering
* User interactions
* Animations
* Visual feedback
* Loading states
* Empty states
* Error presentation

### The UI should never:

* Write SQL
* Call Supabase directly
* Access Dexie directly
* Manipulate the offline queue
* Decide whether the application is online or offline
* Implement data synchronization logic

For example, a `HabitCard` should not know how a check-in is saved.

It should simply ask the application to perform the check-in.

---

# Hooks

Hooks provide the interface between the UI and the application's underlying logic.

For example:

```text
HabitCard
    ↓
useCheckIn()
    ↓
checkInRepository
```

A hook such as `useCheckIn()` may be responsible for:

* Handling user-triggered actions
* Performing optimistic updates
* Managing loading state
* Managing errors
* Calling the appropriate repository
* Coordinating updates to application state

The component should be able to use something simple like:

```js
const { checkIn } = useCheckIn();

checkIn(habitId);
```

without knowing whether the operation is being performed locally, queued for synchronization, or sent to Supabase.

---

# Repositories

Repositories are responsible for **data access and persistence**.

They act as the bridge between the application and the underlying data systems.

Repositories may:

* Read data from Dexie
* Write data to Dexie
* Create mutations
* Add mutations to the offline queue
* Process synchronization
* Communicate with Supabase
* Handle the difference between local and remote persistence

### Important rule

> **Only repositories may communicate directly with Supabase.**

Components, hooks, and other UI code should never import Supabase just to perform a database operation.

For example:

```text
❌ Component → Supabase

❌ Hook → Supabase

✅ Hook → Repository → Supabase
```

This keeps Supabase-specific implementation details contained within the data layer.

---

# Local Database

Stryde uses **Dexie.js** to interact with IndexedDB.

IndexedDB is the application's local storage layer.

It allows Stryde to continue functioning when the user is offline.

Local data may include:

* Habits
* Goals
* Check-ins
* Streaks
* User preferences
* Other data required for offline functionality

The UI should never access Dexie directly.

Instead:

```text
UI
 ↓
Hook
 ↓
Repository
 ↓
Dexie
```

---

# Offline Queue

The Offline Queue keeps track of mutations that need to be synchronized with Supabase.

For example, imagine the user checks in a habit while offline:

```text
User checks in
      ↓
Optimistic UI update
      ↓
Save locally in Dexie
      ↓
Add mutation to Offline Queue
      ↓
Internet becomes available
      ↓
Queue replays mutation
      ↓
Supabase
```

The user should not need to wait for the internet before interacting with the application.

The queue handles the work in the background.

---

# Supabase

Supabase is Stryde's **cloud persistence layer**.

It provides the remote database and other backend services required by the application.

Supabase should not be treated as the database that the UI constantly communicates with.

Instead, it acts as the cloud counterpart to the local data.

```text
Local Data
    ↕
Synchronization
    ↕
Supabase
```

Only the repository/synchronization layer should communicate directly with Supabase.

---

# Analytics

Analytics should primarily read from the local IndexedDB data rather than repeatedly querying Supabase.

For example:

```text
IndexedDB
    ↓
Analytics
    ↓
Charts / Statistics / Progress
```

This makes analytics available offline and avoids unnecessary network requests.

Supabase synchronization keeps the local data up to date when connectivity is available.

---

# Global Loading

Stryde should avoid blocking the entire application for small operations.

Global loading indicators are appropriate for major application-level events such as:

* Authentication
* Initial application startup
* Initial data hydration when necessary

Global loading should generally **not** be used for:

* Habit check-ins
* Habit edits
* Goal updates
* Background synchronization
* Small local operations

For example, checking in a habit should feel instant.

The user should not see the entire application freeze behind a global spinner just because a check-in is being synchronized.

---

# Component Rules

Components should have **one clear responsibility**.

A component should focus primarily on presenting UI and responding to user interaction.

### Avoid:

```text
HabitCard
   ↓
Dexie
   ↓
Supabase
   ↓
Offline Queue
   ↓
Toast
   ↓
Animation
```

This makes the component difficult to understand and maintain.

### Prefer:

```text
HabitCard
   ↓
useCheckIn()
```

The hook and underlying layers handle the rest.

The `HabitCard` only needs to know:

> "The user wants to check in this habit."

It does not need to know **how that check-in gets persisted or synchronized**.

---

# Folder Structure

The folder structure should reflect the responsibilities of each part of the application.

```text
src/
│
├── components/
│   └── Pure UI components
│
├── hooks/
│   └── UI-facing application logic
│
├── repositories/
│   └── Data access and persistence
│
├── lib/
│   └── Shared utilities and helpers
│
├── stores/
│   └── Global application state
│
├── db/
│   └── Dexie / IndexedDB configuration
│
└── sync/
    └── Background synchronization and queue processing
```

---

# The Simple Rule

When building a new feature, ask:

> **"Which layer should be responsible for this?"**

For example, for a habit check-in:

```text
User
 ↓
HabitCard
 ↓
useCheckIn()
 ↓
checkInRepository
 ↓
Dexie
 ↓
Offline Queue
 ↓
Supabase
```

Each layer has one job.

The component displays the interaction.

The hook coordinates the application behavior.

The repository handles the data operation.

Dexie stores the local data.

The Offline Queue remembers changes that still need to be synchronized.

Supabase stores the cloud version.

This separation allows Stryde to remain **fast, offline-capable, maintainable, and easier to scale as the application grows.**
