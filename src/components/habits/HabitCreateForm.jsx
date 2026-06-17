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
import Button from "@/components/ui/button";
import FormError from "@/components/ui/FormError";
import FormLabel from "@/components/ui/FormLabel";
import Input from "@/components/ui/Input";

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
        <FormLabel>What&apos;s the habit?</FormLabel>
        <Input
          type="text"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="e.g. Morning run, Read 20 pages..."
        />
        <FormError message={error} />
      </div>

      {/* Category */}
      <div>
        <FormLabel className="mb-3">Category</FormLabel>
        <div className="grid grid-cols-3 gap-2">
          {Object.values(HABIT_CATEGORIES).map((cat) => (
            <button
              key={cat.id}
              onClick={() => update("category", cat.id)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm capitalize transition-all text-bento-muted bg-bento-card border-bento-border"
              style={{
                ...(form.category === cat.id
                  ? { background: cat.color + "22", borderColor: cat.color, color: cat.color }
                  : {}),
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
        <FormLabel className="mb-3">How often?</FormLabel>
        <div className="flex gap-3">
          {FREQUENCIES.map((f) => (
            <button
              key={f}
              onClick={() => update("frequency", f)}
              className={`flex-1 py-3 rounded-xl text-sm font-medium capitalize border transition-all ${
                form.frequency === f
                  ? "bg-stryde-primary-light border-stryde-primary text-stryde-primary-dark"
                  : "bg-transparent border-bento-border text-bento-muted"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Reminder time */}
      <div>
        <FormLabel className="mb-1">Reminder time</FormLabel>
        <p className="text-xs mb-2 text-bento-muted">
          We&apos;ll nudge you if you haven&apos;t checked in yet.
        </p>
        <Input
          type="time"
          value={form.reminderTime}
          onChange={(e) => update("reminderTime", e.target.value)}
          className="w-auto"
        />
      </div>

      {/* Save */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-4 rounded-xl text-sm"
      >
        {saving ? "Saving..." : "Save habit"}
      </Button>

    </div>
  );
}
