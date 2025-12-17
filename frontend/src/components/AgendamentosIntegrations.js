import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Link as LinkIcon, Settings, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AgendamentosIntegrations = () => {
  const [calendlyUrl, setCalendlyUrl] = useState('');
  const [youCanBookMeUrl, setYouCanBookMeUrl] = useState('');
  const [googleCalendarId, setGoogleCalendarId] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const saveSettings = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/admin/scheduling-settings`, {
        calendly_url: calendlyUrl,
        youcanbookme_url: youCanBookMeUrl,
        google_calendar_id: googleCalendarId
      });
      toast.success('Configurações salvas com sucesso! As mentoradas agora podem ver seus links de agendamento.');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(`${API}/admin/scheduling-settings`);
        setCalendlyUrl(response.data.calendly_url || '');
        setYouCanBookMeUrl(response.data.youcanbookme_url || '');
        setGoogleCalendarId(response.data.google_calendar_id || '');
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
        <div className="flex items-center space-x-3 mb-4">
          <Calendar className="w-8 h-8 text-[#DAA520]" />
          <h2 className="text-3xl font-heading font-semibold text-[#DAA520]">Integrações de Agendamento</h2>
        </div>
        <p className="text-slate-300 leading-relaxed">
          Escolha seu serviço de agendamento preferido ou use vários ao mesmo tempo. 
          Configure suas URLs personalizadas abaixo.
        </p>
      </div>

      {/* Configurações */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
        <div className="flex items-center space-x-2 mb-6">
          <Settings className="w-6 h-6 text-[#DAA520]" />
          <h3 className="text-2xl font-heading font-medium text-slate-200">Configurações</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-slate-300 mb-2 block">URL do Calendly</Label>
            <Input
              value={calendlyUrl}
              onChange={(e) => setCalendlyUrl(e.target.value)}
              placeholder="https://calendly.com/seu-usuario"
              className="bg-[#0B1120]/50 border-slate-700 focus:border-[#DAA520] text-slate-200"
            />
            <p className="text-xs text-slate-500 mt-1">
              Encontre sua URL em: Calendly → Share → Copy Link
            </p>
          </div>
          <div>
            <Label className="text-slate-300 mb-2 block">URL do YouCanBookMe</Label>
            <Input
              value={youCanBookMeUrl}
              onChange={(e) => setYouCanBookMeUrl(e.target.value)}
              placeholder="https://seu-usuario.youcanbook.me"
              className="bg-[#0B1120]/50 border-slate-700 focus:border-[#DAA520] text-slate-200"
            />
            <p className="text-xs text-slate-500 mt-1">
              Sua URL personalizada do YouCanBookMe
            </p>
          </div>
          <div className="md:col-span-2">
            <Label className="text-slate-300 mb-2 block">ID do Google Calendar (opcional)</Label>
            <Input
              value={googleCalendarId}
              onChange={(e) => setGoogleCalendarId(e.target.value)}
              placeholder="seu-email@gmail.com ou ID do calendário público"
              className="bg-[#0B1120]/50 border-slate-700 focus:border-[#DAA520] text-slate-200"
            />
            <p className="text-xs text-slate-500 mt-1">
              Para calendário público: Google Calendar → Configurações → Integrar calendário
            </p>
          </div>
        </div>
        <Button
          onClick={saveSettings}
          disabled={saving}
          className="mt-6 bg-[#DAA520] text-[#0B1120] hover:bg-[#B8860B]"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>

      {/* Calendários */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
        <Tabs defaultValue="calendly" className="space-y-6">
          <TabsList className="bg-[#111827]/80 border border-white/10">
            <TabsTrigger value="calendly">
              <LinkIcon className="w-4 h-4 mr-2" />
              Calendly
            </TabsTrigger>
            <TabsTrigger value="youcanbookme">
              <Calendar className="w-4 h-4 mr-2" />
              YouCanBookMe
            </TabsTrigger>
            <TabsTrigger value="google">
              <Calendar className="w-4 h-4 mr-2" />
              Google Agenda
            </TabsTrigger>
          </TabsList>

          {/* Calendly */}
          <TabsContent value="calendly" className="space-y-4">
            <div>
              <h3 className="text-xl font-heading font-medium text-slate-200 mb-4">Calendly</h3>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-6">
                <h4 className="text-lg font-heading font-medium text-blue-300 mb-3">Como Configurar:</h4>
                <ol className="list-decimal list-inside space-y-2 text-slate-300 text-sm">
                  <li>Crie sua conta gratuita em <a href="https://calendly.com" target="_blank" rel="noopener noreferrer" className="text-[#DAA520] hover:underline">calendly.com</a></li>
                  <li>Configure seus tipos de eventos (sessões individuais, mentorias em grupo, etc.)</li>
                  <li>Copie sua URL personalizada e cole no campo acima</li>
                  <li>Clique em "Salvar Configurações"</li>
                  <li>Seu calendário aparecerá abaixo automaticamente</li>
                </ol>
              </div>

              {calendlyUrl && (
                <div className="bg-[#0B1120]/50 border border-slate-700 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                    <span className="text-slate-300 text-sm">Seu Calendly</span>
                    <a
                      href={calendlyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#DAA520] hover:text-[#B8860B] text-sm flex items-center space-x-1"
                    >
                      <span>Abrir em nova aba</span>
                      <LinkIcon className="w-4 h-4" />
                    </a>
                  </div>
                  <div
                    className="calendly-inline-widget"
                    data-url={calendlyUrl}
                    style={{ minWidth: '320px', height: '700px' }}
                  >
                    <iframe
                      src={calendlyUrl}
                      width="100%"
                      height="700"
                      frameBorder="0"
                      title="Calendly"
                    />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* YouCanBookMe */}
          <TabsContent value="youcanbookme" className="space-y-4">
            <div>
              <h3 className="text-xl font-heading font-medium text-slate-200 mb-4">YouCanBookMe</h3>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-6">
                <h4 className="text-lg font-heading font-medium text-blue-300 mb-3">Como Configurar:</h4>
                <ol className="list-decimal list-inside space-y-2 text-slate-300 text-sm">
                  <li>Crie sua conta em <a href="https://youcanbook.me" target="_blank" rel="noopener noreferrer" className="text-[#DAA520] hover:underline">youcanbook.me</a></li>
                  <li>Configure seu calendário de disponibilidade</li>
                  <li>Conecte com seu Google Calendar para sincronização</li>
                  <li>Copie sua URL (exemplo: seu-nome.youcanbook.me)</li>
                  <li>Cole no campo acima e salve</li>
                </ol>
                <div className="mt-4 p-4 bg-[#0B1120]/50 rounded-lg">
                  <p className="text-xs text-slate-400 mb-2">💡 Webhook para notificações automáticas:</p>
                  <code className="text-xs bg-[#0B1120] px-2 py-1 rounded text-[#DAA520] block overflow-x-auto">
                    {window.location.origin}/api/youcanbookme/webhook
                  </code>
                </div>
              </div>

              {youCanBookMeUrl && (
                <div className="bg-[#0B1120]/50 border border-slate-700 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                    <span className="text-slate-300 text-sm">Seu YouCanBookMe</span>
                    <a
                      href={youCanBookMeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#DAA520] hover:text-[#B8860B] text-sm flex items-center space-x-1"
                    >
                      <span>Abrir em nova aba</span>
                      <LinkIcon className="w-4 h-4" />
                    </a>
                  </div>
                  <iframe
                    src={youCanBookMeUrl}
                    width="100%"
                    height="700"
                    frameBorder="0"
                    title="YouCanBookMe"
                  />
                </div>
              )}
            </div>
          </TabsContent>

          {/* Google Calendar */}
          <TabsContent value="google" className="space-y-4">
            <div>
              <h3 className="text-xl font-heading font-medium text-slate-200 mb-4">Google Agenda</h3>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-6">
                <h4 className="text-lg font-heading font-medium text-blue-300 mb-3">Opções de Integração:</h4>
                
                <div className="space-y-4">
                  <div>
                    <h5 className="text-slate-200 font-medium mb-2">Opção 1: Calendário Público (Visualização)</h5>
                    <ol className="list-decimal list-inside space-y-2 text-slate-300 text-sm">
                      <li>Abra <a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer" className="text-[#DAA520] hover:underline">Google Calendar</a></li>
                      <li>Clique em Configurações → Configurações do calendário</li>
                      <li>Selecione o calendário que deseja compartilhar</li>
                      <li>Role até "Integrar calendário" e copie o ID do calendário</li>
                      <li>Cole no campo acima e marque como público</li>
                    </ol>
                  </div>

                  <div>
                    <h5 className="text-slate-200 font-medium mb-2">Opção 2: Sincronização Completa (Página Perfil)</h5>
                    <p className="text-slate-300 text-sm mb-2">
                      Para sincronização bidirecional completa (criar eventos automaticamente):
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-slate-300 text-sm">
                      <li>Vá para sua página de <span className="text-[#DAA520]">Perfil</span></li>
                      <li>Clique em "Conectar Google Calendar"</li>
                      <li>Autorize o acesso à sua agenda</li>
                      <li>Sessões agendadas aparecerão automaticamente</li>
                    </ol>
                  </div>

                  <div>
                    <h5 className="text-slate-200 font-medium mb-2">Opção 3: Link Direto de Agendamento</h5>
                    <p className="text-slate-300 text-sm mb-2">
                      Use o Google Calendar Appointment Scheduling:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-slate-300 text-sm">
                      <li>Ative "Appointment scheduling" no Google Calendar</li>
                      <li>Configure horários de disponibilidade</li>
                      <li>Copie o link de agendamento</li>
                      <li>Mentoradas podem agendar diretamente</li>
                    </ol>
                  </div>
                </div>
              </div>

              {googleCalendarId ? (
                <div className="bg-[#0B1120]/50 border border-slate-700 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-slate-700">
                    <span className="text-slate-300 text-sm">Seu Google Calendar</span>
                  </div>
                  <iframe
                    src={`https://calendar.google.com/calendar/embed?src=${encodeURIComponent(googleCalendarId)}&ctz=America/Sao_Paulo`}
                    style={{ border: 0 }}
                    width="100%"
                    height="600"
                    frameBorder="0"
                    scrolling="no"
                    title="Google Calendar"
                  />
                </div>
              ) : (
                <div className="text-center py-12 bg-[#0B1120]/50 border border-slate-700 rounded-xl">
                  <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 mb-4">Configure seu ID do Google Calendar acima para visualizar</p>
                  <p className="text-slate-500 text-sm">ou use a opção de sincronização completa na página Perfil</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Tips */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
        <h3 className="text-xl font-heading font-medium text-slate-200 mb-4">💡 Dicas</h3>
        <ul className="space-y-2 text-slate-300 text-sm">
          <li>✅ <strong>Calendly</strong>: Melhor para múltiplos tipos de eventos e integração com Zoom/Meet</li>
          <li>✅ <strong>YouCanBookMe</strong>: Ideal para sincronização simples com Google Calendar</li>
          <li>✅ <strong>Google Agenda</strong>: Perfeito se você já usa Gmail e quer controle total</li>
          <li>💡 Você pode usar todos ao mesmo tempo! As mentoradas escolhem qual preferem</li>
          <li>🔔 Configure notificações para receber avisos de novos agendamentos</li>
        </ul>
      </div>
    </div>
  );
};

export default AgendamentosIntegrations;
