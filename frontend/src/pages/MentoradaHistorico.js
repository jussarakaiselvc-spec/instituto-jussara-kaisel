import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  User, ArrowLeft, BookOpen, Video, CheckSquare, DollarSign, Calendar,
  Pencil, Check, X, FileText, Clock, CreditCard, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import ImageUpload from '@/components/ImageUpload';
import { COUNTRIES, CURRENCIES, getCurrencyByCode } from '@/utils/countries';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MentoradaHistorico = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(false);
  const [userData, setUserData] = useState({});
  const [expandedMentoria, setExpandedMentoria] = useState(null);
  const [editingParcela, setEditingParcela] = useState(null);
  const [parcelaData, setParcelaData] = useState({});

  useEffect(() => {
    fetchHistorico();
  }, [userId]);

  const fetchHistorico = async () => {
    try {
      const response = await axios.get(`${API}/mentorada/${userId}/historico`);
      setData(response.data);
      setUserData(response.data.user);
      if (response.data.mentorias.length > 0) {
        setExpandedMentoria(response.data.mentorias[0].mentorada_mentoria.mentorada_mentoria_id);
      }
    } catch (error) {
      console.error('Error fetching historico:', error);
      toast.error('Erro ao carregar histórico da mentorada');
    } finally {
      setLoading(false);
    }
  };

  const saveUserData = async () => {
    try {
      await axios.put(`${API}/mentorada/${userId}/dados`, userData);
      toast.success('Dados atualizados com sucesso!');
      setEditingUser(false);
      fetchHistorico();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao atualizar dados');
    }
  };

  const updateParcela = async () => {
    try {
      await axios.put(`${API}/parcelas/${editingParcela.parcela_id}`, parcelaData);
      toast.success('Parcela atualizada!');
      setEditingParcela(null);
      fetchHistorico();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao atualizar parcela');
    }
  };

  const toggleParcelaStatus = async (parcela) => {
    const newStatus = parcela.status === 'pendente' ? 'paga' : 'pendente';
    try {
      await axios.put(`${API}/parcelas/${parcela.parcela_id}`, {
        ...parcela,
        status: newStatus,
        data_pagamento: newStatus === 'paga' ? new Date().toISOString() : null,
      });
      toast.success(`Parcela marcada como ${newStatus === 'paga' ? 'paga' : 'pendente'}`);
      fetchHistorico();
    } catch (error) {
      toast.error('Erro ao atualizar parcela');
    }
  };

  const formatCurrency = (value, currencyCode = 'BRL') => {
    const currency = getCurrencyByCode(currencyCode);
    const symbol = currency?.symbol || 'R$';
    return `${symbol} ${value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`;
  };

  const selectedCountry = COUNTRIES.find(c => c.code === userData.country_code);

  if (loading) {
    return (
      <div className="p-6 md:p-12 flex items-center justify-center min-h-screen">
        <div className="text-[#DAA520] text-xl font-heading">Carregando...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 md:p-12">
        <p className="text-slate-400">Mentorada não encontrada</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="text-slate-400 hover:text-[#DAA520]"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-semibold text-[#DAA520]">
            Histórico - {data.user.name}
          </h1>
          <p className="text-slate-400">{data.user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dados Cadastrais */}
        <div className="lg:col-span-1">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 sticky top-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-[#DAA520]" />
                <h2 className="text-xl font-heading text-slate-200">Dados Cadastrais</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingUser(!editingUser)}
                className="text-[#DAA520] hover:bg-[#DAA520]/10"
              >
                {editingUser ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
              </Button>
            </div>

            {/* Profile Image */}
            <div className="flex flex-col items-center mb-6">
              {userData.profile_image_url ? (
                <img 
                  src={userData.profile_image_url} 
                  alt="Foto"
                  className="w-24 h-24 rounded-full object-cover border-4 border-[#DAA520]/30 mb-4"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-[#DAA520]/20 flex items-center justify-center border-4 border-[#DAA520]/30 mb-4">
                  <User className="w-12 h-12 text-[#DAA520]/50" />
                </div>
              )}
              {editingUser && (
                <ImageUpload
                  label="Foto de Perfil"
                  value={userData.profile_image_url}
                  onChange={(url) => setUserData({ ...userData, profile_image_url: url })}
                />
              )}
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-slate-400 text-xs">Nome</Label>
                {editingUser ? (
                  <Input
                    value={userData.name || ''}
                    onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                    className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
                  />
                ) : (
                  <p className="text-slate-200">{userData.name}</p>
                )}
              </div>

              <div>
                <Label className="text-slate-400 text-xs">Email</Label>
                {editingUser ? (
                  <Input
                    type="email"
                    value={userData.email || ''}
                    onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                    className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
                  />
                ) : (
                  <p className="text-slate-200">{userData.email}</p>
                )}
              </div>

              <div>
                <Label className="text-slate-400 text-xs">País</Label>
                {editingUser ? (
                  <Select 
                    value={userData.country_code || 'BR'} 
                    onValueChange={(v) => {
                      const country = COUNTRIES.find(c => c.code === v);
                      setUserData({ 
                        ...userData, 
                        country_code: v,
                        country: country?.name || '',
                        currency: country?.currency || 'BRL'
                      });
                    }}
                  >
                    <SelectTrigger className="bg-[#0B1120]/50 border-slate-700 text-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111827] border-white/10">
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.flag} {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-slate-200 flex items-center gap-2">
                    {selectedCountry?.flag} {userData.country || 'Não informado'}
                  </p>
                )}
              </div>

              <div>
                <Label className="text-slate-400 text-xs">Telefone</Label>
                {editingUser ? (
                  <div className="flex gap-2">
                    <span className="bg-[#0B1120]/50 border border-slate-700 rounded px-3 py-2 text-slate-300 text-sm">
                      {selectedCountry?.flag} {selectedCountry?.phone}
                    </span>
                    <Input
                      value={userData.phone || ''}
                      onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                      className="bg-[#0B1120]/50 border-slate-700 text-slate-200 flex-1"
                    />
                  </div>
                ) : (
                  <p className="text-slate-200">
                    {userData.phone ? `${selectedCountry?.phone || ''} ${userData.phone}` : 'Não informado'}
                  </p>
                )}
              </div>

              <div>
                <Label className="text-slate-400 text-xs">Endereço</Label>
                {editingUser ? (
                  <Textarea
                    value={userData.address || ''}
                    onChange={(e) => setUserData({ ...userData, address: e.target.value })}
                    className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
                    rows={2}
                  />
                ) : (
                  <p className="text-slate-200">{userData.address || 'Não informado'}</p>
                )}
              </div>

              <div>
                <Label className="text-slate-400 text-xs">Moeda</Label>
                {editingUser ? (
                  <Select 
                    value={userData.currency || 'BRL'} 
                    onValueChange={(v) => setUserData({ ...userData, currency: v })}
                  >
                    <SelectTrigger className="bg-[#0B1120]/50 border-slate-700 text-slate-200">
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
                ) : (
                  <p className="text-slate-200">
                    {getCurrencyByCode(userData.currency)?.symbol || 'R$'} - {getCurrencyByCode(userData.currency)?.name || 'Real'}
                  </p>
                )}
              </div>

              {editingUser && (
                <Button
                  onClick={saveUserData}
                  className="w-full bg-[#DAA520] text-[#0B1120] hover:bg-[#B8860B]"
                >
                  Salvar Alterações
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Mentorias e Histórico */}
        <div className="lg:col-span-2 space-y-6">
          {data.mentorias.length === 0 ? (
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
              <p className="text-slate-400">Esta mentorada ainda não está vinculada a nenhuma mentoria.</p>
            </div>
          ) : (
            data.mentorias.map((m) => {
              const isExpanded = expandedMentoria === m.mentorada_mentoria.mentorada_mentoria_id;
              const tarefasFeitas = m.tarefas.filter(t => t.status === 'concluida').length;
              const parcelasPagas = m.parcelas.filter(p => p.status === 'paga').length;
              const valorPago = m.parcelas.filter(p => p.status === 'paga').reduce((sum, p) => sum + p.valor, 0);
              const currency = m.financeiro?.currency || userData.currency || 'BRL';

              return (
                <div key={m.mentorada_mentoria.mentorada_mentoria_id} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  {/* Header da Mentoria */}
                  <button
                    onClick={() => setExpandedMentoria(isExpanded ? null : m.mentorada_mentoria.mentorada_mentoria_id)}
                    className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#DAA520]/20 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-[#DAA520]" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-xl font-heading text-slate-200">{m.mentoria?.name || 'Mentoria'}</h3>
                        <p className="text-sm text-slate-400">
                          Início: {new Date(m.mentorada_mentoria.start_date).toLocaleDateString('pt-BR')} • 
                          Status: <span className={m.mentorada_mentoria.status === 'ativa' ? 'text-green-400' : 'text-yellow-400'}>{m.mentorada_mentoria.status}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden md:block">
                        <p className="text-sm text-slate-400">{m.sessoes.length} sessões • {tarefasFeitas}/{m.tarefas.length} tarefas</p>
                        <p className="text-sm text-[#DAA520]">{parcelasPagas}/{m.parcelas.length} parcelas pagas</p>
                      </div>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </div>
                  </button>

                  {/* Conteúdo Expandido */}
                  {isExpanded && (
                    <div className="border-t border-white/10 p-6 space-y-6">
                      {/* Sessões */}
                      <div>
                        <h4 className="text-lg font-heading text-slate-200 flex items-center gap-2 mb-4">
                          <Video className="w-5 h-5 text-[#DAA520]" />
                          Sessões ({m.sessoes.length})
                        </h4>
                        <div className="space-y-3">
                          {m.sessoes.length === 0 ? (
                            <p className="text-slate-400 text-sm">Nenhuma sessão registrada</p>
                          ) : (
                            m.sessoes.map((s) => (
                              <div key={s.sessao_id} className="p-4 bg-[#0B1120]/50 rounded-xl border border-slate-700">
                                <div className="flex items-start gap-3">
                                  <span className="w-8 h-8 rounded-full bg-[#DAA520]/20 flex items-center justify-center text-[#DAA520] font-bold text-sm flex-shrink-0">
                                    {s.session_number}
                                  </span>
                                  <div className="flex-1">
                                    <p className="text-slate-200 font-medium">{s.tema || 'Sem tema'}</p>
                                    <p className="text-xs text-slate-400">{new Date(s.session_date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    {s.resumo && <p className="text-sm text-slate-300 mt-2">{s.resumo}</p>}
                                    <div className="flex gap-2 mt-2">
                                      {s.video_url && <a href={s.video_url} target="_blank" rel="noopener noreferrer" className="text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded">Vídeo</a>}
                                      {s.audio_url && <a href={s.audio_url} target="_blank" rel="noopener noreferrer" className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded">Áudio</a>}
                                      {s.drive_url && <a href={s.drive_url} target="_blank" rel="noopener noreferrer" className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded">Materiais</a>}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Tarefas */}
                      <div>
                        <h4 className="text-lg font-heading text-slate-200 flex items-center gap-2 mb-4">
                          <CheckSquare className="w-5 h-5 text-[#DAA520]" />
                          Tarefas ({tarefasFeitas}/{m.tarefas.length} feitas)
                        </h4>
                        <div className="space-y-2">
                          {m.tarefas.length === 0 ? (
                            <p className="text-slate-400 text-sm">Nenhuma tarefa registrada</p>
                          ) : (
                            m.tarefas.map((t) => (
                              <div key={t.tarefa_id} className="p-3 bg-[#0B1120]/50 rounded-xl border border-slate-700 flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${t.status === 'concluida' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                  {t.status === 'concluida' ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                </div>
                                <div className="flex-1">
                                  <p className="text-slate-200 text-sm">{t.descricao}</p>
                                  {t.due_date && <p className="text-xs text-slate-400">Prazo: {new Date(t.due_date).toLocaleDateString('pt-BR')}</p>}
                                </div>
                                <span className={`text-xs px-2 py-1 rounded ${t.status === 'concluida' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                  {t.status === 'concluida' ? 'Feita' : 'Pendente'}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Financeiro */}
                      <div>
                        <h4 className="text-lg font-heading text-slate-200 flex items-center gap-2 mb-4">
                          <DollarSign className="w-5 h-5 text-[#DAA520]" />
                          Financeiro
                        </h4>
                        {m.financeiro ? (
                          <div className="space-y-4">
                            {/* Resumo Financeiro */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="p-4 bg-[#0B1120]/50 rounded-xl border border-slate-700">
                                <p className="text-xs text-slate-400">Valor Total</p>
                                <p className="text-lg font-heading text-[#DAA520]">{formatCurrency(m.financeiro.valor_total, currency)}</p>
                              </div>
                              <div className="p-4 bg-[#0B1120]/50 rounded-xl border border-slate-700">
                                <p className="text-xs text-slate-400">Já Pago</p>
                                <p className="text-lg font-heading text-green-400">{formatCurrency(valorPago, currency)}</p>
                              </div>
                              <div className="p-4 bg-[#0B1120]/50 rounded-xl border border-slate-700">
                                <p className="text-xs text-slate-400">Pendente</p>
                                <p className="text-lg font-heading text-yellow-400">{formatCurrency(m.financeiro.valor_total - valorPago, currency)}</p>
                              </div>
                              <div className="p-4 bg-[#0B1120]/50 rounded-xl border border-slate-700">
                                <p className="text-xs text-slate-400">Parcelas</p>
                                <p className="text-lg font-heading text-slate-200">{parcelasPagas}/{m.parcelas.length}</p>
                              </div>
                            </div>

                            {/* Lista de Parcelas */}
                            <div className="space-y-2">
                              <p className="text-sm text-slate-400 mb-2">Parcelas:</p>
                              {m.parcelas.map((p) => (
                                <div key={p.parcela_id} className="p-3 bg-[#0B1120]/50 rounded-xl border border-slate-700 flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={() => toggleParcelaStatus(p)}
                                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${p.status === 'paga' ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'}`}
                                    >
                                      {p.status === 'paga' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                    </button>
                                    <div>
                                      <p className="text-slate-200 text-sm">Parcela {p.numero_parcela}</p>
                                      <p className="text-xs text-slate-400">
                                        Venc: {new Date(p.data_vencimento).toLocaleDateString('pt-BR')}
                                        {p.data_pagamento && ` • Pago: ${new Date(p.data_pagamento).toLocaleDateString('pt-BR')}`}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <p className="text-slate-200 font-medium">{formatCurrency(p.valor, currency)}</p>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingParcela(p);
                                        setParcelaData({
                                          ...p,
                                          data_vencimento: p.data_vencimento?.split('T')[0] || '',
                                          data_pagamento: p.data_pagamento?.split('T')[0] || '',
                                        });
                                      }}
                                      className="text-slate-400 hover:text-[#DAA520]"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-slate-400 text-sm">Nenhum registro financeiro</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Dialog Editar Parcela */}
      <Dialog open={!!editingParcela} onOpenChange={(open) => !open && setEditingParcela(null)}>
        <DialogContent className="bg-[#111827] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-[#DAA520] font-heading">Editar Parcela {parcelaData.numero_parcela}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Valor</Label>
              <Input
                type="number"
                step="0.01"
                value={parcelaData.valor || ''}
                onChange={(e) => setParcelaData({ ...parcelaData, valor: parseFloat(e.target.value) })}
                className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
              />
            </div>
            <div>
              <Label className="text-slate-300">Data de Vencimento</Label>
              <Input
                type="date"
                value={parcelaData.data_vencimento || ''}
                onChange={(e) => setParcelaData({ ...parcelaData, data_vencimento: e.target.value })}
                className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
              />
            </div>
            <div>
              <Label className="text-slate-300">Status</Label>
              <Select 
                value={parcelaData.status || 'pendente'} 
                onValueChange={(v) => setParcelaData({ ...parcelaData, status: v })}
              >
                <SelectTrigger className="bg-[#0B1120]/50 border-slate-700 text-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#111827] border-white/10">
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="paga">Paga</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">Data do Pagamento</Label>
              <Input
                type="date"
                value={parcelaData.data_pagamento || ''}
                onChange={(e) => setParcelaData({ ...parcelaData, data_pagamento: e.target.value })}
                className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
              />
            </div>
            <Button
              onClick={updateParcela}
              className="w-full bg-[#DAA520] text-[#0B1120] hover:bg-[#B8860B]"
            >
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MentoradaHistorico;
