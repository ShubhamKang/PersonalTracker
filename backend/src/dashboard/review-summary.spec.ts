import { buildWeeklyReview } from './review-summary';

// Mon..Sun of an arbitrary ISO week.
const WEEK = [
  '2026-09-28', // Mon (weekday 1)
  '2026-09-29', // Tue (2)
  '2026-09-30', // Wed (3)
  '2026-10-01', // Thu (4)
  '2026-10-02', // Fri (5)
  '2026-10-03', // Sat (6)
  '2026-10-04', // Sun (7)
];

describe('buildWeeklyReview', () => {
  it('returns zeroed progress and 0% when there is no data', () => {
    const r = buildWeeklyReview({
      weekDates: WEEK,
      todos: [],
      weeklyGoals: [],
      monthlyGoals: [],
      habits: [],
    });
    expect(r.weekStart).toBe('2026-09-28');
    expect(r.weekEnd).toBe('2026-10-04');
    expect(r.todos).toEqual({ total: 0, done: 0 });
    expect(r.habits).toEqual({ total: 0, done: 0 });
    expect(r.completionRate).toBe(0);
    expect(r.habitBreakdown).toEqual([]);
  });

  it('counts only todos within the week', () => {
    const r = buildWeeklyReview({
      weekDates: WEEK,
      todos: [
        { date: '2026-09-28', done: true },
        { date: '2026-09-29', done: false },
        { date: '2026-10-04', done: true },
        { date: '2026-09-27', done: true }, // previous week -> ignored
        { date: '2026-10-05', done: true }, // next week -> ignored
      ],
      weeklyGoals: [],
      monthlyGoals: [],
      habits: [],
    });
    expect(r.todos).toEqual({ total: 3, done: 2 });
  });

  it('counts weekly and monthly goals separately', () => {
    const r = buildWeeklyReview({
      weekDates: WEEK,
      todos: [],
      weeklyGoals: [{ done: true }, { done: false }, { done: true }],
      monthlyGoals: [{ done: false }, { done: false }],
      habits: [],
    });
    expect(r.weeklyGoals).toEqual({ total: 3, done: 2 });
    expect(r.monthlyGoals).toEqual({ total: 2, done: 0 });
  });

  it('marks a habit scheduled this week as completed when its weekday date is present', () => {
    const r = buildWeeklyReview({
      weekDates: WEEK,
      todos: [],
      weeklyGoals: [],
      monthlyGoals: [],
      habits: [
        // Tue habit, completed on this week's Tuesday.
        { title: 'Run', weekday: 2, completionDates: ['2026-09-29'] },
        // Thu habit, not completed this week (completion is a different week).
        { title: 'Read', weekday: 4, completionDates: ['2026-09-24'] },
      ],
    });
    expect(r.habits).toEqual({ total: 2, done: 1 });
    expect(r.habitBreakdown).toEqual([
      { title: 'Run', scheduled: 1, completed: 1 },
      { title: 'Read', scheduled: 1, completed: 0 },
    ]);
  });

  it('computes an overall completion rate across all item types', () => {
    // 2 todos (1 done), 2 weekly goals (1 done), 0 monthly, 2 habits (2 done)
    // total = 6, done = 4 => round(66.67) = 67
    const r = buildWeeklyReview({
      weekDates: WEEK,
      todos: [
        { date: '2026-09-28', done: true },
        { date: '2026-09-29', done: false },
      ],
      weeklyGoals: [{ done: true }, { done: false }],
      monthlyGoals: [],
      habits: [
        { title: 'A', weekday: 1, completionDates: ['2026-09-28'] },
        { title: 'B', weekday: 3, completionDates: ['2026-09-30'] },
      ],
    });
    expect(r.habits).toEqual({ total: 2, done: 2 });
    expect(r.completionRate).toBe(67);
  });
});
