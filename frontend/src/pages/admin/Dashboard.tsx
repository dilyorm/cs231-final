import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, List, PlusCircle, BarChart3 } from "lucide-react";
import { api } from "../../lib/api";
import type { StatsResponse } from "../../types";

export default function Dashboard() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.getStats().then(setStats).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">CS231 Mock Exam — question bank overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={<BookOpen className="w-5 h-5 text-indigo-500" />}
          label="Total Questions"
          value={loading ? "..." : stats?.total_questions ?? 0}
          bg="bg-indigo-50"
        />
        <StatCard
          icon={<List className="w-5 h-5 text-violet-500" />}
          label="Topics Covered"
          value={loading ? "..." : stats?.topics.length ?? 0}
          bg="bg-violet-50"
        />
        <div
          className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col justify-between cursor-pointer hover:border-indigo-300 hover:shadow-sm transition-all"
          onClick={() => navigate("/admin/questions/new")}
        >
          <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center mb-3">
            <PlusCircle className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">Add Question</div>
            <div className="text-xs text-gray-400 mt-0.5">Expand the bank</div>
          </div>
        </div>
      </div>

      {/* Topic breakdown */}
      <div className="bg-white border border-gray-200 rounded-xl">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700">Questions per Topic</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {stats?.topics.map((t) => {
              const pct = stats.total_questions > 0 ? (t.count / stats.total_questions) * 100 : 0;
              return (
                <div key={t.topic_number} className="px-5 py-3 flex items-center gap-4">
                  <span className="w-8 text-right text-xs font-mono text-gray-400 flex-shrink-0">
                    T{String(t.topic_number).padStart(2, "0")}
                  </span>
                  <span className="flex-1 text-sm text-gray-700 truncate">{t.topic}</span>
                  <div className="w-28 flex items-center gap-2 flex-shrink-0">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-indigo-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-5 text-right">{t.count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  bg: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-400 mt-0.5">{label}</div>
    </div>
  );
}
