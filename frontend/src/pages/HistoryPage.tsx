import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Clock, BarChart3, ChevronRight, ArrowLeft, CheckCircle2, RotateCcw, XCircle, Sun, Moon } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import type { SessionSummary, ExamSession } from "../types";

const STATUS_STYLE: Record<string, { label: string; icon: typeof Clock; cls: string }> = {
  completed: { label: "Completed", icon: CheckCircle2, cls: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" },
  in_progress: { label: "In Progress", icon: Clock, cls: "text-amber-600 dark:text-amber-400 bg-amber-500/10" },
  abandoned: { label: "Abandoned", icon: XCircle, cls: "text-gray-400 dark:text-slate-500 bg-gray-200/50 dark:bg-slate-700/30" },
};

export default function HistoryPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<ExamSession | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();

  useEffect(() => {
    if (!token) { navigate("/login", { replace: true }); return; }
    api.listSessions().then(setSessions).finally(() => setLoading(false));
  }, [token]);

  async function openDetail(id: string) {
    setDetailLoading(true);
    try {
      const s = await api.getSession(id);
      setDetail(s);
    } finally {
      setDetailLoading(false);
    }
  }

  function scoreColor(s: number | null) {
    if (s == null) return "text-gray-400 dark:text-slate-500";
    return s >= 85 ? "text-emerald-600 dark:text-emerald-400" : s >= 70 ? "text-green-600 dark:text-green-400" : s >= 55 ? "text-blue-600 dark:text-blue-400" : s >= 40 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400";
  }

  function scoreBar(s: number) {
    return s >= 85 ? "bg-emerald-500" : s >= 70 ? "bg-green-500" : s >= 55 ? "bg-blue-500" : s >= 40 ? "bg-yellow-500" : "bg-red-500";
  }

  if (detail) {
    const scores = detail.answers.map(a => a.overall_score ?? 0);
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-white transition-colors">
        <header className="border-b border-gray-200 dark:border-slate-800 px-3 sm:px-6 py-4 flex items-center gap-3">
          <button onClick={() => setDetail(null)} className="p-1.5 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold">Exam Detail</h1>
            <p className="text-xs text-gray-400 dark:text-slate-500">{new Date(detail.started_at ?? "").toLocaleString()}</p>
          </div>
          <button onClick={toggleTheme} className="p-1.5 rounded-lg text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0">
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <div className={`text-2xl sm:text-3xl font-black flex-shrink-0 ${scoreColor(avg)}`}>{avg}<span className="text-base sm:text-lg text-gray-400 dark:text-slate-500">/100</span></div>
        </header>

        <div className="max-w-2xl mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-4 sm:space-y-6">
          {detail.answers.map((ans, i) => {
            const q = detail.questions[i];
            if (!q) return null;
            const s = ans.overall_score ?? 0;
            const ev = ans.evaluation;
            return (
              <div key={i} className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                {/* Question header */}
                <div className="px-4 sm:px-5 py-4 border-b border-gray-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium truncate">{q.topic}</span>
                    <span className={`text-xl font-black flex-shrink-0 ${scoreColor(s)}`}>{s}/100</span>
                  </div>
                  <p className="text-gray-800 dark:text-white text-sm font-medium">{q.question}</p>
                  <div className="mt-2 h-1.5 bg-gray-200 dark:bg-slate-800 rounded-full">
                    <div className={`h-1.5 rounded-full ${scoreBar(s)}`} style={{ width: `${s}%` }} />
                  </div>
                </div>

                {/* Answers */}
                <div className="px-4 sm:px-5 py-4 space-y-4">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-slate-500 font-semibold uppercase tracking-wide mb-1.5">Your answer</div>
                    <p className="text-gray-700 dark:text-slate-300 text-sm leading-relaxed">{ans.main_answer || "(no answer)"}</p>
                  </div>

                  {q.followups.map((fq, fi) => (
                    <div key={fi}>
                      <div className="text-xs text-violet-600 dark:text-violet-400 font-semibold uppercase tracking-wide mb-1.5">Follow-up {fi + 1}</div>
                      <p className="text-gray-500 dark:text-slate-400 text-xs mb-1 italic">{fq}</p>
                      <p className="text-gray-700 dark:text-slate-300 text-sm leading-relaxed">{ans.followup_answers[fi] || "(not answered)"}</p>
                    </div>
                  ))}

                  {ev && (
                    <div className="pt-4 border-t border-gray-200 dark:border-slate-800 space-y-3">
                      {ev.items?.map((item: any, ii: number) => (
                        <div key={ii} className="flex gap-3 bg-gray-100 dark:bg-slate-800/40 rounded-lg px-3 py-2">
                          <span className={`text-sm font-bold flex-shrink-0 ${scoreColor(item.score)}`}>{item.score}</span>
                          <div>
                            <div className="text-xs text-gray-500 dark:text-slate-500">{item.label}</div>
                            <div className="text-xs text-gray-600 dark:text-slate-400 mt-0.5">{item.feedback}</div>
                          </div>
                        </div>
                      ))}
                      {ev.strengths && (
                        <div className="text-xs text-emerald-700 dark:text-emerald-400"><strong>Strengths:</strong> {ev.strengths}</div>
                      )}
                      {ev.gaps && ev.gaps !== "None" && (
                        <div className="text-xs text-orange-600 dark:text-orange-400"><strong>Gaps:</strong> {ev.gaps}</div>
                      )}
                      {ev.improvement_tips && (
                        <div className="text-xs text-sky-600 dark:text-sky-400"><strong>Tips:</strong> {ev.improvement_tips}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-white transition-colors">
      <header className="border-b border-gray-200 dark:border-slate-800 px-3 sm:px-6 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button onClick={() => navigate("/")} className="p-1.5 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="font-bold truncate">Exam History</h1>
            <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{user?.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={toggleTheme} className="p-1.5 rounded-lg text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button onClick={() => navigate("/exam")}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg transition-colors flex-shrink-0">
            <span className="hidden sm:inline">New Exam</span>
            <span className="sm:hidden">New</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {loading ? (
          <div className="text-center py-16 text-gray-400 dark:text-slate-500">Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="w-12 h-12 text-gray-300 dark:text-slate-700 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-slate-500 mb-6">No exams yet. Start your first one!</p>
            <button onClick={() => navigate("/exam")} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-all">
              Start Exam
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Stats summary */}
            {sessions.filter(s => s.status === "completed").length > 0 && (() => {
              const done = sessions.filter(s => s.status === "completed");
              const scores = done.map(s => s.final_score ?? 0);
              const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
              const best = Math.round(Math.max(...scores));
              return (
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5 sm:mb-6">
                  {[
                    { label: "Exams done", value: done.length, icon: CheckCircle2, color: "text-indigo-600 dark:text-indigo-400" },
                    { label: "Avg score", value: avg + "/100", icon: BarChart3, color: "text-emerald-600 dark:text-emerald-400" },
                    { label: "Best score", value: best + "/100", icon: Trophy, color: "text-amber-600 dark:text-amber-400" },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-3 sm:p-4 text-center">
                      <Icon className={`w-4 h-4 ${color} mx-auto mb-1.5 sm:mb-2`} />
                      <div className={`text-lg sm:text-xl font-bold ${color}`}>{value}</div>
                      <div className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{label}</div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {sessions.map(s => {
              const st = STATUS_STYLE[s.status] ?? STATUS_STYLE.abandoned;
              const StatusIcon = st.icon;
              return (
                <div key={s.id}
                  onClick={() => s.status !== "abandoned" && openDetail(s.id)}
                  className={`bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 ${s.status !== "abandoned" ? "cursor-pointer hover:border-gray-400 dark:hover:border-slate-600 transition-colors" : "opacity-50"}`}>
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${st.cls} flex items-center justify-center flex-shrink-0`}>
                    <StatusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                      <span className="text-xs text-gray-400 dark:text-slate-500">{s.answers_count}/{s.question_count} answered</span>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-slate-500">{new Date(s.started_at).toLocaleString()}</p>
                  </div>
                  {s.final_score != null && (
                    <div className={`text-xl sm:text-2xl font-black flex-shrink-0 ${scoreColor(s.final_score)}`}>{Math.round(s.final_score)}</div>
                  )}
                  {s.status === "in_progress" && (
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/exam?session=${s.id}`); }}
                      className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">
                      <RotateCcw className="w-3 h-3" /> Resume
                    </button>
                  )}
                  {s.status === "completed" && (
                    <ChevronRight className="w-4 h-4 text-gray-400 dark:text-slate-600 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {detailLoading && (
        <div className="fixed inset-0 bg-white/80 dark:bg-slate-950/80 flex items-center justify-center">
          <svg className="animate-spin w-8 h-8 text-indigo-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      )}
    </div>
  );
}
