import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarIcon, Clock, Plus, Video, Music } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Calendario = ({ user }) => {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mentoradasMentorias, setMentoradasMentorias] = useState([]);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [newAgendamento, setNewAgendamento] = useState({
    mentorada_mentoria_id: '',
    session_number: 1,
    tema: '',
    session_date: '',
    session_time: '10:00',
    video_url: '',
    audio_url: '',
    resumo: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      if (user.role === 'admin') {
        // Buscar todas as mentorias ativas
        const response = await axios.get(`${API}/mentorada-mentorias/all`);
        setMentoradasMentorias(response.data);
      } else {
        // Buscar minhas mentorias
        const response = await axios.get(`${API}/mentorada-mentorias/my`);
        setMentoradasMentorias(response.data);
      }

      // Buscar agendamentos
      const agendamentosResponse = await axios.get(`${API}/agendamentos`);
      setAgendamentos(agendamentosResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar calendário');
    } finally {
      setLoading(false);
    }
  };

  const createAgendamento = async () => {
    setCreating(true);
    try {
      const dateTime = `${newAgendamento.session_date}T${newAgendamento.session_time}:00Z`;
      await axios.post(`${API}/agendamentos`, {
        mentorada_mentoria_id: newAgendamento.mentorada_mentoria_id,
        session_number: parseInt(newAgendamento.session_number),
        tema: newAgendamento.tema,
        session_date: dateTime,
        video_url: newAgendamento.video_url,
        audio_url: newAgendamento.audio_url,
        resumo: newAgendamento.resumo,
        status: 'agendada',
      });
      toast.success('Sessão agendada com sucesso!');
      setDialogOpen(false);
      setNewAgendamento({
        mentorada_mentoria_id: '',
        session_number: 1,
        tema: '',
        session_date: '',
        session_time: '10:00',
        video_url: '',
        audio_url: '',
        resumo: '',
      });
      fetchData();
    } catch (error) {
      console.error('Error creating agendamento:', error);
      toast.error('Erro ao agendar sessão');
    } finally {
      setCreating(false);
    }
  };

  const confirmarSessao = async (agendamentoId, agendamento) => {
    try {
      // Criar sessão real
      await axios.post(`${API}/sessoes`, {
        mentorada_mentoria_id: agendamento.mentorada_mentoria_id,
        session_number: agendamento.session_number,
        tema: agendamento.tema,
        session_date: agendamento.session_date,
        video_url: agendamento.video_url,
        audio_url: agendamento.audio_url,
        resumo: agendamento.resumo,
      });

      // Atualizar status do agendamento
      await axios.put(`${API}/agendamentos/${agendamentoId}`, {
        ...agendamento,
        status: 'realizada',
      });

      toast.success('Sessão confirmada e criada!');
      fetchData();
    } catch (error) {
      console.error('Error confirming session:', error);
      toast.error('Erro ao confirmar sessão');
    }
  };

  const cancelarSessao = async (agendamentoId, agendamento) => {
    try {
      await axios.put(`${API}/agendamentos/${agendamentoId}`, {
        ...agendamento,
        status: 'cancelada',
      });
      toast.success('Sessão cancelada');
      fetchData();
    } catch (error) {
      console.error('Error canceling session:', error);
      toast.error('Erro ao cancelar sessão');
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-12 flex items-center justify-center min-h-screen">
        <div className="text-[#DAA520] text-xl font-heading">Carregando...</div>
      </div>
    );
  }

  const agendamentosAgrupados = agendamentos.reduce((acc, agendamento) => {
    const date = new Date(agendamento.session_date).toLocaleDateString('pt-BR');
    if (!acc[date]) acc[date] = [];
    acc[date].push(agendamento);
    return acc;
  }, {});

  return (
    <div className="p-6 md:p-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl md:text-5xl font-heading font-semibold text-[#DAA520]" data-testid="calendario-title">
          Calendário
        </h1>
        {user.role === 'admin' && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="create-agendamento-button" className="bg-[#DAA520] text-[#0B1120] hover:bg-[#B8860B]">
                <Plus className="w-4 h-4 mr-2" />
                Agendar Sessão
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#111827] border-white/10 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-[#DAA520] font-heading text-2xl">Agendar Nova Sessão</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div>
                  <Label className="text-slate-300">Mentoria</Label>
                  <Select
                    value={newAgendamento.mentorada_mentoria_id}
                    onValueChange={(v) => setNewAgendamento({ ...newAgendamento, mentorada_mentoria_id: v })}
                  >
                    <SelectTrigger data-testid="agendamento-mentoria-select" className="bg-[#0B1120]/50 border-slate-700 text-slate-200">
                      <SelectValue placeholder="Selecione a mentoria" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111827] border-white/10">
                      {mentoradasMentorias.map((mm) => (
                        <SelectItem key={mm.mentorada_mentoria_id} value={mm.mentorada_mentoria_id}>
                          {mm.mentorada_mentoria_id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">Número da Sessão</Label>
                    <Input
                      type="number"
                      value={newAgendamento.session_number}
                      onChange={(e) => setNewAgendamento({ ...newAgendamento, session_number: e.target.value })}
                      data-testid="agendamento-number-input"
                      className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Tema</Label>
                    <Input
                      value={newAgendamento.tema}
                      onChange={(e) => setNewAgendamento({ ...newAgendamento, tema: e.target.value })}
                      data-testid="agendamento-tema-input"
                      className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">Data</Label>
                    <Input
                      type="date"
                      value={newAgendamento.session_date}
                      onChange={(e) => setNewAgendamento({ ...newAgendamento, session_date: e.target.value })}
                      data-testid="agendamento-date-input"
                      className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Horário</Label>
                    <Input
                      type="time"
                      value={newAgendamento.session_time}
                      onChange={(e) => setNewAgendamento({ ...newAgendamento, session_time: e.target.value })}
                      data-testid="agendamento-time-input"
                      className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-slate-300">Link do Vídeo (YouTube - opcional)</Label>
                  <Input
                    value={newAgendamento.video_url}
                    onChange={(e) => setNewAgendamento({ ...newAgendamento, video_url: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                    data-testid="agendamento-video-input"
                    className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Link do Áudio (Spotify - opcional)</Label>
                  <Input
                    value={newAgendamento.audio_url}
                    onChange={(e) => setNewAgendamento({ ...newAgendamento, audio_url: e.target.value })}
                    placeholder="https://open.spotify.com/..."
                    data-testid="agendamento-audio-input"
                    className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Resumo (opcional)</Label>
                  <Textarea
                    value={newAgendamento.resumo}
                    onChange={(e) => setNewAgendamento({ ...newAgendamento, resumo: e.target.value })}
                    data-testid="agendamento-resumo-input"
                    className="bg-[#0B1120]/50 border-slate-700 text-slate-200 min-h-[100px]"
                  />
                </div>
                <Button
                  onClick={createAgendamento}
                  disabled={creating}
                  data-testid="submit-agendamento-button"
                  className="w-full bg-[#DAA520] text-[#0B1120] hover:bg-[#B8860B]"
                >
                  {creating ? 'Agendando...' : 'Agendar Sessão'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {Object.keys(agendamentosAgrupados).length === 0 ? (
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <CalendarIcon className="w-16 h-16 text-[#DAA520] mx-auto mb-4" />
          <p className="text-slate-300 text-lg">Nenhuma sessão agendada ainda.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(agendamentosAgrupados)
            .sort(([dateA], [dateB]) => new Date(dateA.split('/').reverse().join('-')) - new Date(dateB.split('/').reverse().join('-')))
            .map(([date, sessoes]) => (
              <div key={date} className="space-y-4">
                <h2 className="text-2xl font-heading font-medium text-slate-200 flex items-center space-x-2">
                  <CalendarIcon className="w-6 h-6 text-[#DAA520]" />
                  <span>{date}</span>
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  {sessoes.map((sessao, index) => (
                    <div
                      key={sessao.agendamento_id}
                      data-testid={`agendamento-${index}`}
                      className="relative overflow-hidden rounded-2xl bg-[#111827]/80 backdrop-blur-md border border-white/5 shadow-xl p-6 group hover:border-[#DAA520]/30 transition-all duration-500"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-[#DAA520]/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-[#DAA520] font-heading text-xl font-semibold">{sessao.session_number}</span>
                            </div>
                            <div>
                              <h3 className="text-xl font-heading font-medium text-slate-200">{sessao.tema}</h3>
                              <div className="flex items-center space-x-2 text-slate-400 mt-1">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm">
                                  {new Date(sessao.session_date).toLocaleTimeString('pt-BR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>

                          {sessao.resumo && (
                            <p className="text-slate-300 mb-4">{sessao.resumo}</p>
                          )}

                          <div className="flex items-center space-x-4">
                            {sessao.video_url && (
                              <div className="flex items-center space-x-2 text-sm text-slate-400">
                                <Video className="w-4 h-4 text-[#DAA520]" />
                                <span>Vídeo disponível</span>
                              </div>
                            )}
                            {sessao.audio_url && (
                              <div className="flex items-center space-x-2 text-sm text-slate-400">
                                <Music className="w-4 h-4 text-[#DAA520]" />
                                <span>Áudio disponível</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end space-y-2">
                          <span
                            className={`px-4 py-2 rounded-full text-xs font-medium ${
                              sessao.status === 'agendada'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                : sessao.status === 'realizada'
                                ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                                : 'bg-red-500/10 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {sessao.status === 'agendada'
                              ? 'Agendada'
                              : sessao.status === 'realizada'
                              ? 'Realizada'
                              : 'Cancelada'}
                          </span>

                          {user.role === 'admin' && sessao.status === 'agendada' && (
                            <div className="flex space-x-2 mt-2">
                              <Button
                                onClick={() => confirmarSessao(sessao.agendamento_id, sessao)}
                                data-testid={`confirm-${index}`}
                                className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded-full"
                              >
                                Confirmar
                              </Button>
                              <Button
                                onClick={() => cancelarSessao(sessao.agendamento_id, sessao)}
                                data-testid={`cancel-${index}`}
                                className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded-full"
                              >
                                Cancelar
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default Calendario;
