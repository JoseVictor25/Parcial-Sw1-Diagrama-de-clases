import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProjectsPage from './pages/ProjectsPage';
import DiagramPage from './pages/DiagramPage';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuthStore();
  
  if (loading) return <div>Loading...</div>;
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  const checkAuth = useAuthStore(state => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Router>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1e293b', color: '#fff', border: '1px solid #334155' }
      }} />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route path="/" element={
          <PrivateRoute>
            <ProjectsPage />
          </PrivateRoute>
        } />
        
        <Route path="/project/:id" element={
          <PrivateRoute>
            <DiagramPage />
          </PrivateRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
