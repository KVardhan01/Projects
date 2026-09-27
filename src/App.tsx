import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { QuantumProvider } from './context/QuantumContext';
import { ProgressProvider } from './context/ProgressContext';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { LearnPathPage } from './pages/LearnPathPage';
import { LessonPage } from './pages/LessonPage';
import { LabPage } from './pages/LabPage';
import { ExercisesPage } from './pages/ExercisesPage';
import { ExerciseDetailPage } from './pages/ExerciseDetailPage';
import { ReferencePage } from './pages/ReferencePage';
import { ProgressPage } from './pages/ProgressPage';
import { AchievementsPage } from './pages/AchievementsPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';

// Instructor Pages
import { InstructorDashboardPage } from './pages/InstructorDashboardPage';
import { InstructorStudentsPage } from './pages/InstructorStudentsPage';
import { InstructorExercisesPage } from './pages/InstructorExercisesPage';

// Admin Pages
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminConfigPage } from './pages/AdminConfigPage';
import { UserRole } from './types/user';

interface ProtectedProps {
  children: React.ReactElement;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedProps> = ({ children, allowedRoles }) => {
  const { user, role, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

const RootRedirect: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }
  if (user.role === 'INSTRUCTOR') {
    return <Navigate to="/instructor" replace />;
  }
  return <Navigate to="/student/dashboard" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <QuantumProvider>
          <ProgressProvider>
            <Routes>
              {/* Root always redirects to /login */}
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* Public Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />

              {/* Main App Layout (All routes strictly protected) */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                {/* Student Dashboard */}
                <Route
                  path="student/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="dashboard" element={<Navigate to="/student/dashboard" replace />} />

                {/* Learning Path Routes */}
                <Route path="learning" element={<LearnPathPage />} />
                <Route path="learning/:moduleId" element={<LearnPathPage />} />
                <Route path="learning/:moduleId/:lessonId" element={<LessonPage />} />
                <Route path="learn" element={<Navigate to="/learning" replace />} />
                <Route path="learn/:moduleId" element={<LearnPathPage />} />
                <Route path="learn/:moduleId/:lessonId" element={<LessonPage />} />

                {/* Circuit Lab Routes */}
                <Route path="circuit-lab" element={<LabPage />} />
                <Route path="circuit-lab/:circuitId" element={<LabPage />} />
                <Route path="lab" element={<Navigate to="/circuit-lab" replace />} />
                <Route path="lab/:circuitId" element={<LabPage />} />

                {/* General Authenticated Features */}
                <Route path="exercises" element={<ExercisesPage />} />
                <Route path="exercises/:exerciseId" element={<ExerciseDetailPage />} />
                <Route path="reference" element={<ReferencePage />} />
                <Route path="progress" element={<ProgressPage />} />
                <Route path="achievements" element={<AchievementsPage />} />
                <Route path="profile" element={<ProfilePage />} />

                {/* Instructor-only Protected Routes */}
                <Route
                  path="instructor"
                  element={
                    <ProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN']}>
                      <InstructorDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="instructor/students"
                  element={
                    <ProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN']}>
                      <InstructorStudentsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="instructor/exercises"
                  element={
                    <ProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN']}>
                      <InstructorExercisesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="instructor/analytics"
                  element={
                    <ProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN']}>
                      <InstructorStudentsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin-only Protected Routes */}
                <Route
                  path="admin"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/users"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminUsersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/settings"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminConfigPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/config"
                  element={<Navigate to="/admin/settings" replace />}
                />
              </Route>

              {/* Catch-all: Route unhandled paths to /login */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </ProgressProvider>
        </QuantumProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
