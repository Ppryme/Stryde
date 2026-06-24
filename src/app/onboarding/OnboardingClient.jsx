"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import FormError from "@/components/ui/FormError";
import Input from "@/components/ui/Input";
import { getSupabase } from "@/lib/supabase";
import { HABIT_CATEGORIES } from "@/lib/design-token";
import strydeImage from "@/assets/images/stryde-logo .png";

const STEPS = ["welcome", "goal", "habit"];

export default function OnboardingClient() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [habitName, setHabitName] = useState("");
  const [frequency, setFrequency] = useState("daily");

  async function handleFinish() {
    const supabase = getSupabase();
    if (!habitName.trim()) {
      setError("Give your habit a name.");
      return;
    }

    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("No authenticated user found.");
      setLoading(false);
      return;
    }

    await supabase.from("habits").insert({
      user_id: user.id,
      name: habitName,
      frequency,
      category: selectedCategory || "other",
      color_tag:
        HABIT_CATEGORIES[selectedCategory?.toUpperCase()]?.color ?? "#888780",
      order_index: 0,
    });

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        onboarded: true,
        name: user.user_metadata?.name ?? user.user_metadata?.full_name,
      },
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
    <div className="min-h-dvh flex flex-col px-5 py-6 sm:px-8 sm:py-10 lg:max-w-5xl mx-auto">
      <div className="flex gap-2 justify-center mb-8 sm:mb-10">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i <= step ? "bg-stryde-primary" : "bg-bento-border"
            } ${i === step ? "w-6" : "w-2"}`}
          />
        ))}
      </div>

      {step === 0 && (
        <section className="flex flex-1 flex-col items-center text-center">
          <div className="w-full max-w-2xl mx-auto">
            <p className="text-sm sm:text-base font-semibold text-bento-muted">
              Welcome to Stryde
            </p>
            <h1 className="mt-3 text-4xl sm:text-5xl lg:text-6xl font-black leading-tight text-bento-text">
              Build streaks. Not excuses
            </h1>
          </div>

          <div className="flex flex-1 items-center justify-center w-full py-8 sm:py-10">
            <Image
              src={strydeImage}
              alt="Stryde"
              priority
              className="w-full max-w-[280px] sm:max-w-[380px] lg:max-w-[460px] h-auto object-contain"
            />
          </div>

          <Button
            onClick={() => setStep(1)}
            className="w-full max-w-md py-4 text-sm sm:text-base mt-auto"
          >
            &gt;&gt; Get started
          </Button>
        </section>
      )}

      {step === 1 && (
        <div className="flex flex-1 flex-col gap-6 w-full max-w-2xl mx-auto">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-bento-text">
              What do you want to work on?
            </h1>
            <p className="text-sm mt-1 text-bento-muted">
              Pick one area to start. You can always add more.
            </p>
          </div>

          <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-3">
            {Object.values(HABIT_CATEGORIES).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className="flex flex-col items-start gap-2 p-4 rounded-xl border transition-all bg-bento-card border-bento-border text-bento-text"
                style={{
                  ...(selectedCategory === cat.id
                    ? { background: cat.color + "22", borderColor: cat.color }
                    : {}),
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

          <FormError message={error} className="mt-0" />

          <Button
            onClick={() => {
              if (!selectedCategory) {
                setError("Select a category");
                return;
              }

              setError("");
              setStep(2);
            }}
            className="w-full py-4 text-sm mt-auto"
          >
            Continue &rarr;
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-1 flex-col gap-6 w-full max-w-2xl mx-auto">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-bento-text">
              Name your first habit.
            </h1>
            <p className="text-sm mt-1 text-bento-muted">
              Start small. The habit you&apos;ll actually do beats the perfect
              one you won&apos;t.
            </p>
          </div>

          <Input
            type="text"
            placeholder="e.g. Morning run, Read 20 pages..."
            value={habitName}
            onChange={(e) => setHabitName(e.target.value)}
          />

          <div className="flex gap-3">
            {["daily", "weekly"].map((f) => (
              <button
                key={f}
                onClick={() => setFrequency(f)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium capitalize border transition-all ${
                  frequency === f
                    ? "bg-stryde-primary-light border-stryde-primary text-stryde-primary-dark"
                    : "bg-transparent border-bento-border text-bento-muted"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <FormError message={error} className="mt-0" />

          <Button
            onClick={handleFinish}
            disabled={loading}
            className="w-full py-4 text-sm mt-auto"
          >
            {loading ? "Saving..." : <>Start tracking &rarr;</>}
          </Button>
        </div>
      )}
    </div>
  );
}
