import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, TrendingUp, AlertCircle, CheckCircle, User, Plus, Pencil, Trash2, CreditCard, Building, Smartphone, Handshake, X, Calendar, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { CURRENCIES, getCurrencyByCode } from '@/utils/countries';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const FORMAS_PAGAMENTO = [
  { value: 'cartao_credito', label: 'Cartão de Crédito', icon: CreditCard },
  { value: 'deposito_bancario', label: 'Depósito Bancário', icon: Building },
  { value: 'pix', label: 'PIX', icon: Smartphone },
  { value: 'paypal', label: 'PayPal', icon: DollarSign },
  { value: 'parcelamento_especial', label: 'Parcelamento Especial (direto)', icon: Handshake },
];

const FinanceiroAdmin = () => {
  const [financeiros, setFinanceiros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [mentoradaMentorias, setMentoradaMentorias] = useState([]);
  const [users, setUsers] = useState([]);
  const [mentorias, setMentorias] = useState([]);
  
  // Form states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newFinanceiro, setNewFinanceiro] = useState({
    mentorada_mentoria_id: '',
    valor_total: '',
    forma_pagamento: '',
    numero_parcelas: 1,
    currency: 'BRL',
    data_pagamento: '',
    observacoes: '',
  });
  const [creating, setCreating] = useState(false);
  
  // Edit states
  const [editingFinanceiro, setEditingFinanceiro] = useState(null);
  const [editData, setEditData] = useState({
    valor_total: '',
    forma_pagamento: '',
    numero_parcelas: 1,
    currency: 'BRL',
    data_pagamento: '',
    observacoes: '',
  });

  useEffect(() => {
    fetchFinanceiros();
    fetchMentoradaMentorias();
  }, []);

  const fetchFinanceiros = async () => {
    try {
      const response = await axios.get(`${API}/admin/financeiro-overview`);
      setFinanceiros(response.data);
    } catch (error) {
      console.error('Error fetching financeiros:', error);
      toast.error('Erro ao carregar informações financeiras');
    } finally {
      setLoading(false);
    }
  };

  const fetchMentoradaMentorias = async () => {
    try {
      const [mmRes, usersRes, mentoriasRes] = await Promise.all([
        axios.get(`${API}/mentorada-mentorias/all`),
        axios.get(`${API}/users`),
        axios.get(`${API}/mentorias`),
      ]);
      setMentoradaMentorias(mmRes.data);
      setUsers(usersRes.data);
      setMentorias(mentoriasRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const getMentoradaMentoriaLabel = (mm) => {
    const user = users.find(u => u.user_id === mm.user_id);
    const mentoria = mentorias.find(m => m.mentoria_id === mm.mentoria_id);
    return `${user?.name || 'N/A'} - ${mentoria?.name || 'N/A'}`;
  };

  const createFinanceiro = async () => {
    if (!newFinanceiro.mentorada_mentoria_id || !newFinanceiro.valor_total || !newFinanceiro.forma_pagamento) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    
    setCreating(true);
    try {
      const payload = {
        ...newFinanceiro,
        valor_total: parseFloat(newFinanceiro.valor_total),
        numero_parcelas: parseInt(newFinanceiro.numero_parcelas),
      };
      if (newFinanceiro.data_pagamento) {
        payload.data_pagamento = new Date(newFinanceiro.data_pagamento).toISOString();
      }
      await axios.post(`${API}/financeiro`, payload);
      toast.success('Registro financeiro criado com sucesso!');
      setCreateDialogOpen(false);
      setNewFinanceiro({
        mentorada_mentoria_id: '',
        valor_total: '',
        forma_pagamento: '',
        numero_parcelas: 1,
        currency: 'BRL',
        data_pagamento: '',
        observacoes: '',
      });
      fetchFinanceiros();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao criar registro financeiro');
    } finally {
      setCreating(false);
    }
  };

  const updateFinanceiro = async () => {
    try {
      const payload = {
        valor_total: parseFloat(editData.valor_total),
        forma_pagamento: editData.forma_pagamento,
        numero_parcelas: parseInt(editData.numero_parcelas),
        currency: editData.currency,
        observacoes: editData.observacoes,
      };
      if (editData.data_pagamento) {
        payload.data_pagamento = new Date(editData.data_pagamento).toISOString();
      }
      await axios.put(`${API}/financeiro/${editingFinanceiro.financeiro_id}`, payload);
      toast.success('Registro financeiro atualizado!');
      setEditingFinanceiro(null);
      fetchFinanceiros();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao atualizar');
    }
  };

  const deleteFinanceiro = async (financeiroId) => {
    if (!window.confirm('Tem certeza que deseja excluir este registro financeiro e todas as parcelas?')) {
      return;
    }
    try {
      await axios.delete(`${API}/financeiro/${financeiroId}`);
      toast.success('Registro financeiro excluído!');
      fetchFinanceiros();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao excluir');
    }
  };

  const openEditFinanceiro = (financeiro) => {
    setEditingFinanceiro(financeiro);
    setEditData({
      valor_total: financeiro.valor_total.toString(),
      forma_pagamento: financeiro.forma_pagamento,
      numero_parcelas: financeiro.total_parcelas,
      currency: financeiro.currency || 'BRL',
      data_pagamento: financeiro.data_pagamento ? financeiro.data_pagamento.split('T')[0] : '',
      observacoes: financeiro.observacoes || '',
    });
  };

  const formatCurrency = (value, currencyCode = 'BRL') => {
    const currency = getCurrencyByCode(currencyCode);
    const symbol = currency?.symbol || 'R$';
    return `${symbol} ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const updateParcelaStatus = async (parcela) => {
    const newStatus = parcela.status === 'pendente' ? 'paga' : 'pendente';
    const dataPagamento = newStatus === 'paga' ? new Date().toISOString() : null;
    
    try {
      await axios.put(`${API}/parcelas/${parcela.parcela_id}`, {
        ...parcela,
        status: newStatus,
        data_pagamento: dataPagamento,
      });
      toast.success(`Parcela marcada como ${newStatus === 'paga' ? 'paga' : 'pendente'}!`);
      fetchFinanceiros();
    } catch (error) {
      toast.error('Erro ao atualizar parcela');
    }
  };

  const getFormaPagamentoLabel = (value) => {
    const forma = FORMAS_PAGAMENTO.find(f => f.value === value);
    return forma?.label || value;
  };

  const getFormaPagamentoIcon = (value) => {
    const forma = FORMAS_PAGAMENTO.find(f => f.value === value);
    return forma?.icon || DollarSign;
  };

  if (loading) {
    return <div className="text-slate-400 text-center py-8">Carregando...</div>;
  }

  // Calculate totals
  const totalReceita = financeiros.reduce((sum, f) => sum + f.valor_total, 0);
  const totalPagas = financeiros.reduce((sum, f) => sum + f.parcelas_pagas_count, 0);
  const totalParcelas = financeiros.reduce((sum, f) => sum + f.total_parcelas, 0);
  const valorRecebido = financeiros.reduce((sum, f) => sum + f.valor_recebido, 0);

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-heading font-medium text-slate-200">Visão Geral</h3>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#DAA520] text-[#0B1120] hover:bg-[#B8860B]">
              <Plus className="w-4 h-4 mr-2" />
              Novo Registro
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#111827] border-white/10 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[#DAA520] font-heading">Criar Registro Financeiro</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300">Mentorada/Mentoria *</Label>
                <Select 
                  value={newFinanceiro.mentorada_mentoria_id} 
                  onValueChange={(v) => setNewFinanceiro({ ...newFinanceiro, mentorada_mentoria_id: v })}
                >
                  <SelectTrigger className="bg-[#0B1120]/50 border-slate-700 text-slate-200">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111827] border-white/10">
                    {mentoradaMentorias.map((mm) => (
                      <SelectItem key={mm.mentorada_mentoria_id} value={mm.mentorada_mentoria_id}>
                        {getMentoradaMentoriaLabel(mm)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">Valor Total (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newFinanceiro.valor_total}
                  onChange={(e) => setNewFinanceiro({ ...newFinanceiro, valor_total: e.target.value })}
                  placeholder="0.00"
                  className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
                />
              </div>
              <div>
                <Label className="text-slate-300">Forma de Pagamento *</Label>
                <Select 
                  value={newFinanceiro.forma_pagamento} 
                  onValueChange={(v) => setNewFinanceiro({ ...newFinanceiro, forma_pagamento: v })}
                >
                  <SelectTrigger className="bg-[#0B1120]/50 border-slate-700 text-slate-200">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111827] border-white/10">
                    {FORMAS_PAGAMENTO.map((forma) => {
                      const Icon = forma.icon;
                      return (
                        <SelectItem key={forma.value} value={forma.value}>
                          <div className="flex items-center space-x-2">
                            <Icon className="w-4 h-4" />
                            <span>{forma.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">Número de Parcelas</Label>
                <Input
                  type="number"
                  min="1"
                  value={newFinanceiro.numero_parcelas}
                  onChange={(e) => setNewFinanceiro({ ...newFinanceiro, numero_parcelas: e.target.value })}
                  className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
                />
              </div>
              <div>
                <Label className="text-slate-300">Moeda</Label>
                <Select 
                  value={newFinanceiro.currency} 
                  onValueChange={(v) => setNewFinanceiro({ ...newFinanceiro, currency: v })}
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
              </div>
              <div>
                <Label className="text-slate-300">Data do Pagamento</Label>
                <Input
                  type="date"
                  value={newFinanceiro.data_pagamento}
                  onChange={(e) => setNewFinanceiro({ ...newFinanceiro, data_pagamento: e.target.value })}
                  className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
                />
              </div>
              <div>
                <Label className="text-slate-300">Observações</Label>
                <Textarea
                  value={newFinanceiro.observacoes}
                  onChange={(e) => setNewFinanceiro({ ...newFinanceiro, observacoes: e.target.value })}
                  placeholder="Anotações sobre o pagamento..."
                  className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
                />
              </div>
              <Button
                onClick={createFinanceiro}
                disabled={creating}
                className="w-full bg-[#DAA520] text-[#0B1120] hover:bg-[#B8860B]"
              >
                {creating ? 'Criando...' : 'Criar Registro'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#0B1120]/50 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="w-5 h-5 text-[#DAA520]" />
            <span className="text-slate-400 text-sm">Receita Total</span>
          </div>
          <p className="text-2xl font-heading text-[#DAA520]" data-testid="receita-total-admin">
            R$ {totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-[#0B1120]/50 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <span className="text-slate-400 text-sm">Já Recebido</span>
          </div>
          <p className="text-2xl font-heading text-green-400" data-testid="valor-recebido">
            R$ {valorRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-[#0B1120]/50 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-slate-400 text-sm">Parcelas Pagas</span>
          </div>
          <p className="text-2xl font-heading text-slate-200" data-testid="parcelas-pagas-total">
            {totalPagas} / {totalParcelas}
          </p>
        </div>

        <div className="bg-[#0B1120]/50 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            <span className="text-slate-400 text-sm">A Receber</span>
          </div>
          <p className="text-2xl font-heading text-yellow-400" data-testid="a-receber">
            R$ {(totalReceita - valorRecebido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {financeiros.length === 0 ? (
        <div className="text-center py-12">
          <DollarSign className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Nenhuma informação financeira cadastrada ainda</p>
          <p className="text-slate-500 text-sm mt-2">Clique em "Novo Registro" para adicionar</p>
        </div>
      ) : (
        <>
          {/* Detailed List */}
          <div className="space-y-4">
            <h3 className="text-xl font-heading font-medium text-slate-200">Por Mentorada</h3>
            {financeiros.map((financeiro, index) => {
              const percentPago = financeiro.total_parcelas > 0 
                ? (financeiro.parcelas_pagas_count / financeiro.total_parcelas) * 100 
                : 0;
              const isExpanded = expandedId === financeiro.financeiro_id;
              const FormaPagamentoIcon = getFormaPagamentoIcon(financeiro.forma_pagamento);

              return (
                <div
                  key={financeiro.financeiro_id}
                  data-testid={`financeiro-${index}`}
                  className="bg-[#0B1120]/50 border border-slate-700 rounded-xl p-6 hover:border-[#DAA520]/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-[#DAA520]/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-[#DAA520]" />
                      </div>
                      <div>
                        <h4 className="text-lg font-heading text-slate-200">{financeiro.mentorada_name}</h4>
                        <p className="text-sm text-slate-400">{financeiro.mentoria_name}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="text-right">
                        <p className="text-2xl font-heading text-[#DAA520]">
                          R$ {financeiro.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <div className="flex items-center justify-end space-x-1 mt-1">
                          <FormaPagamentoIcon className="w-4 h-4 text-slate-400" />
                          <p className="text-sm text-slate-400">{getFormaPagamentoLabel(financeiro.forma_pagamento)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditFinanceiro(financeiro)}
                          className="text-slate-400 hover:text-[#DAA520] hover:bg-[#DAA520]/10"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteFinanceiro(financeiro.financeiro_id)}
                          className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-slate-400">
                        {financeiro.parcelas_pagas_count} de {financeiro.total_parcelas} parcelas pagas
                      </span>
                      <span className="text-[#DAA520] font-medium">{percentPago.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-[#DAA520] transition-all duration-500"
                        style={{ width: `${percentPago}%` }}
                      />
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Recebido</p>
                      <p className="text-sm font-medium text-green-400">
                        R$ {financeiro.valor_recebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Pendente</p>
                      <p className="text-sm font-medium text-yellow-400">
                        R$ {(financeiro.valor_total - financeiro.valor_recebido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Parcelas</p>
                      <p className="text-sm font-medium text-slate-200">
                        {financeiro.parcelas_pendentes_count} pendentes
                      </p>
                    </div>
                  </div>

                  {/* Expandable Parcelas */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : financeiro.financeiro_id)}
                    className="mt-4 text-[#DAA520] hover:text-[#B8860B] text-sm transition-colors"
                  >
                    {isExpanded ? 'Ocultar parcelas' : 'Ver detalhes das parcelas'}
                  </button>

                  {isExpanded && financeiro.parcelas && (
                    <div className="mt-4 space-y-2 border-t border-slate-700 pt-4">
                      {financeiro.parcelas.map((parcela, pIndex) => (
                        <div
                          key={parcela.parcela_id}
                          className="flex items-center justify-between p-3 bg-[#111827] rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => updateParcelaStatus(parcela)}
                              className="focus:outline-none"
                              title={parcela.status === 'paga' ? 'Marcar como pendente' : 'Marcar como paga'}
                            >
                              {parcela.status === 'paga' ? (
                                <CheckCircle className="w-5 h-5 text-green-400 hover:text-green-300" />
                              ) : (
                                <AlertCircle className="w-5 h-5 text-yellow-400 hover:text-yellow-300" />
                              )}
                            </button>
                            <div>
                              <p className="text-sm text-slate-200">
                                Parcela {parcela.numero_parcela}
                              </p>
                              <p className="text-xs text-slate-500">
                                Vence: {new Date(parcela.data_vencimento).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-slate-200">
                              R$ {parcela.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                parcela.status === 'paga'
                                  ? 'bg-green-500/10 text-green-400'
                                  : 'bg-yellow-500/10 text-yellow-400'
                              }`}
                            >
                              {parcela.status === 'paga' ? 'Paga' : 'Pendente'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingFinanceiro} onOpenChange={(open) => !open && setEditingFinanceiro(null)}>
        <DialogContent className="bg-[#111827] border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#DAA520] font-heading">Editar Registro Financeiro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Valor Total (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={editData.valor_total}
                onChange={(e) => setEditData({ ...editData, valor_total: e.target.value })}
                className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
              />
            </div>
            <div>
              <Label className="text-slate-300">Forma de Pagamento</Label>
              <Select 
                value={editData.forma_pagamento} 
                onValueChange={(v) => setEditData({ ...editData, forma_pagamento: v })}
              >
                <SelectTrigger className="bg-[#0B1120]/50 border-slate-700 text-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#111827] border-white/10">
                  {FORMAS_PAGAMENTO.map((forma) => {
                    const Icon = forma.icon;
                    return (
                      <SelectItem key={forma.value} value={forma.value}>
                        <div className="flex items-center space-x-2">
                          <Icon className="w-4 h-4" />
                          <span>{forma.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">Número de Parcelas</Label>
              <Input
                type="number"
                min="1"
                value={editData.numero_parcelas}
                onChange={(e) => setEditData({ ...editData, numero_parcelas: e.target.value })}
                className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
              />
            </div>
            <div>
              <Label className="text-slate-300">Observações</Label>
              <Textarea
                value={editData.observacoes}
                onChange={(e) => setEditData({ ...editData, observacoes: e.target.value })}
                className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
              />
            </div>
            <Button
              onClick={updateFinanceiro}
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

export default FinanceiroAdmin;
