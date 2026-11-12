This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Project Structure

```
stryde/
├── public/
│   ├── file.svg
│   ├── globe.svg
│   ├── manifest.json
│   ├── next.svg
│   ├── stryde-dashboard-mockup.png
│   ├── stryde-logo.png
│   ├── stryde-logo1 (1).png
│   ├── vercel.svg
│   └── window.svg
├── src/
│   ├── app/
│   │   ├── (app)/                          # Authenticated app route group
│   │   │   ├── analytics/
│   │   │   │   ├── loading.jsx
│   │   │   │   └── page.jsx
│   │   │   ├── checkin/
│   │   │   │   ├── loading.jsx
│   │   │   │   └── page.jsx
│   │   │   ├── dashboard/
│   │   │   │   ├── loading.jsx
│   │   │   │   └── page.jsx
│   │   │   ├── goals/
│   │   │   │   ├── new/
│   │   │   │   │   └── page.jsx
│   │   │   │   ├── loading.jsx
│   │   │   │   └── page.jsx
│   │   │   ├── habits/
│   │   │   │   ├── new/
│   │   │   │   │   └── page.jsx
│   │   │   │   └── page.jsx
│   │   │   ├── error.jsx
│   │   │   ├── layout.jsx
│   │   │   └── loading.jsx
│   │   ├── actions/
│   │   │   └── goalActions.js
│   │   ├── api/
│   │   │   └── health/
│   │   │       └── route.js
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.js
│   │   ├── intro/
│   │   │   ├── layout.jsx
│   │   │   └── page.jsx
│   │   ├── onboarding/
│   │   │   ├── OnboardingClient.jsx
│   │   │   └── page.jsx
│   │   ├── privacy/
│   │   │   └── page.jsx
│   │   ├── sign-in/
│   │   │   ├── SignInClient.jsx
│   │   │   └── page.jsx
│   │   ├── sign-up/
│   │   │   └── page.jsx
│   │   ├── terms/
│   │   │   └── page.jsx
│   │   ├── error.jsx
│   │   ├── globals.css
│   │   ├── icon.png
│   │   ├── layout.js
│   │   ├── not-found.jsx
│   │   └── page.js
│   ├── assets/
│   │   └── images/
│   │       ├── analytics-mockup.png
│   │       ├── checkin-image.png
│   │       ├── checkin-mockup.png
│   │       ├── dashboard-mockup.png
│   │       ├── desktop-image-analytics.png
│   │       ├── desktop-image-dashboard.png
│   │       ├── desktop-image-goals.png
│   │       ├── goals-mockup.png
│   │       └── stryde-logo.png
│   ├── components/
│   │   ├── analytics/
│   │   │   ├── AnalyticsPageTracker.jsx
│   │   │   ├── HeatmapCalendar.jsx
│   │   │   ├── StatsTile.jsx
│   │   │   └── TrendChart.jsx
│   │   ├── checkin/
│   │   │   ├── CheckInCard.jsx
│   │   │   ├── checkInList.jsx
│   │   │   ├── CheckInProgress.jsx
│   │   │   └── CompletionCelebration.jsx
│   │   ├── dasboard/
│   │   │   └── DashboardClient.jsx
│   │   ├── goals/
│   │   │   ├── GoalCard.jsx
│   │   │   ├── GoalCreateForm.jsx
│   │   │   ├── GoalProgressBar.jsx
│   │   │   └── GoalsPageTracker.jsx
│   │   ├── habits/
│   │   │   ├── HabitCard.jsx
│   │   │   ├── HabitCreateForm.jsx
│   │   │   ├── HabitList.jsx
│   │   │   └── HabitsClient.jsx
│   │   ├── intro/
│   │   │   └── LandingPage.jsx
│   │   ├── streaks/
│   │   │   ├── StreakBadge.jsx
│   │   │   └── StreakMilestone.jsx
│   │   └── ui/
│   │       ├── Reusable/
│   │       │   ├── CheckInCelebrationModal.jsx
│   │       │   ├── GlobalLoadingOverlay.jsx
│   │       │   ├── MilestoneToast.jsx
│   │       │   ├── ResetGlobalLoading.jsx
│   │       │   ├── SignOutButton.jsx
│   │       │   ├── Spinner.jsx
│   │       │   ├── TargetDatePicker.jsx
│   │       │   └── UndoPopup.jsx
│   │       ├── AppShell.jsx
│   │       ├── badge.jsx
│   │       ├── BottomTabBar.jsx
│   │       ├── button.jsx
│   │       ├── card.jsx
│   │       ├── EmptyState.jsx
│   │       ├── FormError.jsx
│   │       ├── FormLabel.jsx
│   │       ├── Input.jsx
│   │       ├── OfflineBanner.jsx
│   │       ├── ProgressRing.jsx
│   │       └── Textarea.jsx
│   ├── hooks/
│   │   ├── useAnalytics.js
│   │   ├── useCheckins.js
│   │   ├── useGoal.js
│   │   ├── useHabit.js
│   │   ├── useHabits.js
│   │   ├── useOnline.js
│   │   └── useStreak.js
│   ├── lib/
│   │   ├── auth.js
│   │   ├── date.js
│   │   ├── date-picker.js
│   │   ├── db.js
│   │   ├── design-token.js
│   │   ├── env.js
│   │   ├── goalUtils.js
│   │   ├── streakUtils.js
│   │   ├── supabase.js
│   │   ├── supabase-server.js
│   │   ├── sync.js
│   │   └── ui-config.js
│   ├── repositories/
│   │   ├── checkInRepository.js
│   │   ├── goalRepository.js
│   │   ├── habitRepository.js
│   │   ├── streakRepository.js
│   │   └── userStreakRepository.js
│   └── stores/
│       └── useAppStore.js
├── .env.local
├── .gitattributes
├── .gitignore
├── AGENTS.md
├── ARCHITECTURE.md
├── eslint.config.mjs
├── jsconfig.json
├── next.config.mjs
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── proxy.js
├── README.md
├── STRYDE_ROADMAP.md
└── UX_GUIDELINES.md
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.





## Table `habits`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  Nullable |
| `name` | `text` |  |
| `frequency` | `text` |  Nullable |
| `category` | `text` |  Nullable |
| `color_tag` | `text` |  Nullable |
| `reminder_time` | `time` |  Nullable |
| `order_index` | `int4` |  Nullable |
| `archived` | `bool` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `goals`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  Nullable |
| `title` | `text` |  |
| `description` | `text` |  Nullable |
| `target_date` | `date` |  Nullable |
| `progress_pct` | `int4` |  Nullable |
| `status` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `check_ins`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `habit_id` | `uuid` |  Nullable |
| `user_id` | `uuid` |  Nullable |
| `date` | `date` |  |
| `completed` | `bool` |  Nullable |
| `note` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `streaks`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `habit_id` | `uuid` |  Nullable Unique |
| `user_id` | `uuid` |  Nullable |
| `current_streak` | `int4` |  Nullable |
| `longest_streak` | `int4` |  Nullable |
| `last_checked_in` | `date` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## RLS Policies

### `habits`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `own habits` | ALL | public | PERMISSIVE | `(auth.uid() = user_id)` | — |

### `goals`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `own goals` | ALL | public | PERMISSIVE | `(auth.uid() = user_id)` | — |

### `check_ins`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `own check_ins` | ALL | public | PERMISSIVE | `(auth.uid() = user_id)` | — |

### `streaks`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `own streaks` | ALL | public | PERMISSIVE | `(auth.uid() = user_id)` | — |

