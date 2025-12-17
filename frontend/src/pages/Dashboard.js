import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { MessageCircle, BookOpen, CheckSquare, CreditCard, Calendar, Video, FileText, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = ({ user }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [sessoes, setSessoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const [dashRes, sessoesRes] = await Promise.all([
        axios.get(`${API}/dashboard`),
        axios.get(`${API}/minha-mentoria/sessoes`).catch(() => ({ data: [] })),
      ]);
      setDashboardData(dashRes.data);
      setSessoes(sessoesRes.data || []);
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

  if (!dashboardData?.has_active_mentoria) {
    return (
      <div className="p-6 md:p-12">
        <h1 className="text-4xl md:text-5xl font-heading font-semibold text-[#DAA520] mb-4" data-testid="dashboard-title">
          Dashboard
        </h1>
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <p className="text-slate-300 text-lg">{dashboardData?.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12">
      <h1 className="text-4xl md:text-5xl font-heading font-semibold text-[#DAA520] mb-8" data-testid="dashboard-title">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Hero Card */}
        <div className="col-span-1 md:col-span-8 relative overflow-hidden rounded-2xl bg-[#111827]/80 backdrop-blur-md border border-white/5 shadow-xl p-8 group hover:border-[#DAA520]/30 transition-all duration-500">
          <div className="absolute inset-0 opacity-10">
            <img
              src="https://images.unsplash.com/photo-1661760386386-4c3f63586f82?crop=entropy&cs=srgb&fm=jpg&q=85"
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-4">
              <BookOpen className="w-6 h-6 text-[#DAA520]" />
              <span className="text-sm tracking-wide uppercase opacity-70 text-slate-400">Mentoria Ativa</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-heading font-medium text-[#DAA520] mb-6" data-testid="mentoria-name">
              {dashboardData.mentoria_name}
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-400 mb-1">Sessão Atual</p>
                <p className="text-2xl font-heading text-slate-200" data-testid="current-session">{dashboardData.current_session}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Mensagens Não Lidas</p>
                <p className="text-2xl font-heading text-slate-200" data-testid="unread-messages">{dashboardData.unread_messages}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-span-1 md:col-span-4 space-y-6">
          <div className="relative overflow-hidden rounded-2xl bg-[#111827]/80 backdrop-blur-md border border-white/5 shadow-xl p-6 group hover:border-[#DAA520]/30 transition-all duration-500">
            <CheckSquare className="w-8 h-8 text-[#DAA520] mb-3" />
            <h3 className="text-lg font-heading font-medium text-slate-200 mb-2">Próxima Tarefa</h3>
            <p className="text-sm text-slate-400 mb-4" data-testid="next-task">{dashboardData.next_task}</p>
            <Button
              onClick={() => navigate('/tarefas')}
              data-testid="view-tasks-button"
              className="w-full bg-transparent border border-[#DAA520]/50 text-[#DAA520] hover:bg-[#DAA520]/10 px-4 py-2 rounded-full transition-all duration-300"
            >
              Ver Tarefas
            </Button>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-[#111827]/80 backdrop-blur-md border border-white/5 shadow-xl p-6 group hover:border-[#DAA520]/30 transition-all duration-500">
            <CreditCard className="w-8 h-8 text-[#DAA520] mb-3" />
            <h3 className="text-lg font-heading font-medium text-slate-200 mb-2">Status Financeiro</h3>
            <p className="text-sm text-slate-400 mb-4" data-testid="financial-status">{dashboardData.financial_status}</p>
            <Button
              onClick={() => navigate('/financeiro')}
              data-testid="view-financial-button"
              className="w-full bg-transparent border border-[#DAA520]/50 text-[#DAA520] hover:bg-[#DAA520]/10 px-4 py-2 rounded-full transition-all duration-300"
            >
              Ver Detalhes
            </Button>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-[#111827]/80 backdrop-blur-md border border-white/5 shadow-xl p-6 group hover:border-[#DAA520]/30 transition-all duration-500">
            <Calendar className="w-8 h-8 text-[#DAA520] mb-3" />
            <h3 className="text-lg font-heading font-medium text-slate-200 mb-2">Agendamentos</h3>
            <p className="text-sm text-slate-400 mb-4">Agende sua próxima sessão</p>
            <Button
              onClick={() => navigate('/calendario')}
              data-testid="view-calendar-button"
              className="w-full bg-transparent border border-[#DAA520]/50 text-[#DAA520] hover:bg-[#DAA520]/10 px-4 py-2 rounded-full transition-all duration-300"
            >
              Ver Agenda
            </Button>
          </div>
        </div>

        {/* Message Button */}
        <div className="col-span-1 md:col-span-12">
          <div className="relative overflow-hidden rounded-2xl bg-[#111827]/80 backdrop-blur-md border border-white/5 shadow-xl p-6 group hover:border-[#DAA520]/30 transition-all duration-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-[#DAA520]/10 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-[#DAA520]" />
                </div>
                <div>
                  <h3 className="text-lg font-heading font-medium text-slate-200">Enviar Mensagem para a Mentora</h3>
                  <p className="text-sm text-slate-400">Entre em contato sempre que precisar</p>
                </div>
              </div>
              <Button
                onClick={() => navigate('/mensagens')}
                data-testid="send-message-button"
                className="bg-[#DAA520] text-[#0B1120] hover:bg-[#B8860B] font-medium px-8 py-3 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(218,165,32,0.3)] hover:shadow-[0_0_25px_rgba(218,165,32,0.5)]"
              >
                Mensagens
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
