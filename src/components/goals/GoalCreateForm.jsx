"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import Button from "@/components/ui/button";
import FormError from "@/components/ui/FormError";
import FormLabel from "@/components/ui/FormLabel";
import Input from "@/components/ui/Input";
import useAppStore from "@/stores/useAppStore";
import { Plus, Trash2 } from "lucide-react";

export default function GoalCreateForm({ userId }) {
  const router = useRouter();
  const showLoading = useAppStore((state) => state.showLoading);
  const hideLoading = useAppStore((state) => state.hideLoading);

  const [title, setTitle] = useState("");
  const [tasks, setTasks] = useState([{ id: "init-0", name: "" }]);
  const [reminders, setReminders] = useState(["08:00"]);
  const [targetDate, setTargetDate] = useState("");
  const [error, setError] = useState("");

  function addTask() {
    setTasks([...tasks, { id: `task-${Date.now()}-${Math.random()}`, name: "" }]);
  }

  function removeTask(id) {
    if (tasks.length === 1) {
      setError("A goal must have at least one task.");
      return;
    }
    setTasks(tasks.filter((t) => t.id !== id));
    setError("");
  }

  function updateTaskName(id, val) {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, name: val } : t)));
    setError("");
  }

  function addReminder() {
    setReminders([...reminders, "08:00"]);
  }

  function removeReminder(idx) {
    setReminders(reminders.filter((_, i) => i !== idx));
  }

  function updateReminder(idx, val) {
    setReminders(reminders.map((r, i) => (i === idx ? val : r)));
  }

  async function handleSave() {
    if (!title.trim()) {
      setError("Give your goal a title.");
      return;
    }

    const validTasks = tasks.filter((t) => t.name.trim() !== "");
    if (validTasks.length === 0) {
      setError("Add at least one goal task.");
      return;
    }

    if (!targetDate) {
      setError("Target date is mandatory.");
      return;
    }

    // Verify target date is in the future
    const todayStr = new Date().toISOString().split("T")[0];
    if (targetDate <= todayStr) {
      setError("Target date must be in the future.");
      return;
    }

    showLoading("Saving goal...");
    setError("");

    // Package tasks with unique IDs
    const finalTasks = validTasks.map((t, idx) => ({
      id: t.id.startsWith("init") ? `task-${Date.now()}-${idx}` : t.id,
      name: t.name.trim(),
    }));

    // Serialize details into description JSON payload
    const goalPayload = JSON.stringify({
      tasks: finalTasks,
      reminders: reminders.filter((r) => r.trim() !== ""),
      completion_history: {},
      created_at_date: todayStr,
      finished_date: null,
    });

    const supabase = getSupabase();
    const { error: insertError } = await supabase.from("goals").insert({
      user_id: userId,
      title: title.trim(),
      description: goalPayload,
      target_date: targetDate,
      progress_pct: 0,
      status: "active",
    });

    setSavingStatus(false);
    hideLoading();

    if (insertError) {
      setError("Something went wrong saving the goal. Try again.");
      console.error(insertError);
      return;
    }

    router.push("/goals");
  }

  // Temporary function helper to prevent React errors
  function setSavingStatus(val) {}

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      {/* Title */}
      <div>
        <FormLabel>Goal title</FormLabel>
        <Input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setError("");
          }}
          placeholder="e.g. Learn Spanish, Run a 10K..."
        />
      </div>

      {/* Goal Tasks Section */}
      <div className="p-4 rounded-2xl bg-bento-card border border-bento-border">
        <div className="flex items-center justify-between mb-2">
          <div>
            <FormLabel className="mb-0">Goal Tasks</FormLabel>
            <p className="text-[11px] text-bento-muted">
              Each goal consists of one or more daily tasks.
            </p>
          </div>
          <button
            type="button"
            onClick={addTask}
            className="p-1.5 rounded-lg bg-bento-bg border border-bento-border text-bento-muted hover:text-stryde-primary hover:border-stryde-primary transition-all"
            aria-label="Add goal task"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-2 mt-3">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-2">
              <input
                type="text"
                value={task.name}
                onChange={(e) => updateTaskName(task.id, e.target.value)}
                placeholder="e.g. Wake up by 7AM, Study vocab..."
                className="flex-1 px-3 py-2 text-sm rounded-xl bg-bento-bg border border-bento-border text-bento-text placeholder:text-bento-muted outline-none focus:border-stryde-primary transition-all"
              />
              <button
                type="button"
                onClick={() => removeTask(task.id)}
                className="p-2.5 rounded-xl border border-transparent hover:border-bento-border text-bento-muted hover:text-stryde-danger hover:bg-bento-bg transition-all"
                aria-label="Remove task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Reminder Times Section */}
      <div className="p-4 rounded-2xl bg-bento-card border border-bento-border">
        <div className="flex items-center justify-between mb-2">
          <div>
            <FormLabel className="mb-0">Reminder Times</FormLabel>
            <p className="text-[11px] text-bento-muted">
              Select time slots to nudge you daily.
            </p>
          </div>
          <button
            type="button"
            onClick={addReminder}
            className="p-1.5 rounded-lg bg-bento-bg border border-bento-border text-bento-muted hover:text-stryde-primary hover:border-stryde-primary transition-all"
            aria-label="Add reminder time"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3 sm:grid-cols-3">
          {reminders.map((time, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-bento-bg border border-bento-border rounded-xl px-2 py-1">
              <input
                type="time"
                value={time}
                onChange={(e) => updateReminder(idx, e.target.value)}
                className="bg-transparent text-sm text-bento-text outline-none w-full"
              />
              <button
                type="button"
                onClick={() => removeReminder(idx)}
                className="p-1 rounded-lg text-bento-muted hover:text-stryde-danger transition-all"
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

      {/* Target Date Section */}
      <div className="p-4 rounded-2xl bg-bento-card border border-bento-border">
        <FormLabel>Target Date</FormLabel>
        <Input
          type="date"
          value={targetDate}
          onChange={(e) => {
            setTargetDate(e.target.value);
            setError("");
          }}
          className="w-full sm:w-auto"
        />
        <p className="text-xs text-bento-muted mt-2">
          Complete this goal before this date.
        </p>
      </div>

      {/* Error display */}
      <FormError message={error} />

      {/* Save Button */}
      <Button
        onClick={handleSave}
        className="w-full py-4 rounded-xl text-sm"
      >
        Save Goal
      </Button>
    </div>
  );
}
