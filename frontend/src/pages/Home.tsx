import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Shield, ChevronRight, Cpu, Settings, Mic, MicOff, Volume2, LogIn, History, GraduationCap, Sun, Moon } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

export default function Home() {
  const [verbalMode, setVerbalMode] = useState(false);
  const navigate = useNavigate();
  const { user, logout, isAdmin, isContributor } = useAuth();
  const { theme, toggle } = useTheme();

  function startExam() {
    sessionStorage.setItem("verbalMode", verbalMode ? "1" : "0");
    navigate("/exam");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 px-4 sm:px-6 py-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-400" />
          <span className="font-semibold text-slate-300 text-sm tracking-wide">CS231 · Computer Architecture</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={toggle} className="p-1.5 rounded-lg text-slate-600 hover:text-slate-400 hover:bg-slate-800/50 transition-colors" title="Toggle theme">
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          {user ? (
            <>
              {(isAdmin || isContributor) && (
                <button onClick={() => navigate("/admin")} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                  <Settings className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Panel</span>
                </button>
              )}
              <button onClick={() => navigate("/study")} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                <GraduationCap className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Study</span>
              </button>
              <button onClick={() => navigate("/history")} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                <History className="w-3.5 h-3.5" /> <span className="hidden sm:inline">History</span>
              </button>
              <span className="text-xs text-slate-600 hidden sm:inline">|</span>
              <span className="text-xs text-slate-400 hidden sm:inline truncate max-w-[80px]">{user.username}</span>
              <button onClick={logout} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Out</button>
            </>
          ) : (
            <button onClick={() => navigate("/login")} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
              <LogIn className="w-3.5 h-3.5" /> Sign In
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-3 sm:px-4">
        <div className="w-full max-w-lg">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
              <Shield className="w-3 h-3" />
              Spring 2026 · Final Exam Prep
            </span>
          </div>

          <h1 className="text-4xl font-extrabold text-center mb-3 bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
            Mock Oral Exam
          </h1>
          <p className="text-slate-400 text-center mb-8 text-sm leading-relaxed">
            <span className="text-amber-400 font-medium">2 prep questions</span> with 20-minute timer,
            then <span className="text-red-400 font-medium">3 direct questions</span>. Answer follow-ups, then see your score.
          </p>

          {/* Study CTA — visible to everyone */}
          <button
            onClick={() => navigate("/study")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 hover:border-emerald-500/60 transition-all mb-4 text-left group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-emerald-300">Study Topics First</div>
              <div className="text-xs text-slate-500">23 topics with key concepts, examples & exam traps</div>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-600 group-hover:text-emerald-400 transition-colors flex-shrink-0" />
          </button>

          {!user ? (
            /* Not logged in */
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 text-center">
                <p className="text-slate-400 text-sm mb-4">Sign in to start your personalized exam and track your progress.</p>
                <div className="flex gap-3">
                  <button onClick={() => navigate("/login")}
                    className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-lg transition-all text-sm">
                    <LogIn className="w-4 h-4" /> Sign In
                  </button>
                  <button onClick={() => navigate("/login")}
                    className="flex-1 border border-slate-600 text-slate-300 hover:bg-slate-800 font-semibold py-2.5 rounded-lg transition-all text-sm">
                    Register
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Logged in */
            <div className="space-y-4">
              {/* Verbal mode toggle */}
              <button
                type="button"
                onClick={() => setVerbalMode(v => !v)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
                  verbalMode
                    ? "bg-violet-900/40 border-violet-500/50 text-violet-200"
                    : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${verbalMode ? "bg-violet-500/30" : "bg-slate-800"}`}>
                    {verbalMode ? <Mic className="w-4 h-4 text-violet-400" /> : <MicOff className="w-4 h-4 text-slate-500" />}
                  </div>
                  <div className="text-left">
                    <div className={`text-sm font-semibold ${verbalMode ? "text-violet-200" : "text-slate-300"}`}>Verbal Mode</div>
                    <div className="text-xs text-slate-500">{verbalMode ? "Questions read aloud · Mic records" : "Enable speech-based exam"}</div>
                  </div>
                </div>
                <div className={`w-10 h-6 rounded-full transition-all relative ${verbalMode ? "bg-violet-600" : "bg-slate-700"}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${verbalMode ? "left-5" : "left-1"}`} />
                </div>
              </button>

              {verbalMode && (
                <div className="flex items-start gap-2 px-3 py-2.5 bg-violet-950/30 border border-violet-500/20 rounded-lg">
                  <Volume2 className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-violet-300 leading-relaxed">
                    Questions read aloud via Gemini TTS (or browser fallback). Click mic to record answers. Works best in Chrome/Edge.
                  </p>
                </div>
              )}

              <button
                onClick={startExam}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-lg transition-all"
              >
                Start Exam <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => navigate("/history")}
                className="w-full flex items-center justify-center gap-2 border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200 py-2.5 rounded-lg transition-all text-sm"
              >
                <History className="w-4 h-4" /> View Past Exams
              </button>
            </div>
          )}

          {/* Info cards */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { icon: BookOpen, label: "23 Topics", sub: "All covered" },
              { icon: Shield, label: "95 Questions", sub: "Full bank" },
              { icon: Cpu, label: "AI Follow-ups", sub: "Answerable" },
              { icon: Mic, label: "Verbal Mode", sub: "Speech I/O" },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-center">
                <Icon className="w-4 h-4 text-indigo-400 mx-auto mb-1.5" />
                <div className="text-white text-xs font-semibold">{label}</div>
                <div className="text-slate-500 text-xs">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="text-center text-slate-700 text-xs py-4 space-y-1">
        <div>CS231 · Computer Architecture · Spring 2026</div>
        <div className="flex items-center justify-center gap-4">
          <a href="https://t.me/dilyor_m" target="_blank" rel="noopener noreferrer"
            className="text-slate-600 hover:text-indigo-400 transition-colors">Telegram: @dilyor_m</a>
          <span className="text-slate-800">·</span>
          <a href="mailto:d.muhammadjonov@newuu.uz" className="text-slate-600 hover:text-indigo-400 transition-colors">
            d.muhammadjonov@newuu.uz
          </a>
        </div>
      </footer>
    </div>
  );
}
