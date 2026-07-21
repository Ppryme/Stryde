"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Button from "@/components/ui/button";
import FormError from "@/components/ui/FormError";
import Input from "@/components/ui/Input";
import { getSupabase } from "@/lib/supabase";
import { GoalRepository } from "@/repositories/goalRepository";
import { HABIT_CATEGORIES } from "@/lib/design-token";
import useAppStore from "@/stores/useAppStore";
import { Plus, Trash2, ChevronRight, ChevronLeft } from "lucide-react";

// Import all mockup images
import dashboardMockup from "@/assets/images/dashboard-mockup.png";
import checkinMockup from "@/assets/images/checkin-mockup.png";
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
  const [step, setStep] = useState(0); // 0-3: Slides, 4: Habit builder, 5: Goal builder
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Habits list state
  const [habitsList, setHabitsList] = useState([
    { id: "h-0", name: "Read 10 pages", category: "learning", frequency: "daily" },
    { id: "h-1", name: "Morning stretch", category: "fitness", frequency: "daily" },
  ]);

  // Optional first goal state
  const [goalTitle, setGoalTitle] = useState("");
  const [goalTargetDate, setGoalTargetDate] = useState("");
  const [goalTasks, setGoalTasks] = useState([{ id: "gt-0", name: "" }]);

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

  function addGoalTask() {
    setError("");
    const newId = `gt-${Date.now()}-${Math.random()}`;
    setGoalTasks([...goalTasks, { id: newId, name: "" }]);
  }

  function removeGoalTask(id) {
    setGoalTasks(goalTasks.filter((t) => t.id !== id));
    setError("");
  }

  function updateGoalTask(id, value) {
    setGoalTasks(goalTasks.map((t) => (t.id === id ? { ...t, name: value } : t)));
    setError("");
  }

  async function handleFinish() {
    const validHabits = habitsList.filter((h) => h.name.trim() !== "");
    if (validHabits.length === 0) {
      setError("Please enter a name for at least one habit.");
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0];

    // If goal title is partially filled, validate it
    const hasGoal = goalTitle.trim() !== "";
    if (hasGoal) {
      if (!goalTargetDate) {
        setError("Target date is required for your first goal.");
        return;
      }
      if (goalTargetDate <= todayStr) {
        setError("Target date must be in the future.");
        return;
      }
    }

    setLoading(true);
    showLoading("Completing onboarding...");
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

      // 1. Bulk insert habits
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
        setLoading(false);
        hideLoading();
        return;
      }

      // 2. Insert optional goal if defined
      if (hasGoal) {
        const validTasks = goalTasks
          .filter((t) => t.name.trim() !== "")
          .map((t, idx) => ({
            id: t.id.startsWith("gt-0") ? `task-${Date.now()}-${idx}` : t.id,
            name: t.name.trim(),
          }));

        const goalPayload = JSON.stringify({
          tasks: validTasks,
          reminders: [],
          completion_history: {},
          created_at_date: todayStr,
          finished_date: null,
        });

        try {
          await GoalRepository.createGoal({
            user_id: user.id,
            title: goalTitle.trim(),
            description: goalPayload,
            target_date: goalTargetDate,
            progress_pct: 0,
            status: "active",
          });
        } catch (goalInsertError) {
          console.error("Failed to create optional goal:", goalInsertError);
          // Don't halt onboarding completely if only the optional goal fails, but notify
        }
      }

      // 3. Update user onboarded state in Auth metadata
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
          {[0, 1, 2, 3, 4, 5].map((i) => (
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
          ) : step === 4 ? (
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
          ) : (
            <motion.div
              key="goal-builder"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-5 w-full text-left"
            >
              <div>
                <h2 className="text-2xl font-bold text-bento-text">
                  Create your first goal <span className="text-sm font-normal text-bento-muted">(Optional)</span>
                </h2>
                <p className="text-sm text-bento-muted mt-1 leading-relaxed">
                  Give yourself something to strive for. You can skip this and add goals later.
                </p>
              </div>

              {/* Goal fields */}
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-bento-muted mb-2">Goal Title</label>
                  <Input
                    type="text"
                    placeholder="e.g. Learn Spanish, Run a 10K"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-bento-muted mb-2">Target Date</label>
                  <Input
                    type="date"
                    value={goalTargetDate}
                    onChange={(e) => setGoalTargetDate(e.target.value)}
                    className="w-full sm:w-auto"
                  />
                  <p className="text-[11px] text-bento-muted mt-1.5">
                    Complete this goal before this date.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-bento-card border border-bento-border">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="block text-xs font-semibold uppercase tracking-wider text-bento-text">Daily checklist tasks</span>
                      <p className="text-[11px] text-bento-muted">
                        Task items you must complete every day.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addGoalTask}
                      className="p-1.5 rounded-lg bg-bento-bg border border-bento-border text-bento-muted hover:text-stryde-primary hover:border-stryde-primary transition-all"
                      aria-label="Add goal task"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-2 mt-3 max-h-[150px] overflow-y-auto pr-1 scrollbar-thin">
                    {goalTasks.map((task, idx) => (
                      <div key={task.id} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={task.name}
                          onChange={(e) => updateGoalTask(task.id, e.target.value)}
                          placeholder="e.g. Study 15 mins, Do 20 pushups..."
                          className="flex-1 px-3 py-2 text-sm rounded-xl bg-bento-bg border border-bento-border text-bento-text placeholder:text-bento-muted outline-none focus:border-stryde-primary transition-all"
                        />
                        {goalTasks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeGoalTask(task.id)}
                            className="p-2 text-bento-muted hover:text-stryde-danger transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Button Controls */}
      <div className="mt-8 flex flex-col gap-3 w-full">
        <FormError message={error} className="mt-0 text-center" />
        
        {step < 5 ? (
          <Button
            onClick={() => {
              if (step === 4) {
                const validHabits = habitsList.filter((h) => h.name.trim() !== "");
                if (validHabits.length === 0) {
                  setError("Please enter a name for at least one habit.");
                  return;
                }
              }
              setError("");
              setStep((prev) => prev + 1);
            }}
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
            {loading ? "Starting..." : goalTitle.trim() ? "Create Goal & Start tracking \u2192" : "Start tracking \u2192"}
          </Button>
        )}
      </div>
    </div>
  );
}
