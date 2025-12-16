import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CreditCard, Calendar, CheckCircle, Circle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Financeiro = ({ user }) => {
  const [financeiro, setFinanceiro] = useState(null);
  const [parcelas, setParcelas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMentoria, setActiveMentoria] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get active mentoria
      const mentoriasResponse = await axios.get(`${API}/mentorada-mentorias/my`);
      const active = mentoriasResponse.data.find(m => m.status === 'ativa') || mentoriasResponse.data[0];
      
      if (active) {
        setActiveMentoria(active);
        
        try {
          // Get financeiro
          const financeiroResponse = await axios.get(`${API}/financeiro/mentoria/${active.mentorada_mentoria_id}`);
          setFinanceiro(financeiroResponse.data);
          
          // Get parcelas
          const parcelasResponse = await axios.get(`${API}/parcelas/financeiro/${financeiroResponse.data.financeiro_id}`);
          setParcelas(parcelasResponse.data);
        } catch (error) {
          // Financeiro not configured yet
          console.log('Financeiro not configured');
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar informações financeiras');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-12 flex items-center justify-center min-h-screen">
        <div className="text-[#DAA520] text-xl font-heading">Carregando...</div>
      </div>
    );
  }

  if (!activeMentoria || !financeiro) {
    return (
      <div className="p-6 md:p-12">
        <h1 className="text-4xl md:text-5xl font-heading font-semibold text-[#DAA520] mb-4" data-testid="financeiro-title">
          Financeiro
        </h1>
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <p className="text-slate-300 text-lg">Informações financeiras ainda não configuradas.</p>
        </div>
      </div>
    );
  }

  const parcelasPagas = parcelas.filter(p => p.status === 'paga').length;
  const totalParcelas = parcelas.length;
  const percentagePago = totalParcelas > 0 ? (parcelasPagas / totalParcelas) * 100 : 0;

  return (
    <div className="p-6 md:p-12">
      <h1 className="text-4xl md:text-5xl font-heading font-semibold text-[#DAA520] mb-8" data-testid="financeiro-title">
        Financeiro
      </h1>

      <div className="space-y-6">
        {/* Summary Card */}
        <div className="relative overflow-hidden rounded-2xl bg-[#111827]/80 backdrop-blur-md border border-white/5 shadow-xl p-8">
          <div className="flex items-center space-x-2 mb-6">
            <CreditCard className="w-6 h-6 text-[#DAA520]" />
            <h3 className="text-2xl font-heading font-medium text-slate-200">Resumo Financeiro</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <p className="text-sm text-slate-400 mb-1">Valor Total</p>
              <p className="text-3xl font-heading text-[#DAA520]" data-testid="valor-total">
                R$ {financeiro.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Forma de Pagamento</p>
              <p className="text-lg text-slate-200" data-testid="forma-pagamento">{financeiro.forma_pagamento}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Parcelas Pagas</p>
              <p className="text-lg text-slate-200" data-testid="parcelas-pagas">{parcelasPagas} / {totalParcelas}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-[#DAA520] transition-all duration-500"
                style={{ width: `${percentagePago}%` }}
                data-testid="progress-bar"
              />
            </div>
            <p className="text-sm text-slate-400 mt-2 text-right">{percentagePago.toFixed(0)}% pago</p>
          </div>

          {financeiro.observacoes && (
            <div className="p-4 bg-[#0B1120]/50 rounded-xl border border-slate-700">
              <p className="text-sm text-slate-400 mb-2">Observações:</p>
              <p className="text-slate-300" data-testid="observacoes">{financeiro.observacoes}</p>
            </div>
          )}
        </div>

        {/* Parcelas List */}
        <div className="relative overflow-hidden rounded-2xl bg-[#111827]/80 backdrop-blur-md border border-white/5 shadow-xl p-8">
          <h3 className="text-2xl font-heading font-medium text-slate-200 mb-6">Parcelas</h3>

          <div className="space-y-4">
            {parcelas.map((parcela, index) => (
              <div
                key={parcela.parcela_id}
                data-testid={`parcela-${index}`}
                className="flex items-center justify-between p-4 bg-[#0B1120]/50 rounded-xl border border-slate-700 hover:border-[#DAA520]/30 transition-all duration-300"
              >
                <div className="flex items-center space-x-4">
                  {parcela.status === 'paga' ? (
                    <CheckCircle className="w-6 h-6 text-[#DAA520]" />
                  ) : (
                    <Circle className="w-6 h-6 text-slate-500" />
                  )}
                  <div>
                    <p className="text-lg text-slate-200 font-medium" data-testid={`parcela-numero-${index}`}>
                      Parcela {parcela.numero_parcela} de {totalParcelas}
                    </p>
                    <div className="flex items-center space-x-2 text-sm text-slate-400 mt-1">
                      <Calendar className="w-4 h-4" />
                      <span>Vencimento: {new Date(parcela.data_vencimento).toLocaleDateString('pt-BR')}</span>
                    </div>
                    {parcela.data_pagamento && (
                      <p className="text-sm text-[#DAA520] mt-1">
                        Pago em: {new Date(parcela.data_pagamento).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-heading text-slate-200" data-testid={`parcela-valor-${index}`}>
                    R$ {parcela.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                    parcela.status === 'paga'
                      ? 'bg-[#DAA520]/10 text-[#DAA520]'
                      : 'bg-slate-700 text-slate-400'
                  }`}>
                    {parcela.status === 'paga' ? 'Paga' : 'Pendente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Financeiro;
