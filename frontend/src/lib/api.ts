import type { Question, ExamSession, StatsResponse, AIEvaluation, GeneratedQuestion, AIValidation, User } from "../types";

const BASE = "/";

function getToken(): string | null {
  return localStorage.getItem("cs231_token");
}

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string> ?? {}),
  };

  const res = await fetch(BASE + path, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  // Auth
  register: (username: string, password: string) =>
    req<{ token: string; user: User }>("auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  login: (username: string, password: string) =>
    req<{ token: string; user: User }>("auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  getMe: () => req<User>("auth/me"),

  // Users (admin)
  listUsers: () => req<User[]>("users/"),
  setUserRole: (id: number, role: string) =>
    req<User>(`users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) }),
  deleteUser: (id: number) => req<void>(`users/${id}`, { method: "DELETE" }),

  // Exam
  startExam: (student_name: string) =>
    req<ExamSession>("exam/start", {
      method: "POST",
      body: JSON.stringify({ student_name }),
    }),
  getStats: () => req<StatsResponse>("exam/stats"),

  // Questions
  listQuestions: () => req<Question[]>("questions/"),
  getQuestion: (id: string) => req<Question>(`questions/${id}`),
  createQuestion: (data: Omit<Question, "id" | "created_at" | "status" | "created_by" | "ai_feedback">) =>
    req<Question>("questions/", { method: "POST", body: JSON.stringify(data) }),
  updateQuestion: (id: string, data: Omit<Question, "id" | "created_at" | "status" | "created_by" | "ai_feedback">) =>
    req<Question>(`questions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteQuestion: (id: string) =>
    req<void>(`questions/${id}`, { method: "DELETE" }),
  approveQuestion: (id: string) =>
    req<Question>(`questions/${id}/approve`, { method: "PATCH" }),
  rejectQuestion: (id: string) =>
    req<Question>(`questions/${id}/reject`, { method: "PATCH" }),

  // AI
  evaluateAnswer: (question: string, answer: string, topic: string) =>
    req<AIEvaluation>("ai/evaluate", {
      method: "POST",
      body: JSON.stringify({ question, answer, topic }),
    }),
  getDynamicFollowups: (question: string, answer: string, topic: string) =>
    req<{ followups: string[] }>("ai/dynamic-followups", {
      method: "POST",
      body: JSON.stringify({ question, answer, topic }),
    }),
  getHint: (question: string, topic: string) =>
    req<{ hint: string }>("ai/hint", {
      method: "POST",
      body: JSON.stringify({ question, topic }),
    }),
  generateQuestion: (topic_number: number, topic: string) =>
    req<GeneratedQuestion>("ai/generate-question", {
      method: "POST",
      body: JSON.stringify({ topic_number, topic }),
    }),
  validateQuestion: (topic: string, question: string, followups: string[], code_challenge?: string | null) =>
    req<AIValidation>("ai/validate-question", {
      method: "POST",
      body: JSON.stringify({ topic, question, followups, code_challenge }),
    }),
};
