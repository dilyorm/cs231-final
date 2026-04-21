import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { ExamSession } from "../types";
import ExamFlow from "../components/ExamFlow";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

export default function ExamPage() {
  const [session, setSession] = useState<ExamSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [verbalMode] = useState(() => sessionStorage.getItem("verbalMode") === "1");
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { token } = useAuth();
  const sessionId = params.get("session");

  useEffect(() => {
    if (!token) { navigate("/login", { replace: true }); return; }
    load();
  }, [token]);

  async function load() {
    setLoading(true);
    try {
      if (sessionId) {
        const s = await api.getSession(sessionId);
        setSession(s);
      } else {
        // Try resume active session
        const active = await api.getActiveSession();
        if (active) {
          setSession(active);
        } else {
          // Start new
          const s = await api.startExam(5);
          setSession(s);
          navigate(`/exam?session=${s.session_id}`, { replace: true });
        }
      }
    } catch (e: any) {
      setError(e.message ?? "Failed to load exam");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin w-8 h-8 text-indigo-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-slate-400 text-sm">Preparing your exam...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={() => navigate("/")} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <ExamFlow
      session={session}
      verbalMode={verbalMode}
      onDone={() => navigate("/history")}
    />
  );
}
