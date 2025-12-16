import React, { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, {
        email,
        password,
      });

      toast.success('Login realizado com sucesso!');
      onLogin(response.data.user, response.data.token);
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.detail || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-5">
        <img
          src="https://images.unsplash.com/photo-1618631179029-dfaeb4b786de?crop=entropy&cs=srgb&fm=jpg&q=85"
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="flex justify-center mb-8">
            <img
              src="https://customer-assets.emergentagent.com/job_portal-jussara/artifacts/ydejbjhx_LOGO%20%20KUNDALINI%20.INSTITUCIONAL%20E%20MINHA.png"
              alt="Instituto Jussara Kaisel"
              className="w-48 h-auto"
            />
          </div>

          <h1 className="text-3xl font-heading font-semibold text-center text-[#DAA520] mb-2">
            Portal do Instituto
          </h1>
          <p className="text-center text-slate-400 mb-8">
            Bem-vinda de volta
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                data-testid="email-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="bg-[#0B1120]/50 border-slate-700 focus:border-[#DAA520] focus:ring-1 focus:ring-[#DAA520] text-slate-200 placeholder:text-slate-600 rounded-xl h-12 px-4"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                data-testid="password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-[#0B1120]/50 border-slate-700 focus:border-[#DAA520] focus:ring-1 focus:ring-[#DAA520] text-slate-200 placeholder:text-slate-600 rounded-xl h-12 px-4"
                required
              />
            </div>

            <Button
              type="submit"
              data-testid="login-button"
              disabled={loading}
              className="w-full bg-[#DAA520] text-[#0B1120] hover:bg-[#B8860B] font-medium px-8 py-3 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(218,165,32,0.3)] hover:shadow-[0_0_25px_rgba(218,165,32,0.5)] h-12"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
