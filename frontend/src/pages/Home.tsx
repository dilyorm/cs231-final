import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Shield, ChevronRight, Cpu, Settings, Mic, MicOff, Volume2, LogIn } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import type { ExamSession } from "../types";

export default function Home() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verbalMode, setVerbalMode] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  async function startExam(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const session: ExamSession = await api.startExam(name.trim());
      navigate("/exam", { state: { session, verbalMode } });
    } catch (err: any) {
      setError(err.message ?? "Failed to start exam. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-400" />
          <span className="font-semibold text-slate-300 text-sm tracking-wide">CS231 · Computer Architecture</span>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {(user.role === "admin" || user.role === "contributor") && (
                <button onClick={() => navigate("/admin")} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                  <Settings className="w-3.5 h-3.5" />
                  Panel
                </button>
              )}
              <span className="text-xs text-slate-500">{user.username}</span>
              <button onClick={() => { logout(); }} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
                Sign out
              </button>
            </>
          ) : (
            <button onClick={() => navigate("/login")} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
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
            then <span className="text-red-400 font-medium">3 direct questions</span>. AI evaluates every answer.
          </p>

          <form onSubmit={startExam} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Your name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name to begin..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                autoFocus
              />
            </div>

            {/* Verbal mode toggle */}
            <button
              type="button"
              onClick={() => setVerbalMode((v) => !v)}
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
                  <div className={`text-sm font-semibold ${verbalMode ? "text-violet-200" : "text-slate-300"}`}>
                    Verbal Mode
                  </div>
                  <div className="text-xs text-slate-500">
                    {verbalMode ? "Questions read aloud · Mic records answers" : "Enable for full speech-based exam"}
                  </div>
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
                  Questions will be read aloud via text-to-speech. Click the mic button to record your answer.
                  Works best in Chrome or Edge.
                </p>
              </div>
            )}

            {error && (
              <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold py-3 rounded-lg transition-all"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Preparing exam...
                </span>
              ) : (
                <> Start Exam <ChevronRight className="w-4 h-4" /> </>
              )}
            </button>
          </form>

          {/* Info cards */}
          <div className="mt-10 grid grid-cols-4 gap-2.5">
            {[
              { icon: BookOpen, label: "23 Topics", sub: "All covered" },
              { icon: Shield, label: "95 Questions", sub: "Full bank" },
              { icon: Cpu, label: "AI Follow-ups", sub: "Dynamic" },
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

      <footer className="text-center text-slate-700 text-xs py-4">CS231 · Computer Architecture · Spring 2026</footer>
    </div>
  );
}
