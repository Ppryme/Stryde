"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Button from "@/components/ui/button";
import FormError from "@/components/ui/FormError";
import Input from "@/components/ui/Input";
import { getSupabase } from "@/lib/supabase";
import { HABIT_CATEGORIES } from "@/lib/design-token";
import useAppStore from "@/stores/useAppStore";
import { Plus, Trash2, ChevronRight, ChevronLeft } from "lucide-react";

// Import all mockup images
import dashboardMockup from "@/assets/images/dashboard-mockup.png";
import checkinMockup from "@/assets/images/checkin-page.png";
import goalsMockup from "@/assets/images/goals-mockup.png";
import analyticsMockup from "@/assets/images/analytics-mockup.png";

const SLIDES = [
  {
    title: "Track Your Progress",
    description: "Build habits every day and watch your consistency grow.",
    image: dashboardMockup,
  },
  {
    title: "Daily Check-ins",
    description: "One tap every day keeps your streak alive.",
    image: checkinMockup,
  },
  {
    title: "Goals",
    description: "Break big goals into small daily tasks.",
    image: goalsMockup,
  },
  {
    title: "Analytics",
    description: "Stay motivated with visual progress and streaks.",
    image: analyticsMockup,
  },
];

export default function OnboardingClient() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0-3: Slides, 4: Habit builder
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Initialize with 2 default habits to guide the user
  const [habitsList, setHabitsList] = useState([
    { id: "h-0", name: "Read 10 pages", category: "learning", frequency: "daily" },
    { id: "h-1", name: "Morning stretch", category: "fitness", frequency: "daily" },
  ]);

  const showLoading = useAppStore((state) => state.showLoading);
  const hideLoading = useAppStore((state) => state.hideLoading);

  function addHabitInput() {
    setError("");
    const newId = `h-${Date.now()}-${Math.random()}`;
    setHabitsList([
      ...habitsList,
      { id: newId, name: "", category: "learning", frequency: "daily" },
    ]);
  }

  function removeHabitInput(id) {
    if (habitsList.length <= 1) {
      setError("Please keep at least one habit to get started.");
      return;
    }
    setHabitsList(habitsList.filter((h) => h.id !== id));
    setError("");
  }

  function updateHabitField(id, field, value) {
    setHabitsList(
      habitsList.map((h) => (h.id === id ? { ...h, [field]: value } : h))
    );
    setError("");
  }

  async function handleFinish() {
    const validHabits = habitsList.filter((h) => h.name.trim() !== "");
    if (validHabits.length === 0) {
      setError("Please enter a name for at least one habit.");
      return;
    }

    setLoading(true);
    showLoading("Creating your habits and completing onboarding...");
    setError("");

    try {
      const supabase = getSupabase();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("No authenticated user found.");
        setLoading(false);
        hideLoading();
        return;
      }

      // Prepare multi-habit bulk insert payload
      const habitsToInsert = validHabits.map((h, idx) => ({
        user_id: user.id,
        name: h.name.trim(),
        frequency: h.frequency,
        category: h.category || "other",
        color_tag:
          HABIT_CATEGORIES[h.category?.toUpperCase()]?.color ?? "#888780",
        order_index: idx,
      }));

      const { error: insertError } = await supabase.from("habits").insert(habitsToInsert);
      if (insertError) {
        setError("Failed to create habits. Please try again.");
        console.error("Bulk insert error:", insertError);
        setLoading(false);
        hideLoading();
        return;
      }

      // Update user onboarded state in Auth metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          onboarded: true,
          name: user.user_metadata?.name ?? user.user_metadata?.full_name,
        },
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        hideLoading();
        return;
      }

      router.push("/");
    } catch (err) {
      console.error("Onboarding submission failed:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
      hideLoading();
    }
  }

  const currentSlide = SLIDES[step];

  return (
    <div className="min-h-dvh flex flex-col px-4 py-6 sm:px-6 sm:py-10 max-w-xl mx-auto justify-between bg-bento-bg">
      {/* Progress indicators & back arrow */}
      <div className="relative flex items-center justify-center mb-6 w-full min-h-[40px]">
        {step > 0 && (
          <button
            onClick={() => {
              setError("");
              setStep((prev) => prev - 1);
            }}
            className="absolute left-0 p-2 text-bento-muted hover:text-bento-text transition-colors rounded-xl hover:bg-bento-card border border-bento-border flex items-center justify-center"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i <= step ? "bg-stryde-primary" : "bg-bento-border"
              } ${i === step ? "w-6" : "w-2"}`}
            />
          ))}
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {step < 4 ? (
            <motion.div
              key={`slide-${step}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center text-center w-full"
            >
              <h2 className="text-2xl sm:text-3xl font-black text-bento-text tracking-tight mb-2">
                {currentSlide.title}
              </h2>
              <p className="text-sm sm:text-base text-bento-muted max-w-sm mb-6 leading-relaxed">
                {currentSlide.description}
              </p>

              {/* Phone Mockup Frame */}
              <div className="relative w-full flex items-center justify-center py-4 my-2">
                {/* Purple radial glow */}
                <div className="absolute w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] rounded-full bg-gradient-to-tr from-stryde-primary/30 to-transparent blur-3xl opacity-70 pointer-events-none" />

                {/* Styled device card */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
                  className="relative z-10 w-[210px] sm:w-[245px] aspect-[9/18.5] rounded-[36px] border-[6px] border-bento-border bg-bento-card shadow-[0_20px_50px_rgba(83,74,183,0.25),_0_15px_30px_rgba(0,0,0,0.8)] overflow-hidden flex items-center justify-center"
                >
                  <Image
                    src={currentSlide.image}
                    alt={currentSlide.title}
                    priority
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="habit-builder"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-5 w-full text-left"
            >
              <div>
                <h2 className="text-2xl font-bold text-bento-text">
                  Set up your routine.
                </h2>
                <p className="text-sm text-bento-muted mt-1 leading-relaxed">
                  Stryde works best when you start with 2-3 simple daily habits.
                </p>
              </div>

              {/* Habits list builder container */}
              <div className="flex flex-col gap-4 max-h-[50vh] overflow-y-auto pr-1 scrollbar-thin">
                {habitsList.map((habit, idx) => (
                  <div
                    key={habit.id}
                    className="p-4 rounded-2xl bg-bento-card border border-bento-border flex flex-col gap-3 relative transition-all"
                  >
                    {/* Header line with Trash */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-bento-muted">
                        Habit #{idx + 1}
                      </span>
                      {habitsList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeHabitInput(habit.id)}
                          className="p-1 rounded-lg text-bento-muted hover:text-stryde-danger hover:bg-bento-bg transition-colors"
                          aria-label="Delete habit"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Habit Name input */}
                    <Input
                      type="text"
                      placeholder="e.g. Read 15 pages, Drink water, Gym..."
                      value={habit.name}
                      onChange={(e) =>
                        updateHabitField(habit.id, "name", e.target.value)
                      }
                      className="py-2.5 px-3.5 text-sm"
                    />

                    {/* Horizontal Category Selector */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-semibold text-bento-muted uppercase tracking-wider">
                        Category
                      </span>
                      <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
                        {Object.values(HABIT_CATEGORIES).map((cat) => {
                          const isSelected = habit.category === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() =>
                                updateHabitField(habit.id, "category", cat.id)
                              }
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[11px] font-medium whitespace-nowrap transition-all"
                              style={{
                                borderColor: isSelected ? cat.color : "var(--color-bento-border)",
                                backgroundColor: isSelected ? `${cat.color}15` : "transparent",
                                color: isSelected ? "var(--color-bento-text)" : "var(--color-bento-muted)",
                              }}
                            >
                              <div
                                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                style={{ background: cat.color }}
                              />
                              {cat.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Frequency selector */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-bento-muted uppercase tracking-wider mr-2">
                        Frequency
                      </span>
                      <div className="flex rounded-lg bg-bento-bg border border-bento-border p-0.5">
                        {["daily", "weekly"].map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() =>
                              updateHabitField(habit.id, "frequency", f)
                            }
                            className={`px-3 py-1 rounded-md text-[11px] font-semibold capitalize transition-all ${
                              habit.frequency === f
                                ? "bg-stryde-primary text-white"
                                : "text-bento-muted hover:text-bento-text"
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add another habit button */}
              <button
                type="button"
                onClick={addHabitInput}
                className="flex items-center justify-center gap-2 py-3 border border-dashed border-bento-border rounded-2xl text-xs font-semibold text-bento-muted hover:text-stryde-primary hover:border-stryde-primary transition-all bg-transparent w-full"
              >
                <Plus className="w-4 h-4" />
                Add another habit
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Button Controls */}
      <div className="mt-8 flex flex-col gap-3 w-full">
        <FormError message={error} className="mt-0 text-center" />
        
        {step < 4 ? (
          <Button
            onClick={() => setStep((prev) => prev + 1)}
            className="w-full py-4 text-sm font-semibold flex items-center justify-center gap-1.5"
          >
            Continue
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleFinish}
            disabled={loading}
            className="w-full py-4 text-sm font-semibold"
          >
            {loading ? "Starting..." : "Start tracking \u2192"}
          </Button>
        )}
      </div>
    </div>
  );
}
