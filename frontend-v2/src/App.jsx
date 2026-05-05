import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ProblemsPage from './pages/ProblemsPage';
import ProblemDetailPage from './pages/ProblemDetailPage';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/auth" />;
  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/problems" element={
            <ProtectedRoute>
              <ProblemsPage />
            </ProtectedRoute>
          } />
          
          <Route path="/problems/:slug" element={
            <ProtectedRoute>
              <ProblemDetailPage />
            </ProtectedRoute>
          } />
          
          {/* Fallback */}
          <Route path="*" element={<div className="py-20 text-center">Page Coming Soon...</div>} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
