import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import MinhaMentoria from '@/pages/MinhaMentoria';
import Sessoes from '@/pages/Sessoes';
import Tarefas from '@/pages/Tarefas';
import Mensagens from '@/pages/Mensagens';\nimport MensagensAdmin from '@/pages/MensagensAdmin';
import Financeiro from '@/pages/Financeiro';
import MeusProdutos from '@/pages/MeusProdutos';
import AdminPanel from '@/pages/AdminPanel';
import Calendario from '@/pages/Calendario';
import Layout from '@/components/Layout';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Setup axios defaults
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div className="text-[#DAA520] text-xl font-heading">Carregando...</div>
      </div>
    );
  }

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />
            }
          />
          <Route
            path="/"
            element={
              user ? (
                <Layout user={user} onLogout={handleLogout}>
                  <Navigate to="/dashboard" />
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              user ? (
                <Layout user={user} onLogout={handleLogout}>
                  <Dashboard user={user} />
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/minha-mentoria"
            element={
              user ? (
                <Layout user={user} onLogout={handleLogout}>
                  <MinhaMentoria user={user} />
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/sessoes"
            element={
              user ? (
                <Layout user={user} onLogout={handleLogout}>
                  <Sessoes user={user} />
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/tarefas"
            element={
              user ? (
                <Layout user={user} onLogout={handleLogout}>
                  <Tarefas user={user} />
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/mensagens"
            element={
              user ? (
                <Layout user={user} onLogout={handleLogout}>
                  {user.role === 'admin' ? <MensagensAdmin user={user} /> : <Mensagens user={user} />}
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/financeiro"
            element={
              user ? (
                <Layout user={user} onLogout={handleLogout}>
                  <Financeiro user={user} />
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/meus-produtos"
            element={
              user ? (
                <Layout user={user} onLogout={handleLogout}>
                  <MeusProdutos user={user} />
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/admin"
            element={
              user?.role === 'admin' ? (
                <Layout user={user} onLogout={handleLogout}>
                  <AdminPanel user={user} />
                </Layout>
              ) : (
                <Navigate to="/dashboard" />
              )
            }
          />
          <Route
            path="/calendario"
            element={
              user ? (
                <Layout user={user} onLogout={handleLogout}>
                  <Calendario user={user} />
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </>
  );
}

export default App;
