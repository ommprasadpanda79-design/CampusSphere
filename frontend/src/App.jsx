import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";
import { FullPageLoader } from "./components/Feedback.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";

const StudentDashboard = lazy(() => import("./pages/student/StudentDashboard.jsx"));
const FacultyDashboard = lazy(() => import("./pages/faculty/FacultyDashboard.jsx"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard.jsx"));

function RoleHome() {
  const { user, ready } = useAuth();
  if (!ready) return <FullPageLoader />;
  return <Navigate to={user ? `/${user.role.toLowerCase()}` : "/login"} replace />;
}

export default function App() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <Routes>
        <Route path="/" element={<RoleHome />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute roles={["STUDENT"]} />}><Route path="/student" element={<StudentDashboard />} /></Route>
        <Route element={<ProtectedRoute roles={["FACULTY"]} />}><Route path="/faculty" element={<FacultyDashboard />} /></Route>
        <Route element={<ProtectedRoute roles={["ADMIN"]} />}><Route path="/admin" element={<AdminDashboard />} /></Route>
        <Route path="*" element={<RoleHome />} />
      </Routes>
    </Suspense>
  );
}
