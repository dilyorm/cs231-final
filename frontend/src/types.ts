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

export interface FullEvalItem {
  label: string;
  score: number;
  feedback: string;
}

export interface FullEvaluation {
  overall_score: number;
  grade: string;
  items: FullEvalItem[];
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

// Exam session types
export interface QuestionAnswer {
  q_index: number;
  main_answer: string | null;
  followup_answers: (string | null)[];
  evaluation: FullEvaluation | null;
  overall_score: number | null;
}

export interface ExamSession {
  session_id: string;
  questions: Question[];
  prep_count: number;
  current_q_index: number;
  answers: QuestionAnswer[];
  status: string;
  final_score?: number | null;
  started_at?: string;
  completed_at?: string | null;
}

export interface SessionSummary {
  id: string;
  status: string;
  final_score: number | null;
  question_count: number;
  answers_count: number;
  started_at: string;
  completed_at: string | null;
}
