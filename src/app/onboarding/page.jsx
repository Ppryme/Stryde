// src/app/onboarding/page.jsx
// ─────────────────────────────────────────────
// ONBOARDING — 3-step flow for new users
// Step 1: Welcome + sign up / sign in
// Step 2: Pick a goal category
// Step 3: Create first habit
// CLIENT component — has interactive steps
// ─────────────────────────────────────────────
"use client";
import { useState,useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { HABIT_CATEGORIES } from "@/lib/design-token";

const STEPS = ["account", "goal", "habit"];

export default function OnboardingPage() {
  const router  = useRouter();
  const [step, setStep]     = useState(1); // 0=account, 1=goal, 2=habit
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkUser() {
      const supabase = await getSupabase();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/sign-in");
      return;
    }

    if (user.user_metadata?.onboarded) {
      router.push("/");
    }
  }

  checkUser();
}, []);

  // Step 2 state
  const [selectedCategory, setSelectedCategory] = useState("");

  // Step 3 state
  const [habitName, setHabitName]   = useState("");
  const [frequency, setFrequency]   = useState("daily");

  



  // ── Step 3: Save first habit + redirect ──────
  async function handleFinish() {
    const supabase = getSupabase();
    if (!habitName.trim()) { setError("Give your habit a name."); return; }
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    console.log("FINISH USER:", user);
    console.log("FINISH USER ERROR:", userError);


    if (!user) {
      setError("No authenticated user found.");
      setLoading(false);
      return;
    }

    await supabase.from("habits").insert({
      user_id:      user.id,
      name:         habitName,
      frequency,
      category:     selectedCategory || "other",
      color_tag:    HABIT_CATEGORIES[selectedCategory?.toUpperCase()]?.color ?? "#888780",
      order_index:  0,
    });

    // Mark user as onboarded
   const { error: updateError } =
      await supabase.auth.updateUser({
        data: { onboarded: true },
      });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push("/");
  }

  return (
    <div className="min-h-screen flex flex-col lg:max-w-6xl px-6 pt-16 pb-10 mx-auto">

      {/* Step indicator dots */}
      <div className="flex gap-2 justify-center mb-12">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width:      i === step ? 24 : 8,
              background: i <= step ? "var(--color--stryde-primary)" : "var(--color-bento-border)",
            }}
          />
        ))}
      </div>

     

      {/* ── STEP 1: Goal category picker ─────── */}
      {step === 1 && (
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--color-bento-text)" }}>
              What do you want to work on?
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--color-bento-muted)" }}>
              Pick one area to start. You can always add more.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {Object.values(HABIT_CATEGORIES).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className="flex flex-col items-start gap-2 p-4 rounded-2xl border transition-all"
                style={{
                  background:   selectedCategory === cat.id ? cat.color + "22" : "var(--color-bento-card)",
                  border:       `1px solid ${selectedCategory === cat.id ? cat.color : "var(--color-bento-border)"}`,
                  color:        "var(--color-bento-text)",
                }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: cat.color }}
                />
                <span className="text-sm font-medium">{cat.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              if (!selectedCategory) {
                setError("Select a category");
                return;
              }

              setError("");
              setStep(2);
            }}
            className="w-full py-4 rounded-xl text-sm font-semibold mt-auto"
            style={{ background: "var(--color--stryde-primary)", color: "#fff" }}
          >
            Continue →
          </button>
        </div>
      )}

      {/* ── STEP 2: First habit ──────────────── */}
      {step === 2 && (
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--color-bento-text)" }}>
              Name your first habit.
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--color-bento-muted)" }}>
              Start small. The habit you&apos;ll actually do beats the perfect one you won&apos;t.
            </p>
          </div>

          <input
            type="text"
            placeholder="e.g. Morning run, Read 20 pages..."
            value={habitName}
            onChange={(e) => setHabitName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{
              background: "var(--color-bento-card)",
              border: "1px solid var(--color-bento-border)",
              color: "var(--color-bento-text)",
            }}
          />

          {/* Frequency picker */}
          <div className="flex gap-3">
            {["daily", "weekly"].map((f) => (
              <button
                key={f}
                onClick={() => setFrequency(f)}
                className="flex-1 py-3 rounded-xl text-sm font-medium capitalize border transition-all"
                style={{           
                  background: frequency === f ? "var(--color--stryde-primary-light)" : "transparent",
                  border:     `1px solid ${frequency === f ? "var(--color--stryde-primary)" : "var(--color-bento-border)"}`,
                  color:      frequency === f ? "var(--color--stryde-primary-dark)" : "var(--color-bento-muted)",
                }}
              >
                {f}
              </button>
            ))}
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            onClick={handleFinish}
            disabled={loading}
            className="w-full py-4 rounded-xl text-sm font-semibold mt-auto transition-opacity"
            style={{ background: "var(--color--stryde-primary)", color: "#fff", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Saving..." : "Start tracking →"}
          </button>
        </div>
      )}

    </div>
  );
}
