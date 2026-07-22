// src/lib/db.js
// ─────────────────────────────────────────────
// DEXIE — offline IndexedDB database
// This is the LOCAL database inside the browser
// All writes go here FIRST, then sync to Supabase
// ─────────────────────────────────────────────
import Dexie from "dexie";

export const db = new Dexie("StrydeDB");

db.version(1).stores({
  habits:   "++id, userId, frequency, archived",
  goals:    "++id, userId, status",
  checkIns: "++id, [userId+date], habitId, date, synced",
  streaks:  "++id, &habitId",          // & means habitId is unique
  queue:    "++id, type, createdAt",   // pending sync operations
});

db.version(2).stores({
  habits:   "++id, userId, frequency, archived",
  goals:    "++id, userId, status",
  checkIns: "++id, [userId+date], habitId, date, synced",
  streaks:  "++id, &habitId",
  queue:    "++id, type, createdAt",
}).upgrade(trans => {
  // Clear tables to force re-sync with UUIDs from Supabase
  return Promise.all([
    trans.habits.clear(),
    trans.goals.clear(),
    trans.checkIns.clear(),
    trans.streaks.clear(),
    trans.queue.clear(),
  ]);
});

export default db;
