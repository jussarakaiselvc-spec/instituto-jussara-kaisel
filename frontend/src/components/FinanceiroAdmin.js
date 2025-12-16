import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, TrendingUp, AlertCircle, CheckCircle, User } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const FinanceiroAdmin = () => {
  const [financeiros, setFinanceiros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchFinanceiros();
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

  if (loading) {
    return <div className="text-slate-400 text-center py-8">Carregando...</div>;
  }

  if (financeiros.length === 0) {
    return (
      <div className="text-center py-12">
        <DollarSign className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">Nenhuma informação financeira cadastrada ainda</p>
      </div>
    );
  }

  // Calculate totals
  const totalReceita = financeiros.reduce((sum, f) => sum + f.valor_total, 0);
  const totalPagas = financeiros.reduce((sum, f) => sum + f.parcelas_pagas_count, 0);
  const totalParcelas = financeiros.reduce((sum, f) => sum + f.total_parcelas, 0);
  const valorRecebido = financeiros.reduce((sum, f) => sum + f.valor_recebido, 0);

  return (
    <div className="space-y-6">
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

      {/* Detailed List */}
      <div className="space-y-4">
        <h3 className="text-xl font-heading font-medium text-slate-200">Por Mentorada</h3>
        {financeiros.map((financeiro, index) => {
          const percentPago = financeiro.total_parcelas > 0 
            ? (financeiro.parcelas_pagas_count / financeiro.total_parcelas) * 100 
            : 0;
          const isExpanded = expandedId === financeiro.financeiro_id;

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
                <div className="text-right">
                  <p className="text-2xl font-heading text-[#DAA520]">
                    R$ {financeiro.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-slate-400">{financeiro.forma_pagamento}</p>
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
                        {parcela.status === 'paga' ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-yellow-400" />
                        )}
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
    </div>
  );
};

export default FinanceiroAdmin;
