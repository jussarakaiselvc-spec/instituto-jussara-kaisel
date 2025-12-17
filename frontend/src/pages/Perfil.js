import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { User, Lock, Mail, Calendar, MapPin, Phone, Globe } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ImageUpload from '@/components/ImageUpload';
import { COUNTRIES, CURRENCIES } from '@/utils/countries';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Perfil = ({ user, setUser }) => {
  const [profileData, setProfileData] = useState({
    name: user.name || '',
    phone: user.phone || '',
    country: user.country || '',
    country_code: user.country_code || 'BR',
    address: user.address || '',
    profile_image_url: user.profile_image_url || '',
    currency: user.currency || 'BRL',
  });
  const [emailData, setEmailData] = useState({
    new_email: user.email,
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const selectedCountry = COUNTRIES.find(c => c.code === profileData.country_code);

  const updateProfile = async () => {
    setUpdatingProfile(true);
    try {
      const response = await axios.put(`${API}/me/profile`, profileData);
      toast.success('Perfil atualizado com sucesso!');
      if (setUser) {
        setUser(response.data);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.detail || 'Erro ao atualizar perfil');
    } finally {
      setUpdatingProfile(false);
    }
  };

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
        {/* Foto de Perfil e Informações Básicas */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
          <div className="flex items-center space-x-2 mb-6">
            <User className="w-6 h-6 text-[#DAA520]" />
            <h2 className="text-2xl font-heading font-medium text-slate-200">Informações Pessoais</h2>
          </div>

          <div className="space-y-6">
            {/* Profile Image */}
            <div className="flex flex-col items-center mb-6">
              {profileData.profile_image_url ? (
                <img 
                  src={profileData.profile_image_url} 
                  alt="Foto de perfil"
                  className="w-32 h-32 rounded-full object-cover border-4 border-[#DAA520]/30 mb-4"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-[#DAA520]/20 flex items-center justify-center border-4 border-[#DAA520]/30 mb-4">
                  <User className="w-16 h-16 text-[#DAA520]/50" />
                </div>
              )}
              <ImageUpload
                label="Foto de Perfil"
                value={profileData.profile_image_url}
                onChange={(url) => setProfileData({ ...profileData, profile_image_url: url })}
              />
            </div>

            <div>
              <Label className="text-slate-300 mb-2 block">Nome</Label>
              <Input
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="bg-[#0B1120]/50 border-slate-700 text-slate-200 rounded-xl h-12 px-4"
              />
            </div>

            <div>
              <Label className="text-slate-300 mb-2 block">Perfil</Label>
              <div className="bg-[#0B1120]/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-300 capitalize">
                {user.role === 'admin' ? 'Administradora' : 'Mentorada'}
              </div>
            </div>

            <Button
              onClick={updateProfile}
              disabled={updatingProfile}
              className="w-full bg-[#DAA520] text-[#0B1120] hover:bg-[#B8860B] font-medium px-8 py-3 rounded-full transition-all duration-300"
            >
              {updatingProfile ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>

        {/* País, Telefone e Endereço */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
          <div className="flex items-center space-x-2 mb-6">
            <Globe className="w-6 h-6 text-[#DAA520]" />
            <h2 className="text-2xl font-heading font-medium text-slate-200">Localização & Contato</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-slate-300 mb-2 block">País</Label>
              <Select 
                value={profileData.country_code} 
                onValueChange={(v) => {
                  const country = COUNTRIES.find(c => c.code === v);
                  setProfileData({ 
                    ...profileData, 
                    country_code: v,
                    country: country?.name || '',
                    currency: country?.currency || 'BRL'
                  });
                }}
              >
                <SelectTrigger className="bg-[#0B1120]/50 border-slate-700 text-slate-200 rounded-xl h-12">
                  <SelectValue>
                    {selectedCountry ? `${selectedCountry.flag} ${selectedCountry.name}` : 'Selecione...'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#111827] border-white/10">
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      <span className="flex items-center gap-2">
                        <span className="text-xl">{c.flag}</span>
                        <span>{c.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-300 mb-2 block">Telefone</Label>
              <div className="flex gap-2">
                <div className="bg-[#0B1120]/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-300 flex items-center gap-2 min-w-[100px]">
                  <span className="text-xl">{selectedCountry?.flag}</span>
                  <span>{selectedCountry?.phone}</span>
                </div>
                <Input
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className="bg-[#0B1120]/50 border-slate-700 text-slate-200 rounded-xl h-12 px-4 flex-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-slate-300 mb-2 block">Endereço</Label>
              <Textarea
                value={profileData.address}
                onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                placeholder="Rua, número, bairro, cidade..."
                className="bg-[#0B1120]/50 border-slate-700 text-slate-200 rounded-xl px-4 min-h-[80px]"
              />
            </div>

            <div>
              <Label className="text-slate-300 mb-2 block">Moeda Preferida</Label>
              <Select 
                value={profileData.currency} 
                onValueChange={(v) => setProfileData({ ...profileData, currency: v })}
              >
                <SelectTrigger className="bg-[#0B1120]/50 border-slate-700 text-slate-200 rounded-xl h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#111827] border-white/10">
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.symbol} - {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={updateProfile}
              disabled={updatingProfile}
              className="w-full bg-[#DAA520] text-[#0B1120] hover:bg-[#B8860B] font-medium px-8 py-3 rounded-full transition-all duration-300"
            >
              {updatingProfile ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
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
