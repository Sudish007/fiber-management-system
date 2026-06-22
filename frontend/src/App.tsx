import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PortsPage from './pages/PortsPage';
import DDFPage from './pages/DDFPage';
import OFCPage from './pages/OFCPage';
import SearchPage from './pages/SearchPage';

export default function App() {
  const { auth, login, logout, isAdmin } = useAuth();
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  if (!auth.isAuthenticated) {
    return (
      <>
        <Toaster position="top-right" />
        <LoginPage onLogin={login} />
      </>
    );
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Layout
        onLogout={logout}
        username={auth.username}
        role={auth.role}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      >
        <Routes>
          <Route path="/" element={<DashboardPage darkMode={darkMode} />} />
          <Route path="/ports" element={<PortsPage darkMode={darkMode} isAdmin={isAdmin()} />} />
          <Route path="/ddf" element={<DDFPage darkMode={darkMode} isAdmin={isAdmin()} />} />
          <Route path="/ofc" element={<OFCPage darkMode={darkMode} isAdmin={isAdmin()} />} />
          <Route path="/search" element={<SearchPage darkMode={darkMode} />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
