/**
 * Pure aggregation for the weekly review summary. Kept free of Prisma/IO so
 * it can be unit-tested with plain objects. The service layer is responsible
 * for fetching the raw data and passing it in.
 */

export interface ReviewTodo {
  date: string; // "YYYY-MM-DD"
  done: boolean;
}

export interface ReviewGoal {
  done: boolean;
}

export interface ReviewHabit {
  title: string;
  weekday: number; // ISO 1=Mon..7=Sun
  /** All completion dates ("YYYY-MM-DD") for this habit (any period). */
  completionDates: string[];
}

export interface Progress {
  total: number;
  done: number;
}

export interface HabitReview {
  title: string;
  /** Scheduled occurrences that fall within this week (0 or 1 for weekly habits). */
  scheduled: number;
  /** Of those scheduled this week, how many were completed. */
  completed: number;
}

export interface WeeklyReview {
  weekStart: string; // Monday "YYYY-MM-DD"
  weekEnd: string; // Sunday "YYYY-MM-DD"
  todos: Progress; // across the 7 days
  weeklyGoals: Progress;
  monthlyGoals: Progress;
  habits: Progress; // scheduled vs completed across the week
  habitBreakdown: HabitReview[];
  completionRate: number; // 0..100 overall (todos + goals + habits)
}

function progress(items: { done: boolean }[]): Progress {
  return { total: items.length, done: items.filter((i) => i.done).length };
}

/**
 * Build the weekly review from raw inputs.
 * @param weekDates the 7 local dates (Mon..Sun) of the week, ascending.
 */
export function buildWeeklyReview(input: {
  weekDates: string[];
  todos: ReviewTodo[];
  weeklyGoals: ReviewGoal[];
  monthlyGoals: ReviewGoal[];
  habits: ReviewHabit[];
}): WeeklyReview {
  const { weekDates, todos, weeklyGoals, monthlyGoals, habits } = input;
  const weekSet = new Set(weekDates);

  // Only count todos whose date falls within this week.
  const weekTodos = todos.filter((t) => weekSet.has(t.date));
  const todoProgress = progress(weekTodos);

  const weeklyGoalProgress = progress(weeklyGoals);
  const monthlyGoalProgress = progress(monthlyGoals);

  // Map ISO weekday -> the date string in this week.
  const dateByWeekday = new Map<number, string>();
  weekDates.forEach((d, idx) => dateByWeekday.set(idx + 1, d)); // idx 0 => Mon(1)

  const habitBreakdown: HabitReview[] = [];
  let habitScheduled = 0;
  let habitCompleted = 0;

  for (const h of habits) {
    const scheduledDate = dateByWeekday.get(h.weekday);
    // Each weekly habit is scheduled at most once in a given week.
    const scheduled = scheduledDate ? 1 : 0;
    const completed =
      scheduledDate && h.completionDates.includes(scheduledDate) ? 1 : 0;
    habitScheduled += scheduled;
    habitCompleted += completed;
    habitBreakdown.push({ title: h.title, scheduled, completed });
  }

  const habitProgress: Progress = {
    total: habitScheduled,
    done: habitCompleted,
  };

  const totalItems =
    todoProgress.total +
    weeklyGoalProgress.total +
    monthlyGoalProgress.total +
    habitProgress.total;
  const doneItems =
    todoProgress.done +
    weeklyGoalProgress.done +
    monthlyGoalProgress.done +
    habitProgress.done;
  const completionRate =
    totalItems === 0 ? 0 : Math.round((doneItems / totalItems) * 100);

  return {
    weekStart: weekDates[0],
    weekEnd: weekDates[weekDates.length - 1],
    todos: todoProgress,
    weeklyGoals: weeklyGoalProgress,
    monthlyGoals: monthlyGoalProgress,
    habits: habitProgress,
    habitBreakdown,
    completionRate,
  };
}
