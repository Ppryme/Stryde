// src/components/habits/HabitCreateForm.jsx
// ─────────────────────────────────────────────
// HABIT CREATE FORM — client component
// Saves to IndexedDB first (offline-safe), then syncs to Supabase
// ─────────────────────────────────────────────
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useHabit } from "@/hooks/useHabit";
import { HABIT_CATEGORIES } from "@/lib/design-token";
import Button from "@/components/ui/button";
import FormError from "@/components/ui/FormError";
import FormLabel from "@/components/ui/FormLabel";
import Input from "@/components/ui/Input";
import { Plus, Trash2 } from "lucide-react";

const FREQUENCIES = ["daily", "weekly"];

export default function HabitCreateForm({ userId }) {
  const router = useRouter();
  const { createHabit, saving, error, setError } = useHabit();

  const [form, setForm] = useState({
    name: "",
    category: "health",
    frequency: "daily",
  });
  const [reminders, setReminders] = useState(["08:00"]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  }

  function addReminder() {
    if (reminders.length >= 4) {
      setError("You can set a maximum of 4 reminder times.");
      return;
    }
    setReminders([...reminders, "08:00"]);
    setError("");
  }

  function removeReminder(idx) {
    setReminders(reminders.filter((_, i) => i !== idx));
    setError("");
  }

  function updateReminder(idx, val) {
    setReminders(reminders.map((r, i) => (i === idx ? val : r)));
    setError("");
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError("Give your habit a name.");
      return;
    }

    const categoryObj = Object.values(HABIT_CATEGORIES).find((c) => c.id === form.category);
    const colorTag = categoryObj?.color ?? "#888780";
    const now = new Date().toISOString();
    const remindersStr = reminders.filter((r) => r.trim() !== "").join(",");

    const habitData = {
      id: crypto.randomUUID(),
      userId,
      name: form.name.trim(),
      category: form.category,
      frequency: form.frequency,
      reminderTime: remindersStr,
      colorTag,
      archived: false,
      createdAt: now,
    };

    const success = await createHabit(habitData);
    if (success) {
      if (!navigator.onLine) {
        // Optional: show a small non-blocking toast, assuming we have one.
        // For now, we just proceed to dashboard. The sync engine will queue it.
      }
      router.push("/dashboard");
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      {/* Habit name */}
      <div>
        <FormLabel>What&apos;s the habit?</FormLabel>
        <Input
          type="text"
          value={form.name}
          disabled={saving}
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
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm capitalize transition-all text-bento-muted bg-bento-card border-bento-border cursor-pointer"
              style={{
                ...(form.category === cat.id
                  ? { background: cat.color + "22", borderColor: cat.color, color: cat.color }
                  : {}),
              }}
            >
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: cat.color }} />
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
              disabled={saving}
              onClick={() => update("frequency", f)}
              className={`flex-1 py-3 rounded-xl text-sm font-medium capitalize border transition-all cursor-pointer ${
                form.frequency === f
                  ? "bg-stryde-primary-light border-stryde-primary text-stryde-primary-dark"
                  : "bg-transparent border-bento-border text-bento-muted"
              } ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Reminder Times Section (Grid layout matching Goal form) */}
      <div className="p-4 rounded-2xl bg-bento-card border border-bento-border">
        <div className="flex items-center justify-between mb-2">
          <div>
            <FormLabel className="mb-0">Reminder Times</FormLabel>
            <p className="text-[11px] text-bento-muted">
              Select up to 4 time slots to nudge you daily.
            </p>
          </div>
          {reminders.length < 4 && (
            <button
              type="button"
              disabled={saving}
              onClick={addReminder}
              className="p-1.5 rounded-lg bg-bento-bg border border-bento-border text-bento-muted hover:text-stryde-primary hover:border-stryde-primary transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Add reminder time"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3 sm:grid-cols-3">
          {reminders.map((time, idx) => (
            <div key={idx} className={`flex items-center gap-2 bg-bento-bg border border-bento-border rounded-xl px-2 py-1 ${saving ? "opacity-50" : ""}`}>
              <input
                type="time"
                value={time}
                disabled={saving}
                onChange={(e) => updateReminder(idx, e.target.value)}
                className="bg-transparent text-sm text-bento-text outline-none w-full p-2 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                disabled={saving}
                onClick={() => removeReminder(idx)}
                className="p-1 rounded-lg text-bento-muted hover:text-stryde-danger transition-all cursor-pointer disabled:cursor-not-allowed"
                aria-label="Remove reminder"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {reminders.length === 0 && (
            <p className="text-xs text-bento-muted col-span-full py-2">
              No reminders set.
            </p>
          )}
        </div>
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
