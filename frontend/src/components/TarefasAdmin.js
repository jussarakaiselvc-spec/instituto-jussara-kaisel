import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle, Circle, User, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TarefasAdmin = () => {
  const [tarefas, setTarefas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pendente, concluida

  useEffect(() => {
    fetchTarefas();
  }, []);

  const fetchTarefas = async () => {
    try {
      const response = await axios.get(`${API}/admin/tarefas-overview`);
      setTarefas(response.data);
    } catch (error) {
      console.error('Error fetching tarefas:', error);
      toast.error('Erro ao carregar tarefas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-slate-400 text-center py-8">Carregando...</div>;
  }

  const filteredTarefas = filter === 'all' 
    ? tarefas 
    : tarefas.filter(t => t.status === filter);

  const totalPendentes = tarefas.filter(t => t.status === 'pendente').length;
  const totalConcluidas = tarefas.filter(t => t.status === 'concluida').length;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            filter === 'all'
              ? 'bg-[#DAA520] text-[#0B1120]'
              : 'bg-[#0B1120]/50 text-slate-400 hover:text-slate-200'
          }`}
        >
          Todas ({tarefas.length})
        </button>
        <button
          onClick={() => setFilter('pendente')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            filter === 'pendente'
              ? 'bg-yellow-500 text-[#0B1120]'
              : 'bg-[#0B1120]/50 text-slate-400 hover:text-slate-200'
          }`}
        >
          Pendentes ({totalPendentes})
        </button>
        <button
          onClick={() => setFilter('concluida')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            filter === 'concluida'
              ? 'bg-green-500 text-[#0B1120]'
              : 'bg-[#0B1120]/50 text-slate-400 hover:text-slate-200'
          }`}
        >
          Concluídas ({totalConcluidas})
        </button>
      </div>

      {filteredTarefas.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Nenhuma tarefa encontrada</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTarefas.map((tarefa, index) => (
            <div
              key={tarefa.tarefa_id}
              data-testid={`tarefa-admin-${index}`}
              className="bg-[#0B1120]/50 border border-slate-700 rounded-xl p-6 hover:border-[#DAA520]/30 transition-all"
            >
              <div className="flex items-start space-x-4">
                {tarefa.status === 'concluida' ? (
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                ) : (
                  <Circle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
                )}
                
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className={`text-lg text-slate-200 mb-2 ${tarefa.status === 'concluida' ? 'line-through opacity-60' : ''}`}>
                        {tarefa.descricao}
                      </p>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 text-sm text-slate-400">
                          <User className="w-4 h-4 text-[#DAA520]" />
                          <span>{tarefa.mentorada_name}</span>
                        </div>
                        {tarefa.due_date && (
                          <div className="flex items-center space-x-2 text-sm text-slate-400">
                            <Calendar className="w-4 h-4 text-[#DAA520]" />
                            <span>Prazo: {new Date(tarefa.due_date).toLocaleDateString('pt-BR')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        tarefa.status === 'concluida'
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-yellow-500/10 text-yellow-400'
                      }`}
                    >
                      {tarefa.status === 'concluida' ? 'Concluída' : 'Pendente'}
                    </span>
                  </div>

                  <p className="text-sm text-slate-500 mb-2">Mentoria: {tarefa.mentoria_name}</p>

                  {tarefa.reflexao && (
                    <div className="mt-4 p-4 bg-[#111827] rounded-lg border border-slate-700">
                      <p className="text-xs text-slate-500 mb-2">Reflexão da mentorada:</p>
                      <p className="text-sm text-slate-300">{tarefa.reflexao}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TarefasAdmin;
