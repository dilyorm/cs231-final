import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import type { ExamSession } from "../types";
import ExamFlow from "../components/ExamFlow";

export default function ExamPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = location.state?.session as ExamSession | undefined;
  const verbalMode = location.state?.verbalMode as boolean ?? false;

  useEffect(() => {
    if (!session) navigate("/", { replace: true });
  }, [session, navigate]);

  if (!session) return null;

  return <ExamFlow session={session} verbalMode={verbalMode} onDone={() => navigate("/")} />;
}
