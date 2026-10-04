/**
 * Central React Query hooks for the app.
 *
 * - Query keys are defined as constants so any screen can invalidate a related
 *   query after a mutation without importing a string literal.
 * - Every useQuery / useMutation is typed against the API client's return types.
 * - Mutations include optimistic updates where appropriate and always invalidate
 *   the relevant query on settle (success or error) so the cache stays fresh.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  api,
  DevItem,
  DevItemType,
  Goal,
  GoalCategory,
  GoalScope,
  Note,
} from './client';

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------
export const QK = {
  todos:      ['todos'] as const,
  summary:    ['dashboard', 'summary'] as const,
  habitsToday:['habits', 'today'] as const,
  goals:      (scope: GoalScope) => ['goals', scope] as const,
  sections:   ['sections'] as const,
  notes:      ['notes'] as const,
  devItems:   (type: DevItemType) => ['devItems', type] as const,
  review:     ['dashboard', 'review'] as const,
} as const;

// ---------------------------------------------------------------------------
// Today — todos
// ---------------------------------------------------------------------------
export function useTodos() {
  return useQuery({ queryKey: QK.todos, queryFn: api.listTodayTodos });
}

export function useCreateTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (title: string) => api.createTodo(title),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: QK.todos }); },
  });
}

export function useUpdateTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title?: string; done?: boolean } }) =>
      api.updateTodo(id, data),
    // Optimistic update: flip the done flag instantly.
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: QK.todos });
      const prev = qc.getQueryData<Awaited<ReturnType<typeof api.listTodayTodos>>>(QK.todos);
      qc.setQueryData<typeof prev>(QK.todos, (old) =>
        old?.map((t) => (t.id === id ? { ...t, ...data } : t)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(QK.todos, ctx.prev);
    },
    onSettled: () => { void qc.invalidateQueries({ queryKey: QK.todos }); },
  });
}

export function useDeleteTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteTodo(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QK.todos });
      const prev = qc.getQueryData<Awaited<ReturnType<typeof api.listTodayTodos>>>(QK.todos);
      qc.setQueryData<typeof prev>(QK.todos, (old) => old?.filter((t) => t.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(QK.todos, ctx.prev);
    },
    onSettled: () => { void qc.invalidateQueries({ queryKey: QK.todos }); },
  });
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
export function useDashboardSummary() {
  return useQuery({ queryKey: QK.summary, queryFn: api.dashboardSummary });
}

export function useWeeklyReview() {
  return useQuery({ queryKey: QK.review, queryFn: api.weeklyReview });
}

// ---------------------------------------------------------------------------
// Habits today
// ---------------------------------------------------------------------------
export function useHabitsToday() {
  return useQuery({ queryKey: QK.habitsToday, queryFn: api.habitsToday });
}

export function useCompleteHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) =>
      done ? api.completeHabit(id) : api.uncompleteHabit(id),
    onMutate: async ({ id, done }) => {
      await qc.cancelQueries({ queryKey: QK.habitsToday });
      const prev = qc.getQueryData<Awaited<ReturnType<typeof api.habitsToday>>>(QK.habitsToday);
      qc.setQueryData<typeof prev>(QK.habitsToday, (old) =>
        old?.map((h) =>
          h.id === id
            ? { ...h, done, streak: done ? h.streak + 1 : Math.max(0, h.streak - 1) }
            : h,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(QK.habitsToday, ctx.prev);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: QK.habitsToday });
      void qc.invalidateQueries({ queryKey: QK.summary });
    },
  });
}

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------
export function useGoals(scope: GoalScope) {
  return useQuery({
    queryKey: QK.goals(scope),
    queryFn: () => api.listGoals(scope),
  });
}

export function useCreateGoal(scope: GoalScope) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ category, title }: { category: GoalCategory; title: string }) =>
      api.createGoal(scope, category, title),
    onSuccess: (created) => {
      qc.setQueryData<Goal[]>(QK.goals(scope), (old) => [...(old ?? []), created]);
    },
    onSettled: () => { void qc.invalidateQueries({ queryKey: QK.goals(scope) }); },
  });
}

export function useUpdateGoal(scope: GoalScope) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { title?: string; done?: boolean; category?: GoalCategory };
    }) => api.updateGoal(id, data),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: QK.goals(scope) });
      const prev = qc.getQueryData<Goal[]>(QK.goals(scope));
      qc.setQueryData<Goal[]>(QK.goals(scope), (old) =>
        old?.map((g) => (g.id === id ? { ...g, ...data } : g)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(QK.goals(scope), ctx.prev);
    },
    onSettled: () => { void qc.invalidateQueries({ queryKey: QK.goals(scope) }); },
  });
}

export function useDeleteGoal(scope: GoalScope) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteGoal(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QK.goals(scope) });
      const prev = qc.getQueryData<Goal[]>(QK.goals(scope));
      qc.setQueryData<Goal[]>(QK.goals(scope), (old) => old?.filter((g) => g.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(QK.goals(scope), ctx.prev);
    },
    onSettled: () => { void qc.invalidateQueries({ queryKey: QK.goals(scope) }); },
  });
}

// ---------------------------------------------------------------------------
// Sections (for Habits screen)
// ---------------------------------------------------------------------------
export function useSections() {
  return useQuery({ queryKey: QK.sections, queryFn: api.listSections });
}

export function useInvalidateSections() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: QK.sections });
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------
export function useNotes() {
  return useQuery({ queryKey: QK.notes, queryFn: api.listNotes });
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; content?: string; pinned?: boolean }) =>
      api.createNote(data),
    onSuccess: (created) => {
      qc.setQueryData<Note[]>(QK.notes, (old) =>
        sortNotes([created, ...(old ?? [])]),
      );
    },
    onSettled: () => { void qc.invalidateQueries({ queryKey: QK.notes }); },
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { title?: string; content?: string; pinned?: boolean };
    }) => api.updateNote(id, data),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: QK.notes });
      const prev = qc.getQueryData<Note[]>(QK.notes);
      qc.setQueryData<Note[]>(QK.notes, (old) =>
        sortNotes(old?.map((n) => (n.id === id ? { ...n, ...data } : n)) ?? []),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(QK.notes, ctx.prev);
    },
    onSettled: () => { void qc.invalidateQueries({ queryKey: QK.notes }); },
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteNote(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QK.notes });
      const prev = qc.getQueryData<Note[]>(QK.notes);
      qc.setQueryData<Note[]>(QK.notes, (old) => old?.filter((n) => n.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(QK.notes, ctx.prev);
    },
    onSettled: () => { void qc.invalidateQueries({ queryKey: QK.notes }); },
  });
}

// ---------------------------------------------------------------------------
// Dev Items (Growth screen)
// ---------------------------------------------------------------------------
export function useDevItems(type: DevItemType) {
  return useQuery({
    queryKey: QK.devItems(type),
    queryFn: () => api.listDevItems(type),
  });
}

export function useCreateDevItem(type: DevItemType) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; progress?: number; notes?: string }) =>
      api.createDevItem({ type, ...data }),
    onSuccess: (created) => {
      qc.setQueryData<DevItem[]>(QK.devItems(type), (old) => [...(old ?? []), created]);
    },
    onSettled: () => { void qc.invalidateQueries({ queryKey: QK.devItems(type) }); },
  });
}

export function useUpdateDevItem(type: DevItemType) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { progress?: number; title?: string; notes?: string };
    }) => api.updateDevItem(id, data),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: QK.devItems(type) });
      const prev = qc.getQueryData<DevItem[]>(QK.devItems(type));
      qc.setQueryData<DevItem[]>(QK.devItems(type), (old) =>
        old?.map((i) => (i.id === id ? { ...i, ...data } : i)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(QK.devItems(type), ctx.prev);
    },
    onSettled: () => { void qc.invalidateQueries({ queryKey: QK.devItems(type) }); },
  });
}

export function useDeleteDevItem(type: DevItemType) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteDevItem(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QK.devItems(type) });
      const prev = qc.getQueryData<DevItem[]>(QK.devItems(type));
      qc.setQueryData<DevItem[]>(QK.devItems(type), (old) => old?.filter((i) => i.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(QK.devItems(type), ctx.prev);
    },
    onSettled: () => { void qc.invalidateQueries({ queryKey: QK.devItems(type) }); },
  });
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------
function sortNotes(list: Note[]): Note[] {
  return [...list].sort((a, b) => Number(b.pinned) - Number(a.pinned));
}
