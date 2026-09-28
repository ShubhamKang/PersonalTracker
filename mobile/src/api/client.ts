import { getToken } from '../lib/token-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const { method = 'GET', body, auth = false } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth) {
    const token = await getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const err = (data ?? {}) as ApiError;
    const msg = Array.isArray(err.message)
      ? err.message.join(', ')
      : err.message ?? `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data as T;
}

export interface AuthResponse {
  accessToken: string;
  user: { id: string; email: string; timezone: string };
}

export interface MeResponse {
  id: string;
  email: string;
  timezone: string;
  hasPassword: boolean;
  googleLinked: boolean;
  createdAt: string;
}

export interface Todo {
  id: string;
  userId: string;
  date: string;
  title: string;
  done: boolean;
}

export type GoalScope = 'WEEKLY' | 'MONTHLY';
export type GoalCategory = 'STUDY' | 'OTHER';

export interface Goal {
  id: string;
  userId: string;
  scope: GoalScope;
  category: GoalCategory;
  title: string;
  done: boolean;
  periodKey: string;
}

export interface Progress {
  total: number;
  done: number;
}

export interface DashboardSummary {
  date: string;
  weekKey: string;
  monthKey: string;
  todos: Progress;
  weeklyGoals: Progress;
  monthlyGoals: Progress;
}

export interface HabitTemplate {
  id: string;
  sectionId: string;
  title: string;
  weekday: number; // 1=Mon .. 7=Sun
}

export interface Section {
  id: string;
  userId: string;
  name: string;
  notificationsEnabled: boolean;
  reminderTime: string | null;
  habits: HabitTemplate[];
}

export const api = {
  signup: (email: string, password: string, timezone?: string) =>
    request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: { email, password, timezone },
    }),

  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  me: () => request<MeResponse>('/auth/me', { auth: true }),

  registerPushToken: (token: string, platform: 'ios' | 'android') =>
    request<{ ok: true }>('/auth/push-token', {
      method: 'POST',
      auth: true,
      body: { token, platform },
    }),

  // --- Todos ---
  listTodayTodos: () => request<Todo[]>('/todos/today', { auth: true }),

  createTodo: (title: string) =>
    request<Todo>('/todos', { method: 'POST', auth: true, body: { title } }),

  updateTodo: (id: string, data: { title?: string; done?: boolean }) =>
    request<Todo>(`/todos/${id}`, { method: 'PATCH', auth: true, body: data }),

  deleteTodo: (id: string) =>
    request<{ ok: true }>(`/todos/${id}`, { method: 'DELETE', auth: true }),

  // --- Goals ---
  listGoals: (scope: GoalScope) =>
    request<Goal[]>(`/goals?scope=${scope}`, { auth: true }),

  createGoal: (scope: GoalScope, category: GoalCategory, title: string) =>
    request<Goal>('/goals', {
      method: 'POST',
      auth: true,
      body: { scope, category, title },
    }),

  updateGoal: (
    id: string,
    data: { title?: string; done?: boolean; category?: GoalCategory },
  ) => request<Goal>(`/goals/${id}`, { method: 'PATCH', auth: true, body: data }),

  deleteGoal: (id: string) =>
    request<{ ok: true }>(`/goals/${id}`, { method: 'DELETE', auth: true }),

  // --- Dashboard ---
  dashboardSummary: () =>
    request<DashboardSummary>('/dashboard/summary', { auth: true }),

  // --- Sections & Habits ---
  listSections: () => request<Section[]>('/sections', { auth: true }),

  createSection: (name: string) =>
    request<Section>('/sections', { method: 'POST', auth: true, body: { name } }),

  updateSection: (
    id: string,
    data: {
      name?: string;
      notificationsEnabled?: boolean;
      reminderTime?: string;
    },
  ) =>
    request<Section>(`/sections/${id}`, {
      method: 'PATCH',
      auth: true,
      body: data,
    }),

  deleteSection: (id: string) =>
    request<{ ok: true }>(`/sections/${id}`, { method: 'DELETE', auth: true }),

  createHabit: (sectionId: string, title: string, weekday: number) =>
    request<HabitTemplate>(`/sections/${sectionId}/habits`, {
      method: 'POST',
      auth: true,
      body: { title, weekday },
    }),

  deleteHabit: (habitId: string) =>
    request<{ ok: true }>(`/habits/${habitId}`, {
      method: 'DELETE',
      auth: true,
    }),
};

export { API_URL };
