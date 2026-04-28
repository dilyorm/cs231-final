import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import ExamPage from "./pages/ExamPage";
import LoginPage from "./pages/LoginPage";
import HistoryPage from "./pages/HistoryPage";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import QuestionList from "./pages/admin/QuestionList";
import QuestionForm from "./pages/admin/QuestionForm";
import UsersPage from "./pages/admin/UsersPage";
import ImportPage from "./pages/admin/ImportPage";
import StudyPage from "./pages/StudyPage";
import AnalyticsListener from "./components/AnalyticsListener";

export default function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <AnalyticsListener />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/exam" element={<ExamPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/study" element={<StudyPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireRole="contributor">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="questions" element={<QuestionList />} />
            <Route path="questions/new" element={<QuestionForm />} />
            <Route path="questions/:id/edit" element={<QuestionForm />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="import" element={<ImportPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}
