import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2, ArrowLeft, Save, Sparkles, ShieldCheck, AlertTriangle, CheckCircle2 } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import type { Question, AIValidation } from "../../types";

const TOPIC_NAMES: Record<number, string> = {
  1: "Topic 1 – Binary Representation & Byte Ordering",
  2: "Topic 2 – Encoding Integers & Arithmetic",
  3: "Topic 3 – Encoding Fractional Numbers (Float/Double)",
  4: "Topic 4 – x86/x64 Processors & Registers",
  5: "Topic 5 – Assembly Language & Arithmetic",
  6: "Topic 6 – Memory Addressing, MOV, LEA, Jumps, Loops",
  7: "Topic 7 – Stack, Procedures, Stack Frame",
  8: "Topic 8 – NASM Preprocessor & Macros",
  9: "Topic 9 – STRUC, ISTRUC, Alignment",
  10: "Topic 10 – Basic Data Types & Arrays",
  11: "Topic 11 – Memory Layout for Running Application",
  12: "Topic 12 – Memory Hierarchy: Cache",
  13: "Topic 13 – Memory Hierarchy: DRAM",
  14: "Topic 14 – Memory Hierarchy: HDD and SSD",
  15: "Topic 15 – Linkers, Symbols, Libraries",
  16: "Topic 16 – Asynchronous & Synchronous Exceptions",
  17: "Topic 17 – Processes, Threads, Race Conditions",
  18: "Topic 18 – Signals, Signal Handlers, Nonlocal Jumps",
  19: "Topic 19 – Input/Output, Standard I/O",
  20: "Topic 20 – Virtual Memory & Address Translation",
  21: "Topic 21 – Concurrent Programming",
  22: "Topic 22 – Parallelism & Synchronization",
  23: "Topic 23 – Virtual Machines",
};

type FormData = {
  topic_number: number;
  topic: string;
  question: string;
  followups: string[];
  code_challenge: string;
};

const DEFAULT: FormData = {
  topic_number: 1,
  topic: TOPIC_NAMES[1],
  question: "",
  followups: [""],
  code_challenge: "",
};

function Spin() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

export default function QuestionForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<FormData>(DEFAULT);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<AIValidation | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEdit || !id) return;
    api.getQuestion(id).then(q => {
      setForm({
        topic_number: q.topic_number,
        topic: q.topic,
        question: q.question,
        followups: q.followups.length > 0 ? q.followups : [""],
        code_challenge: q.code_challenge ?? "",
      });
      setLoading(false);
    });
  }, [id, isEdit]);

  function setField<K extends keyof FormData>(key: K, val: FormData[K]) {
    setForm(prev => ({ ...prev, [key]: val }));
    setValidation(null);
  }

  function setTopicNumber(n: number) {
    setForm(prev => ({ ...prev, topic_number: n, topic: TOPIC_NAMES[n] ?? prev.topic }));
    setValidation(null);
  }

  function setFollowup(i: number, val: string) {
    setForm(prev => { const f = [...prev.followups]; f[i] = val; return { ...prev, followups: f }; });
    setValidation(null);
  }

  function addFollowup() { setForm(prev => ({ ...prev, followups: [...prev.followups, ""] })); }

  function removeFollowup(i: number) {
    setForm(prev => ({ ...prev, followups: prev.followups.filter((_, idx) => idx !== i) }));
  }

  async function generateWithAI() {
    setGenerating(true);
    setError("");
    setValidation(null);
    try {
      const generated = await api.generateQuestion(form.topic_number, form.topic);
      setForm(prev => ({
        ...prev,
        question: generated.question,
        followups: generated.followups.length > 0 ? generated.followups : [""],
        code_challenge: generated.code_challenge ?? "",
      }));
    } catch (e: any) {
      setError(e.message ?? "AI generation failed.");
    } finally {
      setGenerating(false);
    }
  }

  async function runValidation() {
    const followups = form.followups.filter(f => f.trim());
    if (!form.question.trim()) { setError("Question is required before validating."); return; }
    if (followups.length === 0) { setError("At least one follow-up is required before validating."); return; }
    setError("");
    setValidating(true);
    try {
      setValidation(await api.validateQuestion(form.topic, form.question, followups, form.code_challenge.trim() || null));
    } catch (e: any) {
      setError(e.message ?? "Validation failed.");
    } finally {
      setValidating(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const followups = form.followups.filter(f => f.trim());
    if (!form.question.trim()) { setError("Question is required."); return; }
    if (followups.length === 0) { setError("At least one follow-up is required."); return; }
    if (!isAdmin) {
      if (!validation) { setError("Run AI validation before saving."); return; }
      if (!validation.approved) { setError("Fix the issues flagged by AI before saving."); return; }
    }
    const payload = {
      topic_number: form.topic_number,
      topic: form.topic.trim(),
      question: form.question.trim(),
      followups,
      code_challenge: form.code_challenge.trim() || null,
    };
    setSaving(true);
    try {
      if (isEdit && id) await api.updateQuestion(id, payload);
      else await api.createQuestion(payload);
      navigate("/admin/questions");
    } catch (err: any) {
      setError(err.message ?? "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-600";

  if (loading) {
    return <div className="p-8 text-center text-gray-400 dark:text-slate-500">Loading question...</div>;
  }

  return (
    <div className="p-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {isEdit ? "Edit Question" : "Add Question"}
          </h1>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-0.5">
            {isEdit ? `Editing ${id}` : "New question — AI review required before saving"}
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-6">
        {/* Topic */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Topic Number</label>
            <select
              value={form.topic_number}
              onChange={e => setTopicNumber(Number(e.target.value))}
              className={inputCls}
            >
              {Array.from({ length: 23 }, (_, i) => i + 1).map(n => (
                <option key={n} value={n}>Topic {n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Topic Name</label>
            <input
              type="text"
              value={form.topic}
              onChange={e => setField("topic", e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        {/* AI Generate */}
        {!isEdit && (
          <button
            type="button"
            onClick={generateWithAI}
            disabled={generating}
            className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors disabled:opacity-60 w-full justify-center"
          >
            {generating ? <Spin /> : <Sparkles className="w-4 h-4" />}
            {generating ? "Generating with AI..." : "Generate Question with AI"}
          </button>
        )}

        {/* Question */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
            Question <span className="text-red-400">*</span>
          </label>
          <textarea
            value={form.question}
            onChange={e => setField("question", e.target.value)}
            rows={3}
            placeholder="Type the exam question..."
            className={inputCls + " resize-none"}
          />
        </div>

        {/* Follow-ups */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
              Follow-up Questions <span className="text-red-400">*</span>
            </label>
            <button
              type="button"
              onClick={addFollowup}
              className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              Add follow-up
            </button>
          </div>
          <div className="space-y-2">
            {form.followups.map((f, i) => (
              <div key={i} className="flex gap-2">
                <span className="mt-2.5 text-xs text-gray-400 dark:text-slate-500 font-mono w-5 text-right flex-shrink-0">{i + 1}.</span>
                <input
                  type="text"
                  value={f}
                  onChange={e => setFollowup(i, e.target.value)}
                  placeholder={`Follow-up question ${i + 1}...`}
                  className={inputCls + " flex-1"}
                />
                {form.followups.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFollowup(i)}
                    className="mt-1 p-1.5 text-gray-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Code challenge */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
            Code Challenge <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={form.code_challenge}
            onChange={e => setField("code_challenge", e.target.value)}
            rows={2}
            placeholder="e.g. Write NASM code to compute factorial(n)..."
            className={inputCls + " resize-none focus:ring-emerald-300 dark:focus:ring-emerald-600"}
          />
        </div>

        {/* AI Validation */}
        {!isAdmin && (
          <div className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300">
                <ShieldCheck className="w-4 h-4 text-indigo-500" />
                AI Quality Review
              </div>
              <span className="text-xs text-gray-400 dark:text-slate-500">Required before saving</span>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900">
              {!validation ? (
                <button
                  type="button"
                  onClick={runValidation}
                  disabled={validating}
                  className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60 w-full justify-center"
                >
                  {validating ? <Spin /> : <ShieldCheck className="w-4 h-4" />}
                  {validating ? "AI is reviewing..." : "Validate with AI"}
                </button>
              ) : validation.approved ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    Question approved by AI
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{validation.reason}</p>
                  <button type="button" onClick={() => setValidation(null)} className="text-xs text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 underline">
                    Re-validate after edits
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    AI rejected this question
                  </div>
                  <p className="text-xs text-gray-600 dark:text-slate-300">{validation.reason}</p>
                  {validation.issues !== "None" && (
                    <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-700 dark:text-red-400">
                      <strong>Issues:</strong> {validation.issues}
                    </div>
                  )}
                  {validation.suggestions !== "None" && (
                    <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-lg px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                      <strong>Suggestions:</strong> {validation.suggestions}
                    </div>
                  )}
                  <button type="button" onClick={() => setValidation(null)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 underline">
                    Edit and re-validate
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <p className="text-red-500 dark:text-red-400 text-sm bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 text-sm font-medium py-2.5 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || (!isAdmin && validation !== null && !validation?.approved)}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Question"}
          </button>
        </div>
      </form>
    </div>
  );
}
