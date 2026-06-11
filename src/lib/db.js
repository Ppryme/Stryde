// src/lib/db.js
// ─────────────────────────────────────────────
// DEXIE — offline IndexedDB database
// This is the LOCAL database inside the browser
// All writes go here FIRST, then sync to Supabase
// ─────────────────────────────────────────────
import Dexie from "dexie";

export const db = new Dexie("StrydeDB");

db.version(1).stores({
  // ++ means auto-increment primary key
  // indexed fields listed after id allow fast queries
  habits:   "++id, userId, frequency, archived",
  goals:    "++id, userId, status",
  checkIns: "++id, [userId+date], habitId, date, synced",
  streaks:  "++id, &habitId",          // & means habitId is unique
  queue:    "++id, type, createdAt",   // pending sync operations
});

export default db;
