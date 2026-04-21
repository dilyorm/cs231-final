import { useState, useEffect, useCallback } from "react";
import {
  ChevronRight, Eye, Code2, CheckCircle2, AlertCircle,
  Clock, Zap, BookOpen, Sparkles, Lightbulb, Brain,
  Star, TrendingUp, AlertTriangle, Mic, MicOff,
  Volume2, VolumeX, StopCircle, MessageSquare,
} from "lucide-react";
import type { ExamSession, Question, AIEvaluation } from "../types";
import { api } from "../lib/api";
import { useTTS, useSTT } from "../hooks/useSpeech";
import { useCountdown } from "../hooks/useCountdown";

const PREP_SECONDS = 20 * 60; // 20 minutes

interface Props {
  session: ExamSession;
  verbalMode: boolean;
  onDone: () => void;
}

interface QState {
  question: Question;
  isPrep: boolean;
  index: number;
  total: number;
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
  const g = grade.split(" ")[0].replace(/[()]/g, "").trim();
  return g;
}

export default function ExamFlow({ session, verbalMode, onDone }: Props) {
  const allQ: QState[] = [
    ...session.prep_questions.map((q, i) => ({ question: q, isPrep: true,  index: i, total: session.prep_questions.length })),
    ...session.direct_questions.map((q, i) => ({ question: q, isPrep: false, index: i, total: session.direct_questions.length })),
  ];

  const [phase, setPhase]   = useState<"prep-handout" | "answering" | "complete">("prep-handout");
  const [qIdx,  setQIdx]    = useState(0);
  const [showDirectIntro, setShowDirectIntro] = useState(false);

  // Per-question state
  const [answer,        setAnswer]        = useState("");
  const [evaluation,    setEvaluation]    = useState<AIEvaluation | null>(null);
  const [hint,          setHint]          = useState<string | null>(null);
  const [aiFollowups,   setAiFollowups]   = useState<string[] | null>(null);
  const [shownFollowup, setShownFollowup] = useState(-1); // index of last revealed followup
  const [showCode,      setShowCode]      = useState(false);

  // Loading states
  const [loadEval,    setLoadEval]    = useState(false);
  const [loadHint,    setLoadHint]    = useState(false);
  const [loadFollows, setLoadFollows] = useState(false);
  const [aiError,     setAiError]     = useState("");

  // Speech
  const tts = useTTS();
  const stt = useSTT(useCallback((text: string) => {
    setAnswer((prev) => (prev ? prev + " " + text : text));
  }, []));

  // Timer — starts when prep handout is shown, covers all prep answering
  const timer = useCountdown(PREP_SECONDS);

  const current  = allQ[qIdx];
  const followups = aiFollowups ?? current?.question.followups ?? [];
  const allFollowupsDone = shownFollowup >= followups.length - 1;

  // ── Speak helpers ──────────────────────────────────────────────────────────
  function speakQuestion(q: Question) {
    if (!verbalMode) return;
    tts.speak(`${q.topic}. Question: ${q.question}`);
  }

  function speakText(text: string) {
    if (!verbalMode) return;
    tts.speak(text);
  }

  // Auto-speak when question changes in verbal mode
  useEffect(() => {
    if (phase === "answering" && verbalMode && current) {
      speakQuestion(current.question);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIdx, phase]);

  // ── Reset per-question state ───────────────────────────────────────────────
  function resetQ() {
    setAnswer("");
    setEvaluation(null);
    setHint(null);
    setAiFollowups(null);
    setShownFollowup(-1);
    setShowCode(false);
    setAiError("");
    tts.stop();
    if (stt.listening) stt.stop();
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  function nextQuestion() {
    resetQ();
    const next = qIdx + 1;
    if (next >= allQ.length) { timer.stop(); setPhase("complete"); return; }
    if (next === session.prep_questions.length) {
      timer.stop();
      setShowDirectIntro(true);
    }
    setQIdx(next);
  }

  // ── AI calls ──────────────────────────────────────────────────────────────
  async function runEvaluate() {
    if (!answer.trim()) return;
    setLoadEval(true);
    setAiError("");
    setEvaluation(null);
    setAiFollowups(null);
    setShownFollowup(-1);
    try {
      const [evalResult, followResult] = await Promise.all([
        api.evaluateAnswer(current.question.question, answer, current.question.topic),
        api.getDynamicFollowups(current.question.question, answer, current.question.topic),
      ]);
      setEvaluation(evalResult);
      setAiFollowups(followResult.followups);

      if (verbalMode) {
        const summary = `Score: ${evalResult.score} out of 100. Grade: ${evalResult.grade.split("(")[0].trim()}. ${evalResult.strengths}`;
        tts.speak(summary);
      }
    } catch (e: any) {
      setAiError(e.message ?? "AI evaluation failed.");
    } finally {
      setLoadEval(false);
    }
  }

  async function runHint() {
    setLoadHint(true);
    setAiError("");
    try {
      const { hint: h } = await api.getHint(current.question.question, current.question.topic);
      setHint(h);
      speakText(h);
    } catch (e: any) {
      setAiError(e.message ?? "Hint failed.");
    } finally {
      setLoadHint(false);
    }
  }

  function revealFollowup() {
    const nextIdx = shownFollowup + 1;
    setShownFollowup(nextIdx);
    if (verbalMode && followups[nextIdx]) {
      tts.speak(`Follow-up question ${nextIdx + 1}: ${followups[nextIdx]}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE: Prep Handout
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === "prep-handout") {
    return (
      <Screen>
        <Header name={session.student_name} phase="prep" verbalMode={verbalMode} timer={null} tts={tts} />
        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-2xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-amber-400 text-sm font-semibold uppercase tracking-wide">Preparation Time — 20 minutes</span>
            </div>
            <h2 className="text-2xl font-bold mb-1">Your preparation questions</h2>
            <p className="text-slate-400 text-sm mb-8">
              Study these 2 questions. Timer starts when you click "I'm ready". You'll answer them with AI evaluation.
            </p>

            <div className="space-y-4">
              {session.prep_questions.map((q, i) => (
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
              onClick={() => { setPhase("answering"); timer.start(); if (verbalMode) speakQuestion(session.prep_questions[0]); }}
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

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE: Direct intro
  // ─────────────────────────────────────────────────────────────────────────
  if (showDirectIntro) {
    return (
      <Screen>
        <Header name={session.student_name} phase="direct" verbalMode={verbalMode} timer={null} tts={tts} />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
              <Zap className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Direct Questions</h2>
            <p className="text-slate-400 text-sm mb-8">
              Next {session.direct_questions.length} questions — no preparation time. AI evaluation and dynamic follow-ups available.
            </p>
            <button
              onClick={() => { setShowDirectIntro(false); if (verbalMode) speakQuestion(current.question); }}
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
    return (
      <Screen>
        <Header name={session.student_name} phase="done" verbalMode={verbalMode} timer={null} tts={tts} />
        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Exam Complete</h2>
            <p className="text-slate-400 text-sm mb-8">Well done, {session.student_name}.</p>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-left mb-6">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Topics covered</h3>
              <div className="space-y-2">
                {allQ.map(({ question, isPrep }, i) => (
                  <div key={question.id} className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${isPrep ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"}`}>{i + 1}</span>
                    <span className="text-slate-300 text-xs">{question.topic}</span>
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${isPrep ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-400"}`}>{isPrep ? "prep" : "direct"}</span>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={onDone} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-all">
              Start New Session
            </button>
          </div>
        </div>
      </Screen>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE: Active question
  // ─────────────────────────────────────────────────────────────────────────
  const { question, isPrep, index, total } = current;

  return (
    <Screen>
      <Header
        name={session.student_name}
        phase={isPrep ? "prep" : "direct"}
        verbalMode={verbalMode}
        timer={isPrep ? timer : null}
        tts={tts}
      />

      {/* Progress bar */}
      <div className="h-0.5 bg-slate-800">
        <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${(qIdx / allQ.length) * 100}%` }} />
      </div>

      {/* Timer expired banner */}
      {isPrep && timer.expired && (
        <div className="bg-red-600 text-white text-xs text-center py-1.5 font-semibold">
          ⏰ Time's up! Finish your current answer and move on.
        </div>
      )}

      <main className="flex-1 flex justify-center px-4 py-6 overflow-y-auto">
        <div className="w-full max-w-2xl space-y-5">

          {/* Meta row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${isPrep ? "bg-amber-500/15 text-amber-400 border border-amber-500/25" : "bg-red-500/15 text-red-400 border border-red-500/25"}`}>
                {isPrep ? "Preparation" : "Direct"}
              </span>
              <span className="text-slate-500 text-xs">Q {index + 1}/{total}</span>
            </div>
            <span className="text-slate-600 text-xs font-mono">{question.id}</span>
          </div>

          {/* Topic */}
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-indigo-400 text-xs font-medium">{question.topic}</span>
          </div>

          {/* Question card */}
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <p className="text-lg text-white leading-relaxed font-medium flex-1">{question.question}</p>
              {verbalMode && (
                <button
                  onClick={() => tts.speaking ? tts.stop() : speakQuestion(question)}
                  className={`flex-shrink-0 p-2 rounded-lg transition-colors ${tts.speaking ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-400 hover:text-violet-400"}`}
                  title={tts.speaking ? "Stop speaking" : "Read question aloud"}
                >
                  {tts.speaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>

          {/* Hint */}
          {hint && (
            <div className="bg-amber-950/30 border border-amber-500/25 rounded-xl p-4 flex gap-3">
              <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-amber-200 text-sm leading-relaxed">{hint}</p>
            </div>
          )}
          {!hint && (
            <button onClick={runHint} disabled={loadHint} className="flex items-center gap-2 text-xs text-amber-400 hover:text-amber-300 disabled:opacity-50 transition-colors">
              {loadHint ? <Spin /> : <Lightbulb className="w-3.5 h-3.5" />}
              {loadHint ? "Getting AI hint..." : "Get AI hint"}
            </button>
          )}

          {/* Answer input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-400">
                Your answer
                {verbalMode && <span className="text-violet-400 ml-1">(use mic or type)</span>}
              </label>
              {answer && (
                <span className="text-xs text-slate-600">{answer.split(/\s+/).filter(Boolean).length} words</span>
              )}
            </div>
            <div className="relative">
              <textarea
                value={answer}
                onChange={(e) => { setAnswer(e.target.value); setEvaluation(null); setAiFollowups(null); setShownFollowup(-1); }}
                rows={5}
                placeholder={verbalMode ? "Click the mic button to speak, or type here..." : "Type your answer here, then click Evaluate with AI..."}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none transition-colors pr-12"
              />
              {verbalMode && (
                <button
                  onClick={stt.listening ? stt.stop : stt.start}
                  disabled={!stt.supported}
                  className={`absolute right-3 bottom-3 p-2 rounded-lg transition-all ${
                    stt.listening
                      ? "bg-red-600 text-white animate-pulse"
                      : stt.supported
                        ? "bg-violet-600 hover:bg-violet-500 text-white"
                        : "bg-slate-700 text-slate-500 cursor-not-allowed"
                  }`}
                  title={stt.supported ? (stt.listening ? "Stop recording" : "Start recording") : "Speech recognition not supported"}
                >
                  {stt.listening ? <StopCircle className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}
            </div>
            {stt.listening && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse inline-block" />
                Listening... speak clearly
              </p>
            )}
            {!stt.supported && verbalMode && (
              <p className="text-xs text-slate-600 mt-1">Speech recognition requires Chrome or Edge.</p>
            )}
          </div>

          {/* Evaluate button */}
          <button
            onClick={runEvaluate}
            disabled={!answer.trim() || loadEval}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold py-3 rounded-xl transition-all"
          >
            {loadEval ? <Spin /> : <Sparkles className="w-4 h-4" />}
            {loadEval ? "Evaluating answer + generating follow-ups..." : "Evaluate with AI"}
          </button>

          {aiError && (
            <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{aiError}</p>
          )}

          {/* Evaluation card */}
          {evaluation && <EvalCard eval={evaluation} verbalMode={verbalMode} tts={tts} />}

          {/* AI-generated dynamic follow-ups */}
          {aiFollowups && aiFollowups.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                <Brain className="w-3.5 h-3.5 text-violet-400" />
                AI Follow-up questions (based on your answer)
              </h3>

              {aiFollowups.slice(0, shownFollowup + 1).map((fq, i) => (
                <div key={i} className={`border rounded-xl p-4 transition-all ${i === shownFollowup ? "border-violet-500/40 bg-violet-950/20" : "border-slate-700/50 bg-slate-800/40"}`}>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-violet-800/60 text-violet-300 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    <div className="flex-1">
                      <p className="text-slate-200 text-sm leading-relaxed">{fq}</p>
                    </div>
                    {verbalMode && i === shownFollowup && (
                      <button onClick={() => speakText(fq)} className="p-1.5 text-slate-500 hover:text-violet-400 flex-shrink-0">
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Reveal next follow-up */}
              {shownFollowup < aiFollowups.length - 1 && (
                <button
                  onClick={revealFollowup}
                  className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-sm font-medium py-2.5 rounded-xl transition-all"
                >
                  <Eye className="w-4 h-4 text-violet-400" />
                  {shownFollowup === -1 ? "Reveal Follow-up Question 1" : `Reveal Follow-up ${shownFollowup + 2}`}
                </button>
              )}
              {shownFollowup === -1 && (
                <button
                  onClick={revealFollowup}
                  className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-sm font-medium py-2.5 rounded-xl transition-all"
                >
                  <Eye className="w-4 h-4 text-violet-400" />
                  Reveal Follow-up Question 1
                </button>
              )}
            </div>
          )}

          {/* Code challenge */}
          {showCode && question.code_challenge && (
            <div className="bg-slate-800 border border-emerald-500/30 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wide">Code Challenge</span>
                </div>
                {verbalMode && (
                  <button onClick={() => speakText(question.code_challenge!)} className="p-1.5 text-slate-500 hover:text-emerald-400">
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-slate-200 text-sm leading-relaxed">{question.code_challenge}</p>
            </div>
          )}

          {/* Bottom nav */}
          <div className="flex gap-3 pb-6">
            {evaluation && allFollowupsDone && question.code_challenge && !showCode && (
              <button onClick={() => { setShowCode(true); speakText("Code challenge: " + question.code_challenge!); }}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-900/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-sm font-medium py-3 rounded-xl transition-all">
                <Code2 className="w-4 h-4" /> Show Code Challenge
              </button>
            )}

            {evaluation && allFollowupsDone && (!question.code_challenge || showCode) && (
              <button onClick={nextQuestion}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold py-3 rounded-xl transition-all">
                {qIdx >= allQ.length - 1 ? "Finish Exam" : "Next Question"}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {!evaluation && (
              <p className="text-xs text-slate-600 w-full text-center py-3">
                {answer.trim() ? "Click Evaluate with AI to proceed" : "Enter your answer to continue"}
              </p>
            )}
          </div>
        </div>
      </main>
    </Screen>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EvalCard({ eval: e, verbalMode, tts }: { eval: AIEvaluation; verbalMode: boolean; tts: ReturnType<typeof useTTS> }) {
  const gk = gradeKey(e.grade);
  const gradeClass = GRADE_COLOR[gk] ?? "text-slate-400 bg-slate-500/10 border-slate-500/30";
  const scoreColor = e.score >= 85 ? "text-emerald-400" : e.score >= 70 ? "text-green-400" : e.score >= 55 ? "text-blue-400" : e.score >= 40 ? "text-yellow-400" : e.score >= 25 ? "text-orange-400" : "text-red-400";
  const barColor   = e.score >= 85 ? "bg-emerald-500" : e.score >= 70 ? "bg-green-500" : e.score >= 55 ? "bg-blue-500" : e.score >= 40 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">AI Evaluation</span>
          {verbalMode && (
            <button onClick={() => tts.speak(`Your score is ${e.score} out of 100. ${e.strengths}. ${e.improvement_tips}`)}
              className="p-1 text-slate-500 hover:text-indigo-400 transition-colors">
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className={`text-3xl font-black ${scoreColor}`}>{e.score}</span>
            <span className="text-slate-600 text-sm">/100</span>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${gradeClass}`}>{gk}</span>
        </div>
      </div>

      {/* Score bar */}
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-2 rounded-full transition-all duration-1000 ${barColor}`} style={{ width: `${e.score}%` }} />
      </div>

      {/* Strengths */}
      <Row icon={<TrendingUp className="w-4 h-4 text-green-400" />} label="Strengths" labelClass="text-green-400">
        {e.strengths}
      </Row>

      {/* Gaps */}
      {e.gaps && e.gaps !== "None" && (
        <Row icon={<AlertTriangle className="w-4 h-4 text-orange-400" />} label="Gaps / Missing" labelClass="text-orange-400">
          {e.gaps}
        </Row>
      )}

      {/* Model answer */}
      <Row icon={<Star className="w-4 h-4 text-indigo-400" />} label="Model Answer" labelClass="text-indigo-400">
        {e.model_answer}
      </Row>

      {/* Improvement tips */}
      {e.improvement_tips && (
        <Row icon={<MessageSquare className="w-4 h-4 text-sky-400" />} label="How to improve" labelClass="text-sky-400">
          {e.improvement_tips}
        </Row>
      )}
    </div>
  );
}

function Row({ icon, label, labelClass, children }: { icon: React.ReactNode; label: string; labelClass: string; children: React.ReactNode }) {
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

function TimerBadge({ timer }: { timer: ReturnType<typeof useCountdown> }) {
  const color =
    timer.urgency === "critical" ? "text-red-400 border-red-500/40 bg-red-500/10" :
    timer.urgency === "warning"  ? "text-amber-400 border-amber-500/40 bg-amber-500/10" :
                                    "text-slate-300 border-slate-600 bg-slate-800";
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono font-semibold ${color} ${timer.urgency === "critical" ? "animate-pulse" : ""}`}>
      <Clock className="w-3 h-3" />
      {String(timer.minutes).padStart(2, "0")}:{String(timer.seconds).padStart(2, "0")}
    </div>
  );
}

function Header({ name, phase, verbalMode, timer, tts }: {
  name: string;
  phase: "prep" | "direct" | "done";
  verbalMode: boolean;
  timer: ReturnType<typeof useCountdown> | null;
  tts: ReturnType<typeof useTTS>;
}) {
  const phaseLabel = { prep: "Preparation", direct: "Direct", done: "Complete" }[phase];
  const phaseColor = { prep: "text-amber-400", direct: "text-red-400", done: "text-green-400" }[phase];

  return (
    <header className="border-b border-slate-800 px-5 py-3 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-slate-300 text-sm font-medium">{name}</span>
        <span className="text-slate-700">·</span>
        <span className={`text-xs font-semibold ${phaseColor}`}>{phaseLabel}</span>
      </div>
      <div className="flex items-center gap-3">
        {timer && <TimerBadge timer={timer} />}
        {verbalMode && (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-xs text-violet-400 font-medium">Verbal</span>
            <button onClick={tts.speaking ? tts.stop : undefined} className={`p-1 rounded ${tts.speaking ? "text-violet-300" : "text-slate-600"}`}>
              {tts.speaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
            </button>
          </div>
        )}
        <div className="flex items-center gap-1 text-xs text-slate-600">
          <Sparkles className="w-3 h-3 text-indigo-500" />
          NVIDIA AI
        </div>
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
