// src/components/goals/GoalCreateForm.jsx
// ─────────────────────────────────────────────
// GOAL CREATE FORM — client component
// Saves directly to Supabase (goals don't need offline support
// the way daily check-ins do — they're created rarely)
// ─────────────────────────────────────────────
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

export default function GoalCreateForm({ userId }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title:       "",
    description: "",
    targetDate:  "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  }

  async function handleSave() {
    if (!form.title.trim()) { setError("Give your goal a title."); return; }
    setSaving(true);

    const supabase = getSupabase();
    const { error: insertError } = await supabase.from("goals").insert({
      user_id:     userId,
      title:       form.title.trim(),
      description: form.description.trim() || null,
      target_date: form.targetDate || null,
      progress_pct: 0,
      status:      "active",
    });

    setSaving(false);

    if (insertError) {
      setError("Something went wrong. Try again.");
      return;
    }

    router.push("/goals");
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Title */}
      <div>
        <label
          className="block text-xs font-semibold mb-2 uppercase tracking-wider"
          style={{ color: "var(--color-bento-muted)" }}
        >
          Goal title
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="e.g. Learn Spanish, Run a 10K..."
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={{
            background: "var(--color-bento-card)",
            border:     "1px solid var(--color-bento-border)",
            color:      "var(--color-bento-text)",
          }}
        />
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>

      {/* Description */}
      <div>
        <label
          className="block text-xs font-semibold mb-2 uppercase tracking-wider"
          style={{ color: "var(--color-bento-muted)" }}
        >
          Description <span className="opacity-60">(optional)</span>
        </label>
        <textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="What does success look like?"
          rows={3}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
          style={{
            background: "var(--color-bento-card)",
            border:     "1px solid var(--color-bento-border)",
            color:      "var(--color-bento-text)",
          }}
        />
      </div>

      {/* Target date */}
      <div>
        <label
          className="block text-xs font-semibold mb-2 uppercase tracking-wider"
          style={{ color: "var(--color-bento-muted)" }}
        >
          Target date <span className="opacity-60">(optional)</span>
        </label>
        <input
          type="date"
          value={form.targetDate}
          onChange={(e) => update("targetDate", e.target.value)}
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
        {saving ? "Saving..." : "Save goal"}
      </button>

    </div>
  );
}