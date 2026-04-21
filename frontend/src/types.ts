export interface Question {
  id: string;
  topic_number: number;
  topic: string;
  question: string;
  followups: string[];
  code_challenge: string | null;
  status: string;
  created_by: number | null;
  ai_feedback: string | null;
  created_at: string;
}

export interface ExamSession {
  student_name: string;
  prep_questions: Question[];
  direct_questions: Question[];
}

export interface TopicSummary {
  topic_number: number;
  topic: string;
  count: number;
}

export interface StatsResponse {
  total_questions: number;
  topics: TopicSummary[];
}

export interface AIEvaluation {
  score: number;
  grade: string;
  strengths: string;
  gaps: string;
  model_answer: string;
  improvement_tips: string;
}

export interface GeneratedQuestion {
  question: string;
  followups: string[];
  code_challenge: string | null;
}

export interface AIValidation {
  approved: boolean;
  reason: string;
  issues: string;
  suggestions: string;
}

export interface User {
  id: number;
  username: string;
  role: "admin" | "contributor" | "viewer";
  created_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
}
