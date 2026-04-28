import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Shield, ChevronRight, Cpu, Settings, Mic, MicOff, Volume2, LogIn, History, GraduationCap, Sun, Moon, PlayCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { track } from "../lib/analytics";

export default function Home() {
  const [verbalMode, setVerbalMode] = useState(false);
  const navigate = useNavigate();
  const { user, logout, isAdmin, isContributor } = useAuth();
  const { theme, toggle } = useTheme();

  function startExam() {
    sessionStorage.setItem("verbalMode", verbalMode ? "1" : "0");
    track("exam_start", { verbal_mode: verbalMode });
    navigate("/exam");
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-white flex flex-col transition-colors">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-slate-800 px-4 sm:px-6 py-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
          <span className="font-semibold text-gray-600 dark:text-slate-300 text-sm tracking-wide">CS231 · Computer Architecture</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={toggle}
            className="p-1.5 rounded-lg text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          {user ? (
            <>
              {(isAdmin || isContributor) && (
                <button onClick={() => navigate("/admin")} className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition-colors">
                  <Settings className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Panel</span>
                </button>
              )}
              <button onClick={() => navigate("/study")} className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition-colors">
                <GraduationCap className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Study</span>
              </button>
              <button onClick={() => navigate("/history")} className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition-colors">
                <History className="w-3.5 h-3.5" /> <span className="hidden sm:inline">History</span>
              </button>
              <span className="text-xs text-gray-300 dark:text-slate-700 hidden sm:inline">|</span>
              <span className="text-xs text-gray-500 dark:text-slate-400 hidden sm:inline truncate max-w-[80px]">{user.username}</span>
              <button onClick={logout} className="text-xs text-gray-400 dark:text-slate-600 hover:text-gray-600 dark:hover:text-slate-400 transition-colors">Out</button>
            </>
          ) : (
            <button onClick={() => navigate("/login")} className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition-colors">
              <LogIn className="w-3.5 h-3.5" /> Sign In
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-3 sm:px-4 py-6">
        <div className="w-full max-w-lg">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-medium">
              <Shield className="w-3 h-3" />
              Spring 2026 · Final Exam Prep
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-center mb-2 bg-gradient-to-br from-gray-900 to-gray-500 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
            CS231 Exam Prep
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-center mb-7 text-sm leading-relaxed">
            Study all 23 topics with lecture slides & videos, then practice with the AI mock exam.
          </p>

          {/* PRIMARY: Study */}
          <button
            onClick={() => navigate("/study")}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all mb-3 text-left group shadow-lg shadow-emerald-500/20"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white">Study Topics</div>
              <div className="text-xs text-emerald-100">23 topics · lecture slides · CMU videos · exam traps</div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/70 group-hover:text-white transition-colors flex-shrink-0" />
          </button>

          {/* SECONDARY: Mock exam */}
          {!user ? (
            <div className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4 text-center mb-3">
              <p className="text-gray-500 dark:text-slate-400 text-sm mb-3">Sign in to take the AI mock exam and track progress.</p>
              <div className="flex gap-2">
                <button onClick={() => navigate("/login")}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-lg transition-all text-sm">
                  <LogIn className="w-4 h-4" /> Sign In
                </button>
                <button onClick={() => navigate("/login")}
                  className="flex-1 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 font-semibold py-2.5 rounded-lg transition-all text-sm">
                  Register
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Mock exam card */}
              <div className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm font-semibold text-gray-800 dark:text-slate-200">Mock Oral Exam</span>
                  <span className="text-xs text-gray-400 dark:text-slate-500 ml-auto">2 prep + 3 direct questions</span>
                </div>

                {/* Verbal mode toggle */}
                <button
                  type="button"
                  onClick={() => setVerbalMode(v => !v)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border mb-3 transition-all ${
                    verbalMode
                      ? "bg-violet-50 dark:bg-violet-900/40 border-violet-300 dark:border-violet-500/50"
                      : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${verbalMode ? "bg-violet-100 dark:bg-violet-500/30" : "bg-gray-100 dark:bg-slate-700"}`}>
                      {verbalMode ? <Mic className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" /> : <MicOff className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />}
                    </div>
                    <div className="text-left">
                      <div className={`text-xs font-semibold ${verbalMode ? "text-violet-700 dark:text-violet-300" : "text-gray-700 dark:text-slate-300"}`}>Verbal Mode</div>
                      <div className="text-xs text-gray-400 dark:text-slate-500">{verbalMode ? "TTS reads · mic records" : "Enable speech"}</div>
                    </div>
                  </div>
                  <div className={`w-9 h-5 rounded-full transition-all relative flex-shrink-0 ${verbalMode ? "bg-violet-600" : "bg-gray-200 dark:bg-slate-600"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${verbalMode ? "left-4" : "left-0.5"}`} />
                  </div>
                </button>

                {verbalMode && (
                  <div className="flex items-start gap-2 px-3 py-2 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-500/20 rounded-lg mb-3">
                    <Volume2 className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-violet-600 dark:text-violet-300 leading-relaxed">
                      Questions read aloud via Gemini TTS. Mic records answers (Chrome/Edge).
                    </p>
                  </div>
                )}

                <button
                  onClick={startExam}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-lg transition-all text-sm"
                >
                  Start Mock Exam <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => navigate("/history")}
                className="w-full flex items-center justify-center gap-2 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-slate-200 py-2.5 rounded-lg transition-all text-sm"
              >
                <History className="w-4 h-4" /> Past Exams
              </button>
            </div>
          )}

          {/* Info cards */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { icon: BookOpen, label: "23 Topics", sub: "Slides + videos" },
              { icon: Shield, label: "95 Questions", sub: "Full bank" },
              { icon: Cpu, label: "AI Follow-ups", sub: "Gemini" },
              { icon: Mic, label: "Verbal Mode", sub: "TTS + STT" },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg p-3 text-center">
                <Icon className="w-4 h-4 text-indigo-500 dark:text-indigo-400 mx-auto mb-1.5" />
                <div className="text-gray-900 dark:text-white text-xs font-semibold">{label}</div>
                <div className="text-gray-400 dark:text-slate-500 text-xs">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="text-center text-gray-300 dark:text-slate-700 text-xs py-4 space-y-1">
        <div>CS231 · Computer Architecture · Spring 2026</div>
        <div className="flex items-center justify-center gap-4">
          <a href="https://t.me/dilyor_m" target="_blank" rel="noopener noreferrer"
            className="text-gray-400 dark:text-slate-600 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">Telegram: @dilyor_m</a>
          <span className="text-gray-200 dark:text-slate-800">·</span>
          <a href="mailto:d.muhammadjonov@newuu.uz" className="text-gray-400 dark:text-slate-600 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">
            d.muhammadjonov@newuu.uz
          </a>
        </div>
      </footer>
    </div>
  );
}
