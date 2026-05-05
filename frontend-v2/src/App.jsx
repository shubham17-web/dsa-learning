import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ProblemsPage from './pages/ProblemsPage';
import ProblemDetailPage from './pages/ProblemDetailPage';



function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          
          <Route path="/" element={
              <Dashboard />
          } />
          
          <Route path="/problems" element={
              <ProblemsPage />
          } />
          
          <Route path="/problems/:slug" element={
              <ProblemDetailPage />
          } />
          
          {/* Fallback */}
          <Route path="*" element={<div className="py-20 text-center">Page Coming Soon...</div>} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
