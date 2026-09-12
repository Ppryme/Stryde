// src/lib/db.js
// ─────────────────────────────────────────────
// DEXIE — offline IndexedDB database
// This is the LOCAL database inside the browser
// All writes go here FIRST, then sync to Supabase
// ─────────────────────────────────────────────
import Dexie from "dexie";

export const db = new Dexie("StrydeDB");

db.version(4).stores({
  habits:      "++id, userId, frequency, archived, synced",
  goals:       "++id, userId, status, synced",
  checkIns:    "++id, [userId+date], [habitId+userId+date], habitId, date, synced",
  streaks:     "++id, &habitId",
  userStreaks: "++id, &userId",
  queue:       "++id, type, createdAt",
});

export default db;
