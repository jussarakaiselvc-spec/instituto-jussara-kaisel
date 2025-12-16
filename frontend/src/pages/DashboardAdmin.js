import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, CheckSquare, DollarSign, Package, TrendingUp, Calendar, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DashboardAdmin = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${API}/admin/dashboard`);
      setStats(response.data.stats);
      setRecentActivities(response.data.recent_activities);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      toast.error('Erro ao carregar dashboard');
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

  return (
    <div className="p-6 md:p-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-heading font-semibold text-[#DAA520]" data-testid="dashboard-title">
            Dashboard Administrativa
          </h1>
          <p className="text-slate-400 mt-2">Visão geral do Instituto Jussara Kaisel</p>
        </div>
        <Button
          onClick={() => navigate('/admin')}
          data-testid="go-to-admin-button"
          className="bg-[#DAA520] text-[#0B1120] hover:bg-[#B8860B]"
        >
          Painel Completo
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-[#DAA520]/30 transition-all duration-500">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-[#DAA520]" />
            <span className="text-2xl font-heading font-semibold text-slate-200" data-testid="total-mentoradas">
              {stats?.total_mentoradas || 0}
            </span>
          </div>
          <h3 className="text-slate-400 text-sm">Mentoradas Ativas</h3>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-[#DAA520]/30 transition-all duration-500">
          <div className="flex items-center justify-between mb-4">
            <BookOpen className="w-8 h-8 text-[#DAA520]" />
            <span className="text-2xl font-heading font-semibold text-slate-200" data-testid="total-mentorias">
              {stats?.total_mentorias || 0}
            </span>
          </div>
          <h3 className="text-slate-400 text-sm">Mentorias Criadas</h3>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-[#DAA520]/30 transition-all duration-500">
          <div className="flex items-center justify-between mb-4">
            <CheckSquare className="w-8 h-8 text-[#DAA520]" />
            <span className="text-2xl font-heading font-semibold text-slate-200" data-testid="tarefas-pendentes">
              {stats?.tarefas_pendentes || 0}
            </span>
          </div>
          <h3 className="text-slate-400 text-sm">Tarefas Pendentes</h3>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-[#DAA520]/30 transition-all duration-500">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-[#DAA520]" />
            <span className="text-2xl font-heading font-semibold text-slate-200" data-testid="receita-mes">
              R$ {stats?.receita_mes?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
            </span>
          </div>
          <h3 className="text-slate-400 text-sm">Receita Este Mês</h3>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
          <h2 className="text-2xl font-heading font-medium text-slate-200 mb-6">Ações Rápidas</h2>
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => navigate('/admin?tab=mentoradas')}
              data-testid="quick-mentorada"
              className="bg-[#111827] hover:bg-[#1E293B] text-slate-200 border border-white/10 hover:border-[#DAA520]/30 rounded-xl h-24 flex flex-col items-center justify-center space-y-2 transition-all"
            >
              <Users className="w-6 h-6 text-[#DAA520]" />
              <span>Nova Mentorada</span>
            </Button>
            <Button
              onClick={() => navigate('/admin?tab=mentorias')}
              data-testid="quick-mentoria"
              className="bg-[#111827] hover:bg-[#1E293B] text-slate-200 border border-white/10 hover:border-[#DAA520]/30 rounded-xl h-24 flex flex-col items-center justify-center space-y-2 transition-all"
            >
              <BookOpen className="w-6 h-6 text-[#DAA520]" />
              <span>Nova Mentoria</span>
            </Button>
            <Button
              onClick={() => navigate('/admin?tab=sessoes')}
              data-testid="quick-sessao"
              className="bg-[#111827] hover:bg-[#1E293B] text-slate-200 border border-white/10 hover:border-[#DAA520]/30 rounded-xl h-24 flex flex-col items-center justify-center space-y-2 transition-all"
            >
              <Calendar className="w-6 h-6 text-[#DAA520]" />
              <span>Nova Sessão</span>
            </Button>
            <Button
              onClick={() => navigate('/admin?tab=produtos')}
              data-testid="quick-produto"
              className="bg-[#111827] hover:bg-[#1E293B] text-slate-200 border border-white/10 hover:border-[#DAA520]/30 rounded-xl h-24 flex flex-col items-center justify-center space-y-2 transition-all"
            >
              <Package className="w-6 h-6 text-[#DAA520]" />
              <span>Novo Produto</span>
            </Button>
          </div>
        </div>

        {/* Financial Overview */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-heading font-medium text-slate-200">Visão Financeira</h2>
            <Button
              onClick={() => navigate('/admin?tab=financeiro')}
              className="text-[#DAA520] hover:text-[#B8860B] text-sm"
              variant="ghost"
            >
              Ver Tudo
            </Button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#0B1120]/50 rounded-xl border border-slate-700">
              <div>
                <p className="text-slate-400 text-sm">Parcelas Pagas Este Mês</p>
                <p className="text-2xl font-heading text-green-400" data-testid="parcelas-pagas">{stats?.parcelas_pagas_mes || 0}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
            <div className="flex items-center justify-between p-4 bg-[#0B1120]/50 rounded-xl border border-slate-700">
              <div>
                <p className="text-slate-400 text-sm">Parcelas Pendentes</p>
                <p className="text-2xl font-heading text-yellow-400" data-testid="parcelas-pendentes">{stats?.parcelas_pendentes || 0}</p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-400" />
            </div>
            <div className="flex items-center justify-between p-4 bg-[#0B1120]/50 rounded-xl border border-slate-700">
              <div>
                <p className="text-slate-400 text-sm">Receita Total</p>
                <p className="text-2xl font-heading text-[#DAA520]" data-testid="receita-total">
                  R$ {stats?.receita_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-[#DAA520]" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
        <h2 className="text-2xl font-heading font-medium text-slate-200 mb-6">Atividades Recentes</h2>
        {recentActivities.length === 0 ? (
          <p className="text-slate-400 text-center py-8">Nenhuma atividade recente</p>
        ) : (
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div
                key={index}
                className="flex items-start space-x-4 p-4 bg-[#0B1120]/50 rounded-xl border border-slate-700 hover:border-[#DAA520]/30 transition-all"
                data-testid={`activity-${index}`}
              >
                <div className="w-10 h-10 rounded-full bg-[#DAA520]/10 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-5 h-5 text-[#DAA520]" />
                </div>
                <div className="flex-1">
                  <p className="text-slate-200">{activity.description}</p>
                  <p className="text-slate-500 text-sm mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardAdmin;
