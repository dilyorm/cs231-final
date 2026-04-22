import { useRef, useState } from "react";
import { Upload, FileJson, FileText, CheckCircle2, AlertTriangle, Download } from "lucide-react";

interface ImportResult {
  added: number;
  skipped: number;
  errors: string[];
}

function getToken() {
  return localStorage.getItem("cs231_token") ?? "";
}

export default function ImportPage() {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (ext !== "json" && ext !== "csv") { setError("Only .json and .csv files supported"); return; }
    setFile(f); setResult(null); setError("");
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  async function upload() {
    if (!file) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/questions/import", {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "Import failed");
      setResult(data); setFile(null);
    } catch (e: any) {
      setError(e.message ?? "Import failed");
    } finally {
      setLoading(false);
    }
  }

  function downloadTemplate(type: "json" | "csv") {
    if (type === "json") {
      const sample = [{ topic_number: 1, topic: "Topic 1 – Binary Representation & Byte Ordering", question: "Explain what byte-oriented memory organization means.", followups: ["What is big-endian vs little-endian?", "Give an example with 0x12345678."], code_challenge: null }];
      const blob = new Blob([JSON.stringify(sample, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "questions_template.json"; a.click();
      URL.revokeObjectURL(url);
    } else {
      const csv = 'id,topic_number,topic,question,followups,code_challenge\n,1,"Topic 1 – Binary Representation & Byte Ordering","Explain byte-oriented memory organization.","What is big-endian vs little-endian?|Give an example with 0x12345678.",\n';
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "questions_template.csv"; a.click();
      URL.revokeObjectURL(url);
    }
  }

  const isJson = file?.name.endsWith(".json");

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Import Questions</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Bulk-import from JSON or CSV. All imported questions are auto-approved.</p>
      </div>

      {/* Format info */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="border border-gray-200 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2 mb-2">
            <FileJson className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">JSON format</span>
            <button
              onClick={() => downloadTemplate("json")}
              className="ml-auto text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1"
            >
              <Download className="w-3 h-3" /> template
            </button>
          </div>
          <pre className="text-xs text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800 rounded p-2 overflow-x-auto whitespace-pre-wrap">{`[{
  "topic_number": 1,
  "topic": "Topic 1 – ...",
  "question": "...",
  "followups": ["q1?","q2?"],
  "code_challenge": null
}]`}</pre>
        </div>
        <div className="border border-gray-200 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">CSV format</span>
            <button
              onClick={() => downloadTemplate("csv")}
              className="ml-auto text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center gap-1"
            >
              <Download className="w-3 h-3" /> template
            </button>
          </div>
          <pre className="text-xs text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800 rounded p-2 overflow-x-auto whitespace-pre-wrap">{`topic_number,topic,question,
  followups,code_challenge

followups: pipe-separated
"q1?|q2?|q3?"`}</pre>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
          dragging
            ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-500/10"
            : file
            ? "border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10"
            : "border-gray-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-gray-50 dark:hover:bg-slate-800/40"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".json,.csv"
          className="hidden"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        {file ? (
          <div className="flex flex-col items-center gap-2">
            {isJson ? <FileJson className="w-10 h-10 text-indigo-400" /> : <FileText className="w-10 h-10 text-emerald-400" />}
            <span className="font-semibold text-gray-800 dark:text-white">{file.name}</span>
            <span className="text-xs text-gray-400 dark:text-slate-500">{(file.size / 1024).toFixed(1)} KB · click to change</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-slate-500">
            <Upload className="w-10 h-10" />
            <span className="text-sm font-medium">Drop .json or .csv here, or click to browse</span>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-600 dark:text-red-400">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {file && !result && (
        <button
          onClick={upload}
          disabled={loading}
          className="mt-4 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {loading ? (
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : <Upload className="w-4 h-4" />}
          {loading ? "Importing..." : "Import Questions"}
        </button>
      )}

      {result && (
        <div className="mt-4 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">Import complete</span>
          </div>
          <div className="p-5 space-y-3 bg-white dark:bg-slate-900">
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{result.added}</div>
                <div className="text-xs text-gray-500 dark:text-slate-400">added</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-500 dark:text-amber-400">{result.skipped}</div>
                <div className="text-xs text-gray-500 dark:text-slate-400">skipped</div>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg p-3 space-y-1 max-h-40 overflow-y-auto">
                {result.errors.map((e, i) => <p key={i} className="text-xs text-red-600 dark:text-red-400">{e}</p>)}
              </div>
            )}
            <button onClick={() => { setResult(null); setFile(null); }} className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 underline">
              Import another file
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
