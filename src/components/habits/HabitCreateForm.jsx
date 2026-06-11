// src/components/habits/HabitCreateForm.jsx
// ─────────────────────────────────────────────
// HABIT CREATE FORM — client component
// Saves to IndexedDB first (offline-safe), then syncs to Supabase
// ─────────────────────────────────────────────
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";
import { getSupabase } from "@/lib/supabase";
import { HABIT_CATEGORIES } from "@/lib/design-token";

const FREQUENCIES = ["daily", "weekly"];

export default function HabitCreateForm({ userId }) {
  const router  = useRouter();
  const [form, setForm] = useState({
    name:         "",
    category:     "health",
    frequency:    "daily",
    reminderTime: "08:00",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  }

  async function handleSave() {
    if (!form.name.trim()) { setError("Give your habit a name."); return; }
    setSaving(true);

    const category = Object.values(HABIT_CATEGORIES).find((c) => c.id === form.category);
    const colorTag = category?.color ?? "#888780";
    const now      = new Date().toISOString();

    const habitData = {
      userId,
      name:         form.name.trim(),
      category:     form.category,
      frequency:    form.frequency,
      reminderTime: form.reminderTime,
      colorTag,
      archived:     false,
      createdAt:    now,
    };

    // 1. Save to IndexedDB immediately (works offline)
    await db.habits.add(habitData);

    // 2. Sync to Supabase if online
    if (navigator.onLine) {
      const supabase = getSupabase();
      await supabase.from("habits").insert({
        user_id:       userId,
        name:          habitData.name,
        category:      habitData.category,
        frequency:     habitData.frequency,
        reminder_time: habitData.reminderTime,
        color_tag:     habitData.colorTag,
      });
    } else {
      // Queue for later sync
      await db.queue.add({ type: "CREATE_HABIT", payload: habitData, createdAt: now });
    }

    setSaving(false);
    router.push("/habits");
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Habit name */}
      <div>
        <label
          className="block text-xs font-semibold mb-2 uppercase tracking-wider"
          style={{ color: "var(--color-bento-muted)" }}
        >
          What's the habit?
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="e.g. Morning run, Read 20 pages..."
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={{
            background: "var(--color-bento-card)",
            border:     "1px solid var(--color-bento-border)",
            color:      "var(--color-bento-text)",
          }}
        />
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>

      {/* Category */}
      <div>
        <label
          className="block text-xs font-semibold mb-3 uppercase tracking-wider"
          style={{ color: "var(--color-bento-muted)" }}
        >
          Category
        </label>
        <div className="grid grid-cols-3 gap-2">
          {Object.values(HABIT_CATEGORIES).map((cat) => (
            <button
              key={cat.id}
              onClick={() => update("category", cat.id)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm capitalize transition-all"
              style={{
                background: form.category === cat.id ? cat.color + "22" : "var(--color-bento-card)",
                border:     `1px solid ${form.category === cat.id ? cat.color : "var(--color-bento-border)"}`,
                color:      form.category === cat.id ? cat.color : "var(--color-bento-muted)",
              }}
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color }} />
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Frequency */}
      <div>
        <label
          className="block text-xs font-semibold mb-3 uppercase tracking-wider"
          style={{ color: "var(--color-bento-muted)" }}
        >
          How often?
        </label>
        <div className="flex gap-3">
          {FREQUENCIES.map((f) => (
            <button
              key={f}
              onClick={() => update("frequency", f)}
              className="flex-1 py-3 rounded-xl text-sm font-medium capitalize border transition-all"
              style={{
                background: form.frequency === f ? "var(--color--stryde-primary-light)" : "transparent",
                border:     `1px solid ${form.frequency === f ? "var(--color--stryde-primary)" : "var(--color-bento-border)"}`,
                color:      form.frequency === f ? "var(--color--stryde-primary-dark)" : "var(--color-bento-muted)",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Reminder time */}
      <div>
        <label
          className="block text-xs font-semibold mb-1 uppercase tracking-wider"
          style={{ color: "var(--color-bento-muted)" }}
        >
          Reminder time
        </label>
        <p className="text-xs mb-2" style={{ color: "var(--color-bento-muted)" }}>
          We'll nudge you if you haven't checked in yet.
        </p>
        <input
          type="time"
          value={form.reminderTime}
          onChange={(e) => update("reminderTime", e.target.value)}
          className="px-4 py-3 rounded-xl text-sm outline-none"
          style={{
            background: "var(--color-bento-card)",
            border:     "1px solid var(--color-bento-border)",
            color:      "var(--color-bento-text)",
          }}
        />
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-4 rounded-xl text-sm font-semibold transition-opacity"
        style={{
          background: "var(--color--stryde-primary)",
          color:      "#fff",
          opacity:    saving ? 0.7 : 1,
        }}
      >
        {saving ? "Saving..." : "Save habit"}
      </button>

    </div>
  );
}
