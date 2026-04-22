import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Pencil, Trash2, Code2, ChevronDown, ChevronRight,
  Plus, CheckCircle2, XCircle, Clock,
} from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import type { Question } from "../../types";

const STATUS_STYLE: Record<string, { label: string; icon: typeof Clock; cls: string }> = {
  approved: { label: "Approved", icon: CheckCircle2, cls: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10" },
  pending: { label: "Pending", icon: Clock, cls: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10" },
  rejected: { label: "Rejected", icon: XCircle, cls: "text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10" },
};

export default function QuestionList() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [topicFilter, setTopicFilter] = useState<number | "all">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      setQuestions(await api.listQuestions());
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this question?")) return;
    setDeleting(id);
    try {
      await api.deleteQuestion(id);
      setQuestions(prev => prev.filter(q => q.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  async function approve(id: string) {
    setActing(id);
    try {
      const updated = await api.approveQuestion(id);
      setQuestions(prev => prev.map(q => q.id === id ? updated : q));
    } finally {
      setActing(null);
    }
  }

  async function reject(id: string) {
    setActing(id);
    try {
      const updated = await api.rejectQuestion(id);
      setQuestions(prev => prev.map(q => q.id === id ? updated : q));
    } finally {
      setActing(null);
    }
  }

  const topics = Array.from(
    new Map(questions.map(q => [q.topic_number, q.topic])).entries()
  ).sort((a, b) => a[0] - b[0]);

  const filtered = questions.filter(q => {
    const matchSearch = search === "" || q.question.toLowerCase().includes(search.toLowerCase()) || q.topic.toLowerCase().includes(search.toLowerCase()) || q.id.toLowerCase().includes(search.toLowerCase());
    const matchTopic = topicFilter === "all" || q.topic_number === topicFilter;
    const matchStatus = statusFilter === "all" || q.status === statusFilter;
    return matchSearch && matchTopic && matchStatus;
  });

  const grouped = filtered.reduce<Record<number, Question[]>>((acc, q) => {
    if (!acc[q.topic_number]) acc[q.topic_number] = [];
    acc[q.topic_number].push(q);
    return acc;
  }, {});

  const pendingCount = questions.filter(q => q.status === "pending").length;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Questions</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-gray-500 dark:text-slate-400 text-sm">{questions.length} questions · {topics.length} topics</p>
            {pendingCount > 0 && isAdmin && (
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded-full">
                {pendingCount} pending review
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => navigate("/admin/questions/new")}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Question
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search questions..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-600"
          />
        </div>
        <select
          value={topicFilter === "all" ? "all" : topicFilter}
          onChange={e => setTopicFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
          className="border border-gray-200 dark:border-slate-700 rounded-lg text-sm px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-600"
        >
          <option value="all">All topics</option>
          {topics.map(([num, name]) => (
            <option key={num} value={num}>T{String(num).padStart(2, "0")} · {name.split(" – ")[1] ?? name}</option>
          ))}
        </select>
        {isAdmin && (
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-200 dark:border-slate-700 rounded-lg text-sm px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-600"
          >
            <option value="all">All statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 dark:text-slate-500">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-slate-500">No questions found.</div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([topicNum, qs]) => (
              <div key={topicNum} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-gray-400 dark:text-slate-500">
                      T{String(Number(topicNum)).padStart(2, "0")}
                    </span>
                    <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">{qs[0].topic}</span>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-slate-500 bg-gray-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                    {qs.length} question{qs.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="divide-y divide-gray-50 dark:divide-slate-800">
                  {qs.map(q => {
                    const status = STATUS_STYLE[q.status] ?? STATUS_STYLE.pending;
                    const StatusIcon = status.icon;
                    const canEdit = isAdmin || q.created_by === user?.id;
                    const canDelete = isAdmin || q.created_by === user?.id;

                    return (
                      <div key={q.id}>
                        <div
                          className="px-5 py-3.5 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-slate-800/40 cursor-pointer"
                          onClick={() => setExpanded(prev => prev === q.id ? null : q.id)}
                        >
                          <span className="mt-0.5 text-gray-400 dark:text-slate-500">
                            {expanded === q.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <span className="text-xs font-mono text-gray-400 dark:text-slate-500">{q.id}</span>
                              {q.code_challenge && (
                                <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                  <Code2 className="w-3 h-3" /> code
                                </span>
                              )}
                              <span className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded font-medium ${status.cls}`}>
                                <StatusIcon className="w-3 h-3" />
                                {status.label}
                              </span>
                            </div>
                            <p className="text-sm text-gray-800 dark:text-slate-200 line-clamp-2">{q.question}</p>
                            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                              {q.followups.length} follow-up{q.followups.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {isAdmin && q.status === "pending" && (
                              <>
                                <button
                                  onClick={e => { e.stopPropagation(); approve(q.id); }}
                                  disabled={acting === q.id}
                                  className="p-1.5 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors disabled:opacity-50"
                                  title="Approve"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={e => { e.stopPropagation(); reject(q.id); }}
                                  disabled={acting === q.id}
                                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                                  title="Reject"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            {canEdit && (
                              <button
                                onClick={e => { e.stopPropagation(); navigate(`/admin/questions/${q.id}/edit`); }}
                                className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={e => { e.stopPropagation(); remove(q.id); }}
                                disabled={deleting === q.id}
                                className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {expanded === q.id && (
                          <div className="px-12 pb-4 space-y-3 bg-gray-50/50 dark:bg-slate-800/20">
                            <div>
                              <div className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-2">
                                Follow-up questions
                              </div>
                              <ul className="space-y-1.5">
                                {q.followups.map((f, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-slate-300">
                                    <span className="text-gray-300 dark:text-slate-600 font-mono">{i + 1}.</span>
                                    {f}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            {q.code_challenge && (
                              <div>
                                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-2">
                                  Code Challenge
                                </div>
                                <p className="text-sm text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-500/20 rounded-lg p-3">
                                  {q.code_challenge}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
