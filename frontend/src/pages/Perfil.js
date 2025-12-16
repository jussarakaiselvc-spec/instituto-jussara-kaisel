import React, { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Lock, Mail, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Perfil = ({ user }) => {
  const [emailData, setEmailData] = useState({
    new_email: user.email,
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const updateEmail = async () => {
    if (!emailData.new_email) {
      toast.error('Digite um novo email');
      return;
    }

    setUpdatingEmail(true);
    try {
      await axios.put(`${API}/auth/update-email`, {
        new_email: emailData.new_email,
      });
      toast.success('Email atualizado com sucesso! Faça login novamente.');
      setTimeout(() => {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }, 2000);
    } catch (error) {
      console.error('Error updating email:', error);
      toast.error(error.response?.data?.detail || 'Erro ao atualizar email');
    } finally {
      setUpdatingEmail(false);
    }
  };

  const updatePassword = async () => {
    if (!passwordData.current_password || !passwordData.new_password) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (passwordData.new_password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setUpdatingPassword(true);
    try {
      await axios.put(`${API}/auth/update-password`, {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      toast.success('Senha atualizada com sucesso!');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error(error.response?.data?.detail || 'Erro ao atualizar senha');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const connectGoogleCalendar = async () => {
    try {
      const response = await axios.get(`${API}/google-calendar/auth-url`);
      window.location.href = response.data.auth_url;
    } catch (error) {
      console.error('Error connecting Google Calendar:', error);
      toast.error('Erro ao conectar com Google Calendar');
    }
  };

  const disconnectGoogleCalendar = async () => {
    try {
      await axios.post(`${API}/google-calendar/disconnect`);
      toast.success('Google Calendar desconectado');
      window.location.reload();
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
      toast.error('Erro ao desconectar Google Calendar');
    }
  };

  return (
    <div className="p-6 md:p-12">
      <h1 className="text-4xl md:text-5xl font-heading font-semibold text-[#DAA520] mb-8" data-testid="perfil-title">
        Perfil & Configurações
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações do Usuário */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
          <div className="flex items-center space-x-2 mb-6">
            <User className="w-6 h-6 text-[#DAA520]" />
            <h2 className="text-2xl font-heading font-medium text-slate-200">Informações Pessoais</h2>
          </div>

          <div className="space-y-6">
            <div>
              <Label className="text-slate-300 mb-2 block">Nome</Label>
              <div className="bg-[#0B1120]/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-300">
                {user.name}
              </div>
            </div>

            <div>
              <Label className="text-slate-300 mb-2 block">Email Atual</Label>
              <div className="bg-[#0B1120]/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-300">
                {user.email}
              </div>
            </div>

            <div>
              <Label className="text-slate-300 mb-2 block">Perfil</Label>
              <div className="bg-[#0B1120]/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-300 capitalize">
                {user.role === 'admin' ? 'Administradora' : 'Mentorada'}
              </div>
            </div>
          </div>
        </div>

        {/* Alterar Email */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
          <div className="flex items-center space-x-2 mb-6">
            <Mail className="w-6 h-6 text-[#DAA520]" />
            <h2 className="text-2xl font-heading font-medium text-slate-200">Alterar Email</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="new-email" className="text-slate-300 mb-2 block">
                Novo Email
              </Label>
              <Input
                id="new-email"
                type="email"
                value={emailData.new_email}
                onChange={(e) => setEmailData({ new_email: e.target.value })}
                data-testid="new-email-input"
                placeholder="novo@email.com"
                className="bg-[#0B1120]/50 border-slate-700 focus:border-[#DAA520] focus:ring-1 focus:ring-[#DAA520] text-slate-200 placeholder:text-slate-600 rounded-xl h-12 px-4"
              />
            </div>

            <Button
              onClick={updateEmail}
              disabled={updatingEmail || emailData.new_email === user.email}
              data-testid="update-email-button"
              className="w-full bg-[#DAA520] text-[#0B1120] hover:bg-[#B8860B] font-medium px-8 py-3 rounded-full transition-all duration-300"
            >
              {updatingEmail ? 'Atualizando...' : 'Atualizar Email'}
            </Button>
            <p className="text-xs text-slate-400 mt-2">
              * Você precisará fazer login novamente após alterar o email
            </p>
          </div>
        </div>

        {/* Alterar Senha */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
          <div className="flex items-center space-x-2 mb-6">
            <Lock className="w-6 h-6 text-[#DAA520]" />
            <h2 className="text-2xl font-heading font-medium text-slate-200">Alterar Senha</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="current-password" className="text-slate-300 mb-2 block">
                Senha Atual
              </Label>
              <Input
                id="current-password"
                type="password"
                value={passwordData.current_password}
                onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                data-testid="current-password-input"
                placeholder="••••••••"
                className="bg-[#0B1120]/50 border-slate-700 focus:border-[#DAA520] focus:ring-1 focus:ring-[#DAA520] text-slate-200 placeholder:text-slate-600 rounded-xl h-12 px-4"
              />
            </div>

            <div>
              <Label htmlFor="new-password" className="text-slate-300 mb-2 block">
                Nova Senha
              </Label>
              <Input
                id="new-password"
                type="password"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                data-testid="new-password-input"
                placeholder="••••••••"
                className="bg-[#0B1120]/50 border-slate-700 focus:border-[#DAA520] focus:ring-1 focus:ring-[#DAA520] text-slate-200 placeholder:text-slate-600 rounded-xl h-12 px-4"
              />
            </div>

            <div>
              <Label htmlFor="confirm-password" className="text-slate-300 mb-2 block">
                Confirmar Nova Senha
              </Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                data-testid="confirm-password-input"
                placeholder="••••••••"
                className="bg-[#0B1120]/50 border-slate-700 focus:border-[#DAA520] focus:ring-1 focus:ring-[#DAA520] text-slate-200 placeholder:text-slate-600 rounded-xl h-12 px-4"
              />
            </div>

            <Button
              onClick={updatePassword}
              disabled={updatingPassword}
              data-testid="update-password-button"
              className="w-full bg-[#DAA520] text-[#0B1120] hover:bg-[#B8860B] font-medium px-8 py-3 rounded-full transition-all duration-300"
            >
              {updatingPassword ? 'Atualizando...' : 'Atualizar Senha'}
            </Button>
          </div>
        </div>

        {/* Google Calendar */}
        {user.role === 'admin' && (
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
            <div className="flex items-center space-x-2 mb-6">
              <Calendar className="w-6 h-6 text-[#DAA520]" />
              <h2 className="text-2xl font-heading font-medium text-slate-200">Google Calendar</h2>
            </div>

            <div className="space-y-4">
              <p className="text-slate-300 leading-relaxed">
                Conecte sua conta do Google Calendar para sincronizar automaticamente as sessões agendadas.
              </p>

              <div className="flex flex-col space-y-3">
                <Button
                  onClick={connectGoogleCalendar}
                  data-testid="connect-google-calendar-button"
                  className="w-full bg-[#DAA520] text-[#0B1120] hover:bg-[#B8860B] font-medium px-8 py-3 rounded-full transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <Calendar className="w-5 h-5" />
                  <span>Conectar Google Calendar</span>
                </Button>

                <Button
                  onClick={disconnectGoogleCalendar}
                  data-testid="disconnect-google-calendar-button"
                  className="w-full bg-transparent border border-red-500/50 text-red-400 hover:bg-red-500/10 px-8 py-3 rounded-full transition-all duration-300"
                >
                  Desconectar
                </Button>
              </div>

              <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <p className="text-sm text-blue-300">
                  <strong>Funcionalidades:</strong>
                  <br />• Sessões agendadas aparecem automaticamente no seu Google Calendar
                  <br />• Notificações automáticas antes da sessão
                  <br />• Links de vídeo incluídos nos eventos
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Perfil;
