import { useState, useEffect, useCallback } from "react";
import {
  ChevronRight, Eye, Code2, CheckCircle2, Clock, Zap, BookOpen,
  Sparkles, Lightbulb, Brain, Star, TrendingUp, AlertTriangle,
  Mic, MicOff, Volume2, VolumeX, StopCircle, MessageSquare,
  Send, BarChart3, Trophy,
} from "lucide-react";
import type { ExamSession, FullEvaluation } from "../types";
import { api } from "../lib/api";
import { useTTS, useSTT } from "../hooks/useSpeech";
import { useCountdown } from "../hooks/useCountdown";

const PREP_SECONDS = 20 * 60;

interface Props {
  session: ExamSession;
  verbalMode: boolean;
  onDone: (finalScore?: number) => void;
}

const GRADE_COLOR: Record<string, string> = {
  "A+": "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  "A":  "text-green-400 bg-green-500/10 border-green-500/30",
  "B":  "text-blue-400 bg-blue-500/10 border-blue-500/30",
  "C":  "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  "D":  "text-orange-400 bg-orange-500/10 border-orange-500/30",
  "F":  "text-red-400 bg-red-500/10 border-red-500/30",
};

function gradeKey(grade: string) {
  return grade.split(" ")[0].replace(/[()]/g, "").trim();
}

// Which sub-step within a question
type QPhase = "main" | `followup_${number}` | "scoring";

export default function ExamFlow({ session: initialSession, verbalMode, onDone }: Props) {
  const [session, setSession] = useState<ExamSession>(initialSession);
  const [phase, setPhase] = useState<"prep-handout" | "answering" | "complete">(
    initialSession.current_q_index > 0 || initialSession.answers.length > 0 ? "answering" : "prep-handout"
  );
  const [qIdx, setQIdx] = useState(initialSession.current_q_index);
  const [showDirectIntro, setShowDirectIntro] = useState(false);
  const [qPhase, setQPhase] = useState<QPhase>("main");

  // Per question answers (local before sending)
  const [mainAnswer, setMainAnswer] = useState("");
  const [followupAnswers, setFollowupAnswers] = useState<string[]>([]);

  // States
  const [saving, setSaving] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [currentEval, setCurrentEval] = useState<FullEvaluation | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [loadHint, setLoadHint] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [aiError, setAiError] = useState("");
  const [finalResult, setFinalResult] = useState<{ final_score: number; question_scores: any[] } | null>(null);

  const tts = useTTS();
  const stt = useSTT(useCallback((text: string) => {
    if (qPhase === "main") setMainAnswer(p => p ? p + " " + text : text);
    else if (qPhase.startsWith("followup_")) {
      const i = parseInt(qPhase.split("_")[1]);
      setFollowupAnswers(prev => { const a = [...prev]; a[i] = (a[i] ? a[i] + " " + text : text); return a; });
    }
  }, [qPhase]));

  const timer = useCountdown(PREP_SECONDS);

  // Start prep timer automatically when prep-handout is shown
  useEffect(() => {
    if (phase === "prep-handout") timer.start();
  }, [phase]);

  const questions = session.questions;
  const prepCount = session.prep_count;
  const current = questions[qIdx];
  const followups = current?.followups ?? [];
  const isPrep = qIdx < prepCount;

  // Resume: load existing answers for current question
  useEffect(() => {
    const existing = session.answers[qIdx];
    if (existing) {
      if (existing.evaluation) {
        setCurrentEval(existing.evaluation);
        setQPhase("scoring");
      } else {
        setMainAnswer(existing.main_answer ?? "");
        setFollowupAnswers(existing.followup_answers.map(a => a ?? ""));
        const answered = existing.followup_answers.filter(Boolean).length;
        if (existing.main_answer && answered < followups.length) {
          setQPhase(`followup_${answered}`);
        } else if (existing.main_answer && answered >= followups.length) {
          setQPhase("scoring");
        } else {
          setQPhase("main");
        }
      }
    } else {
      setMainAnswer("");
      setFollowupAnswers([]);
      setQPhase("main");
      setCurrentEval(null);
      setHint(null);
      setShowCode(false);
      setAiError("");
    }
  }, [qIdx]);

  function speakText(text: string) {
    if (!verbalMode) return;
    tts.speak(text);
  }

  useEffect(() => {
    if (phase === "answering" && verbalMode && current && qPhase === "main") {
      tts.speak(`${current.topic}. Question: ${current.question}`);
    }
  }, [qIdx, phase, qPhase]);

  // ── Submit main answer ────────────────────────────────────────────────────
  async function submitMain() {
    if (!mainAnswer.trim()) return;
    setSaving(true);
    setAiError("");
    try {
      await api.saveAnswer(session.session_id, qIdx, "main", mainAnswer.trim());
      // Move to first follow-up
      if (followups.length > 0) {
        setQPhase("followup_0");
        if (verbalMode) speakText(`Follow-up 1: ${followups[0]}`);
      } else {
        // No follow-ups — go straight to scoring
        await evaluateQuestion();
      }
    } catch (e: any) {
      setAiError(e.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  // ── Submit a follow-up answer ─────────────────────────────────────────────
  async function submitFollowup(followupIdx: number) {
    const ans = followupAnswers[followupIdx] ?? "";
    setSaving(true);
    setAiError("");
    try {
      await api.saveAnswer(session.session_id, qIdx, "followup", ans.trim() || "(skipped)", followupIdx);
      const nextIdx = followupIdx + 1;
      if (nextIdx < followups.length) {
        setQPhase(`followup_${nextIdx}`);
        if (verbalMode) speakText(`Follow-up ${nextIdx + 1}: ${followups[nextIdx]}`);
      } else {
        // All follow-ups answered — evaluate
        await evaluateQuestion();
      }
    } catch (e: any) {
      setAiError(e.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  // ── Evaluate entire question block ────────────────────────────────────────
  async function evaluateQuestion() {
    setEvaluating(true);
    setQPhase("scoring");
    setAiError("");
    try {
      const result = await api.evaluateQuestion(session.session_id, qIdx);
      setCurrentEval(result.evaluation);
      setSession(prev => ({
        ...prev,
        current_q_index: result.current_q_index,
        answers: (() => {
          const a = [...prev.answers];
          while (a.length <= qIdx) a.push({ q_index: a.length, main_answer: null, followup_answers: [], evaluation: null, overall_score: null });
          a[qIdx] = { ...a[qIdx], evaluation: result.evaluation, overall_score: result.overall_score };
          return a;
        })(),
      }));
      if (verbalMode) speakText(`Score: ${result.overall_score} out of 100. Grade: ${gradeKey(result.evaluation.grade)}. ${result.evaluation.strengths}`);
    } catch (e: any) {
      setAiError(e.message ?? "Evaluation failed");
      setQPhase(followups.length > 0 ? `followup_${followups.length - 1}` : "main");
    } finally {
      setEvaluating(false);
    }
  }

  async function runHint() {
    setLoadHint(true);
    setAiError("");
    try {
      const { hint: h } = await api.getHint(current.question, current.topic);
      setHint(h);
      speakText(h);
    } catch (e: any) {
      setAiError(e.message ?? "Hint failed");
    } finally {
      setLoadHint(false);
    }
  }

  // ── Next question ─────────────────────────────────────────────────────────
  async function nextQuestion() {
    const next = qIdx + 1;
    if (next >= questions.length) {
      // Complete
      try {
        const result = await api.completeSession(session.session_id);
        setFinalResult(result);
      } catch (_) {}
      timer.stop();
      setPhase("complete");
      return;
    }
    if (next === prepCount) {
      timer.stop();
      setShowDirectIntro(true);
    }
    setQIdx(next);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE: Prep Handout
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === "prep-handout") {
    return (
      <Screen>
        <Header isPrep timer={null} verbalMode={verbalMode} tts={tts} qIdx={0} total={questions.length} />
        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-2xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-amber-400 text-sm font-semibold uppercase tracking-wide">Preparation — 20 minutes to read</span>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-mono font-bold
                ${timer.urgency === "critical" ? "text-red-400 border-red-500/40 bg-red-500/10 animate-pulse" :
                  timer.urgency === "warning" ? "text-amber-400 border-amber-500/40 bg-amber-500/10" :
                  "text-slate-300 border-slate-600 bg-slate-800"}`}>
                <Clock className="w-3.5 h-3.5" />
                {String(timer.minutes).padStart(2, "0")}:{String(timer.seconds).padStart(2, "0")}
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-1">Your preparation questions</h2>
            <p className="text-slate-400 text-sm mb-8">
              Read and study these {prepCount} question{prepCount !== 1 ? "s" : ""} during your prep time. When ready, click below to start answering — no timer during answers.
            </p>
            <div className="space-y-4">
              {questions.slice(0, prepCount).map((q, i) => (
                <div key={q.id} className="bg-slate-900 border border-slate-700 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    <div>
                      <div className="text-xs text-indigo-400 font-medium mb-1">{q.topic}</div>
                      <p className="text-white leading-relaxed">{q.question}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => { timer.stop(); setPhase("answering"); if (verbalMode) speakText(questions[0].question); }}
              className="mt-8 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-all"
            >
              <Clock className="w-4 h-4" />
              I'm ready — Start 20-minute timer
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Screen>
    );
  }

  if (showDirectIntro) {
    return (
      <Screen>
        <Header isPrep={false} timer={null} verbalMode={verbalMode} tts={tts} qIdx={qIdx} total={questions.length} />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
              <Zap className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Direct Questions</h2>
            <p className="text-slate-400 text-sm mb-8">
              {questions.length - prepCount} more question{questions.length - prepCount !== 1 ? "s" : ""} — no prep time. Answer + follow-ups, then see your score.
            </p>
            <button
              onClick={() => { setShowDirectIntro(false); if (verbalMode) speakText(questions[qIdx].question); }}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold px-8 py-3 rounded-xl mx-auto transition-all"
            >
              Begin Direct Questions <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Screen>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE: Complete
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === "complete") {
    const scores = session.answers.map(a => a.overall_score ?? 0);
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const displayScore = finalResult?.final_score != null ? Math.round(finalResult.final_score) : avg;
    const scoreColor = displayScore >= 85 ? "text-emerald-400" : displayScore >= 70 ? "text-green-400" : displayScore >= 55 ? "text-blue-400" : displayScore >= 40 ? "text-yellow-400" : "text-red-400";

    return (
      <Screen>
        <Header isPrep={false} timer={null} verbalMode={verbalMode} tts={tts} qIdx={questions.length} total={questions.length} />
        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-xl">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold mb-1">Exam Complete</h2>
              <div className={`text-6xl font-black mt-4 ${scoreColor}`}>{displayScore}<span className="text-2xl text-slate-500">/100</span></div>
              <div className="text-slate-400 text-sm mt-2">Overall Average Score</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-6">
              <div className="px-5 py-3 border-b border-slate-800 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-semibold text-slate-300">Question Breakdown</span>
              </div>
              <div className="divide-y divide-slate-800/50">
                {session.answers.map((ans, i) => {
                  const q = questions[i];
                  if (!q) return null;
                  const s = ans.overall_score ?? 0;
                  const bar = s >= 85 ? "bg-emerald-500" : s >= 70 ? "bg-green-500" : s >= 55 ? "bg-blue-500" : s >= 40 ? "bg-yellow-500" : "bg-red-500";
                  return (
                    <div key={i} className="px-5 py-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-slate-400 truncate flex-1 mr-4">{q.topic.split("–")[1]?.trim() ?? q.topic}</span>
                        <span className="text-sm font-bold text-white flex-shrink-0">{s}/100</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full">
                        <div className={`h-1.5 rounded-full transition-all ${bar}`} style={{ width: `${s}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => onDone(displayScore)} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-all">
                Start New Exam
              </button>
              <button onClick={() => window.location.href = "/history"} className="flex-1 border border-slate-700 text-slate-300 hover:bg-slate-800 font-semibold py-3 rounded-xl transition-all">
                View History
              </button>
            </div>
          </div>
        </div>
      </Screen>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE: Active question
  // ─────────────────────────────────────────────────────────────────────────
  if (!current) return null;

  const currentFollowupIdx = qPhase.startsWith("followup_") ? parseInt(qPhase.split("_")[1]) : -1;
  const activeFollowupAnswer = currentFollowupIdx >= 0 ? (followupAnswers[currentFollowupIdx] ?? "") : "";

  const currentAnswer = qPhase === "main" ? mainAnswer : activeFollowupAnswer;
  const setCurrentAnswer = (val: string) => {
    if (qPhase === "main") {
      setMainAnswer(val);
    } else if (currentFollowupIdx >= 0) {
      setFollowupAnswers(prev => { const a = [...prev]; a[currentFollowupIdx] = val; return a; });
    }
  };

  const isScoring = qPhase === "scoring";

  return (
    <Screen>
      <Header isPrep={isPrep} timer={null} verbalMode={verbalMode} tts={tts} qIdx={qIdx} total={questions.length} />

      <div className="h-0.5 bg-slate-800">
        <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${(qIdx / questions.length) * 100}%` }} />
      </div>

      <main className="flex-1 flex justify-center px-3 sm:px-4 py-4 sm:py-6 overflow-y-auto">
        <div className="w-full max-w-2xl space-y-4 sm:space-y-5">

          {/* Meta */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${isPrep ? "bg-amber-500/15 text-amber-400 border border-amber-500/25" : "bg-red-500/15 text-red-400 border border-red-500/25"}`}>
                {isPrep ? "Preparation" : "Direct"}
              </span>
              <span className="text-slate-500 text-xs">Q {qIdx + 1}/{questions.length}</span>
            </div>
            <span className="text-slate-600 text-xs font-mono">{current.id}</span>
          </div>

          {/* Topic */}
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-indigo-400 text-xs font-medium">{current.topic}</span>
          </div>

          {/* Progress within question */}
          <div className="overflow-x-auto pb-1">
            <div className="flex items-center gap-1.5 min-w-max">
              {["Main", ...followups.map((_, i) => `FU${i + 1}`)].map((label, i) => {
                const stepPhase: QPhase = i === 0 ? "main" : `followup_${i - 1}`;
                const isDone = (i === 0 && qPhase !== "main") || (i > 0 && (qPhase === "scoring" || (qPhase.startsWith("followup_") && parseInt(qPhase.split("_")[1]) > i - 1)));
                const isCurrent = stepPhase === qPhase || (isScoring && i === followups.length);
                return (
                  <div key={i} className="flex items-center gap-1">
                    {i > 0 && <div className={`h-px w-3 ${isDone ? "bg-indigo-500" : "bg-slate-700"}`} />}
                    <div title={i === 0 ? "Main Question" : `Follow-up ${i}`} className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${isDone ? "bg-indigo-600 text-white" : isCurrent ? "bg-slate-700 border border-indigo-500 text-indigo-400" : "bg-slate-800 text-slate-600"}`}>
                      {isDone ? <CheckCircle2 className="w-3 h-3" /> : i + 1}
                    </div>
                  </div>
                );
              })}
              {followups.length > 0 && (
                <>
                  <div className={`h-px w-3 ${isScoring ? "bg-indigo-500" : "bg-slate-700"}`} />
                  <div title="Score" className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isScoring ? "bg-green-600" : "bg-slate-800"}`}>
                    <Star className="w-3 h-3 text-white" />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Main question card */}
          <div className={`bg-slate-900 border rounded-2xl p-4 sm:p-6 ${qPhase !== "main" ? "border-slate-700/50 opacity-80" : "border-slate-700"}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="text-xs text-slate-500 font-semibold mb-2 uppercase tracking-wide">Main Question</div>
                <p className="text-lg text-white leading-relaxed font-medium">{current.question}</p>
              </div>
              {verbalMode && (
                <button onClick={() => tts.speaking ? tts.stop() : speakText(current.question)}
                  className={`flex-shrink-0 p-2 rounded-lg transition-colors ${tts.speaking ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-400 hover:text-violet-400"}`}>
                  {tts.speaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              )}
            </div>
            {qPhase !== "main" && (
              <div className="mt-3 pt-3 border-t border-slate-800">
                <div className="text-xs text-slate-500 mb-1">Your answer:</div>
                <p className="text-slate-300 text-sm">{mainAnswer}</p>
              </div>
            )}
          </div>

          {/* Hint (only on main question) */}
          {qPhase === "main" && (
            hint ? (
              <div className="bg-amber-950/30 border border-amber-500/25 rounded-xl p-4 flex gap-3">
                <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-amber-200 text-sm leading-relaxed">{hint}</p>
              </div>
            ) : (
              <button onClick={runHint} disabled={loadHint} className="flex items-center gap-2 text-xs text-amber-400 hover:text-amber-300 disabled:opacity-50 transition-colors">
                {loadHint ? <Spin /> : <Lightbulb className="w-3.5 h-3.5" />}
                {loadHint ? "Getting hint..." : "Get AI hint"}
              </button>
            )
          )}

          {/* Follow-up cards (answered ones shown, current one active) */}
          {followups.map((fq, i) => {
            const thisPhase: QPhase = `followup_${i}`;
            const isAnswered = isScoring || (qPhase.startsWith("followup_") && parseInt(qPhase.split("_")[1]) > i);
            const isCurrent = qPhase === thisPhase;
            const isFuture = !isAnswered && !isCurrent;

            if (isFuture) return null;

            return (
              <div key={i} className={`border rounded-2xl p-5 transition-all ${isCurrent ? "border-violet-500/40 bg-violet-950/20" : "border-slate-700/50 bg-slate-800/30"}`}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="text-xs text-violet-400 font-semibold mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                      <Brain className="w-3 h-3" /> Follow-up {i + 1}
                    </div>
                    <p className="text-slate-200 text-sm leading-relaxed">{fq}</p>
                  </div>
                  {verbalMode && isCurrent && (
                    <button onClick={() => speakText(fq)} className="p-1.5 text-slate-500 hover:text-violet-400">
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {isAnswered && (
                  <div className="pt-3 border-t border-slate-700/50">
                    <div className="text-xs text-slate-500 mb-1">Your answer:</div>
                    <p className="text-slate-300 text-sm">{followupAnswers[i] || "(skipped)"}</p>
                  </div>
                )}
              </div>
            );
          })}

          {/* Score card — shown after all follow-ups */}
          {isScoring && currentEval && (
            <ScoreCard eval={currentEval} verbalMode={verbalMode} tts={tts} />
          )}

          {/* Evaluating spinner */}
          {evaluating && (
            <div className="flex items-center justify-center gap-3 py-8 text-slate-400">
              <Spin />
              <span className="text-sm">AI is evaluating all your answers...</span>
            </div>
          )}

          {/* Input area — hidden when scoring */}
          {!isScoring && !evaluating && (
            <AnswerInput
              value={currentAnswer}
              onChange={setCurrentAnswer}
              verbalMode={verbalMode}
              stt={stt}
              label={qPhase === "main" ? "Your answer to the main question" : `Your answer to follow-up ${currentFollowupIdx + 1}`}
            />
          )}

          {aiError && (
            <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{aiError}</p>
          )}

          {/* Action buttons */}
          {!evaluating && (
            <div className="flex gap-3 pb-6">
              {qPhase === "main" && (
                <button
                  onClick={submitMain}
                  disabled={saving || !mainAnswer.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold py-3 rounded-xl transition-all"
                >
                  {saving ? <Spin /> : <Send className="w-4 h-4" />}
                  {saving ? "Saving..." : "Submit Answer"}
                </button>
              )}

              {qPhase.startsWith("followup_") && (
                <button
                  onClick={() => submitFollowup(currentFollowupIdx)}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-violet-700 hover:bg-violet-600 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold py-3 rounded-xl transition-all"
                >
                  {saving ? <Spin /> : <Send className="w-4 h-4" />}
                  {saving ? "Saving..." : currentFollowupIdx < followups.length - 1 ? `Next Follow-up →` : "Submit & Get Score"}
                </button>
              )}

              {isScoring && !currentEval && !evaluating && (
                <button onClick={evaluateQuestion} className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-all">
                  <Sparkles className="w-4 h-4" /> Get AI Score
                </button>
              )}

              {isScoring && currentEval && (
                <>
                  {current.code_challenge && !showCode && (
                    <button onClick={() => { setShowCode(true); speakText("Code challenge: " + current.code_challenge!); }}
                      className="flex-1 flex items-center justify-center gap-2 bg-emerald-900/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-sm font-medium py-3 rounded-xl transition-all">
                      <Code2 className="w-4 h-4" /> Code Challenge
                    </button>
                  )}
                  {(!current.code_challenge || showCode) && (
                    <button onClick={nextQuestion} className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-all">
                      {qIdx >= questions.length - 1 ? "Finish Exam" : "Next Question"}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* Code challenge (shown after scoring) */}
          {showCode && current.code_challenge && (
            <div className="bg-slate-800 border border-emerald-500/30 rounded-xl p-5 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Code2 className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wide">Code Challenge</span>
              </div>
              <p className="text-slate-200 text-sm leading-relaxed">{current.code_challenge}</p>
              <button onClick={nextQuestion} className="mt-4 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-all">
                {qIdx >= questions.length - 1 ? "Finish Exam" : "Next Question"}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </main>
    </Screen>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function AnswerInput({ value, onChange, verbalMode, stt, label }: {
  value: string; onChange: (v: string) => void;
  verbalMode: boolean; stt: ReturnType<typeof useSTT>; label: string;
}) {
  const busy = stt.recording || stt.transcribing;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-slate-400">{label}</label>
        {value && <span className="text-xs text-slate-600">{value.split(/\s+/).filter(Boolean).length} words</span>}
      </div>
      <div className="relative">
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={5}
          placeholder={verbalMode ? "Hold mic to record, or type..." : "Type your answer..."}
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none transition-colors pr-12"
        />
        {verbalMode && (
          <button
            onClick={stt.recording ? stt.stop : stt.start}
            disabled={!stt.supported || stt.transcribing}
            title={!stt.supported ? "Mic not supported" : stt.recording ? "Stop recording" : "Start recording"}
            className={`absolute right-3 bottom-3 p-2 rounded-lg transition-all ${
              stt.recording
                ? "bg-red-600 text-white animate-pulse"
                : stt.transcribing
                ? "bg-amber-600 text-white"
                : stt.supported
                ? "bg-violet-600 hover:bg-violet-500 text-white"
                : "bg-slate-700 text-slate-500 cursor-not-allowed"
            }`}
          >
            {stt.recording ? <StopCircle className="w-4 h-4" /> : stt.transcribing ? <Spin /> : <Mic className="w-4 h-4" />}
          </button>
        )}
      </div>
      {stt.recording && (
        <p className="text-xs text-red-400 mt-1 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse inline-block" />
          Recording... click mic to stop
        </p>
      )}
      {stt.transcribing && (
        <p className="text-xs text-amber-400 mt-1 flex items-center gap-1.5">
          <Spin /> Transcribing with Gemini...
        </p>
      )}
      {stt.error && !busy && (
        <p className="text-xs text-orange-400 mt-1">{stt.error}</p>
      )}
    </div>
  );
}

function ScoreCard({ eval: e, verbalMode, tts }: { eval: FullEvaluation; verbalMode: boolean; tts: ReturnType<typeof useTTS> }) {
  const gk = gradeKey(e.grade);
  const gradeClass = GRADE_COLOR[gk] ?? "text-slate-400 bg-slate-500/10 border-slate-500/30";
  const s = e.overall_score;
  const scoreColor = s >= 85 ? "text-emerald-400" : s >= 70 ? "text-green-400" : s >= 55 ? "text-blue-400" : s >= 40 ? "text-yellow-400" : "text-red-400";
  const barColor = s >= 85 ? "bg-emerald-500" : s >= 70 ? "bg-green-500" : s >= 55 ? "bg-blue-500" : s >= 40 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">Question Score</span>
          {verbalMode && (
            <button onClick={() => tts.speak(`Score ${s} out of 100. ${e.strengths}. ${e.improvement_tips}`)}
              className="p-1 text-slate-500 hover:text-indigo-400"><Volume2 className="w-3.5 h-3.5" /></button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className={`text-3xl font-black ${scoreColor}`}>{s}</span>
            <span className="text-slate-600 text-sm">/100</span>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${gradeClass}`}>{gk}</span>
        </div>
      </div>

      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-2 rounded-full transition-all duration-1000 ${barColor}`} style={{ width: `${s}%` }} />
      </div>

      {/* Per-item breakdown */}
      {e.items && e.items.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Per-question breakdown</div>
          {e.items.map((item, i) => {
            const ic = item.score >= 85 ? "text-emerald-400" : item.score >= 70 ? "text-green-400" : item.score >= 55 ? "text-blue-400" : "text-red-400";
            return (
              <div key={i} className="flex items-start gap-3 bg-slate-800/40 rounded-lg px-3 py-2">
                <span className={`text-sm font-bold flex-shrink-0 ${ic}`}>{item.score}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-500 font-medium">{item.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{item.feedback}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <EvalRow icon={<TrendingUp className="w-4 h-4 text-green-400" />} label="Strengths" labelClass="text-green-400">{e.strengths}</EvalRow>
      {e.gaps && e.gaps !== "None" && (
        <EvalRow icon={<AlertTriangle className="w-4 h-4 text-orange-400" />} label="Gaps" labelClass="text-orange-400">{e.gaps}</EvalRow>
      )}
      <EvalRow icon={<Star className="w-4 h-4 text-indigo-400" />} label="Model Answer" labelClass="text-indigo-400">{e.model_answer}</EvalRow>
      {e.improvement_tips && (
        <EvalRow icon={<MessageSquare className="w-4 h-4 text-sky-400" />} label="Tips" labelClass="text-sky-400">{e.improvement_tips}</EvalRow>
      )}
    </div>
  );
}

function EvalRow({ icon, label, labelClass, children }: { icon: React.ReactNode; label: string; labelClass: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div>
        <div className={`text-xs font-semibold mb-0.5 ${labelClass}`}>{label}</div>
        <p className="text-slate-300 text-sm leading-relaxed">{children as string}</p>
      </div>
    </div>
  );
}

function Header({ isPrep, timer, verbalMode, tts, qIdx, total }: {
  isPrep: boolean; timer: ReturnType<typeof useCountdown> | null;
  verbalMode: boolean; tts: ReturnType<typeof useTTS>; qIdx: number; total: number;
}) {
  return (
    <header className="border-b border-slate-800 px-3 sm:px-5 py-3 flex items-center justify-between flex-shrink-0 gap-2">
      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold ${isPrep ? "text-amber-400" : "text-red-400"}`}>{isPrep ? "Preparation" : "Direct"}</span>
        <span className="text-slate-700">·</span>
        <span className="text-slate-500 text-xs">{qIdx}/{total} questions</span>
      </div>
      <div className="flex items-center gap-3">
        {timer && (
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono font-semibold
            ${timer.urgency === "critical" ? "text-red-400 border-red-500/40 bg-red-500/10 animate-pulse" :
              timer.urgency === "warning" ? "text-amber-400 border-amber-500/40 bg-amber-500/10" :
              "text-slate-300 border-slate-600 bg-slate-800"}`}>
            <Clock className="w-3 h-3" />
            {String(timer.minutes).padStart(2, "0")}:{String(timer.seconds).padStart(2, "0")}
          </div>
        )}
        {verbalMode && (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-xs text-violet-400 font-medium">Verbal</span>
            <button onClick={tts.speaking ? tts.stop : undefined} className={`p-1 rounded ${tts.speaking ? "text-violet-300" : "text-slate-600"}`}>
              {tts.speaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-slate-950 text-white flex flex-col">{children}</div>;
}

function Spin() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}
