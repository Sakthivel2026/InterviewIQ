import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { InterviewSetupWizardPage } from './pages/InterviewSetupWizardPage';
import { InterviewStudioPage } from './pages/InterviewStudioPage';
import { InterviewReportPage } from './pages/InterviewReportPage';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="flex flex-col min-h-screen bg-[#070a12] text-slate-100">
            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/interview/setup"
                  element={
                    <ProtectedRoute>
                      <InterviewSetupWizardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/interview/studio"
                  element={
                    <ProtectedRoute>
                      <InterviewStudioPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/interview/report/:id"
                  element={
                    <ProtectedRoute>
                      <InterviewReportPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<LandingPage />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
