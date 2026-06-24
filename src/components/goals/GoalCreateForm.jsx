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
import Button from "@/components/ui/button";
import FormError from "@/components/ui/FormError";
import FormLabel from "@/components/ui/FormLabel";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";

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
        <FormLabel>Goal title</FormLabel>
        <Input
          type="text"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="e.g. Learn Spanish, Run a 10K..."
        />
        <FormError message={error} />
      </div>

      {/* Description */}
      <div>
        <FormLabel>
          Description <span className="">(optional)</span>
        </FormLabel>
        <Textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="What does success look like?"
          rows={3}
        />
      </div>

      {/* Target date */}
      <div>
        <FormLabel>
          Target date <span className="opacity-60">(optional)</span>
        </FormLabel>
        <Input
          type="date"
          value={form.targetDate}
          onChange={(e) => update("targetDate", e.target.value)}
          className="w-auto"
        />
      </div>

      {/* Save */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-4 rounded-xl text-sm"
      >
        {saving ? "Saving..." : "Save goal"}
      </Button>

    </div>
  );
}
