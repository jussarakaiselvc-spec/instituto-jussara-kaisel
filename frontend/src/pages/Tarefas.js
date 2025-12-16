import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, Circle, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Tarefas = ({ user }) => {
  const [tarefas, setTarefas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMentoria, setActiveMentoria] = useState(null);
  const [editingTarefa, setEditingTarefa] = useState(null);
  const [reflexao, setReflexao] = useState('');
  const [saving, setSaving] = useState(false);

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
        // Get tarefas
        const tarefasResponse = await axios.get(`${API}/tarefas/mentoria/${active.mentorada_mentoria_id}`);
        setTarefas(tarefasResponse.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar tarefas');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (tarefa) => {
    const newStatus = tarefa.status === 'pendente' ? 'concluida' : 'pendente';
    
    try {
      await axios.put(`${API}/tarefas/${tarefa.tarefa_id}`, {
        ...tarefa,
        status: newStatus,
      });
      
      setTarefas(tarefas.map(t => 
        t.tarefa_id === tarefa.tarefa_id ? { ...t, status: newStatus } : t
      ));
      
      toast.success(`Tarefa marcada como ${newStatus === 'concluida' ? 'concluída' : 'pendente'}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const saveReflexao = async () => {
    if (!editingTarefa) return;

    setSaving(true);
    try {
      await axios.put(`${API}/tarefas/${editingTarefa.tarefa_id}`, {
        ...editingTarefa,
        reflexao,
      });
      
      setTarefas(tarefas.map(t => 
        t.tarefa_id === editingTarefa.tarefa_id ? { ...t, reflexao } : t
      ));
      
      toast.success('Reflexão salva com sucesso!');
      setEditingTarefa(null);
      setReflexao('');
    } catch (error) {
      console.error('Error saving reflexao:', error);
      toast.error('Erro ao salvar reflexão');
    } finally {
      setSaving(false);
    }
  };

  const startEditingReflexao = (tarefa) => {
    setEditingTarefa(tarefa);
    setReflexao(tarefa.reflexao || '');
  };

  if (loading) {
    return (
      <div className="p-6 md:p-12 flex items-center justify-center min-h-screen">
        <div className="text-[#DAA520] text-xl font-heading">Carregando...</div>
      </div>
    );
  }

  if (!activeMentoria || tarefas.length === 0) {
    return (
      <div className="p-6 md:p-12">
        <h1 className="text-4xl md:text-5xl font-heading font-semibold text-[#DAA520] mb-4" data-testid="tarefas-title">
          Tarefas
        </h1>
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <p className="text-slate-300 text-lg">Nenhuma tarefa disponível ainda.</p>
        </div>
      </div>
    );
  }

  const tarefasPendentes = tarefas.filter(t => t.status === 'pendente');
  const tarefasConcluidas = tarefas.filter(t => t.status === 'concluida');

  return (
    <div className="p-6 md:p-12">
      <h1 className="text-4xl md:text-5xl font-heading font-semibold text-[#DAA520] mb-8" data-testid="tarefas-title">
        Tarefas
      </h1>

      <div className="space-y-8">
        {/* Pendentes */}
        {tarefasPendentes.length > 0 && (
          <div>
            <h2 className="text-2xl font-heading font-medium text-slate-300 mb-4">Pendentes</h2>
            <div className="space-y-4">
              {tarefasPendentes.map((tarefa, index) => (
                <div
                  key={tarefa.tarefa_id}
                  data-testid={`tarefa-pendente-${index}`}
                  className="relative overflow-hidden rounded-2xl bg-[#111827]/80 backdrop-blur-md border border-white/5 shadow-xl p-6 group hover:border-[#DAA520]/30 transition-all duration-500"
                >
                  <div className="flex items-start space-x-4">
                    <button
                      onClick={() => toggleStatus(tarefa)}
                      data-testid={`toggle-status-${index}`}
                      className="flex-shrink-0 mt-1 text-slate-500 hover:text-[#DAA520] transition-colors"
                    >
                      <Circle className="w-6 h-6" />
                    </button>
                    <div className="flex-1">
                      <p className="text-lg text-slate-200 mb-2" data-testid={`tarefa-desc-${index}`}>{tarefa.descricao}</p>
                      {tarefa.due_date && (
                        <div className="flex items-center space-x-2 text-slate-400 mb-4">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">
                            Prazo: {new Date(tarefa.due_date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      )}
                      
                      {editingTarefa?.tarefa_id === tarefa.tarefa_id ? (
                        <div className="mt-4 space-y-4">
                          <div>
                            <Label htmlFor="reflexao" className="text-slate-300 mb-2 block">
                              Sua Reflexão
                            </Label>
                            <Textarea
                              id="reflexao"
                              data-testid="reflexao-textarea"
                              value={reflexao}
                              onChange={(e) => setReflexao(e.target.value)}
                              placeholder="Compartilhe suas reflexões sobre esta tarefa..."
                              className="bg-[#0B1120]/50 border-slate-700 focus:border-[#DAA520] focus:ring-1 focus:ring-[#DAA520] text-slate-200 placeholder:text-slate-600 rounded-xl p-4 min-h-[100px]"
                            />
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              onClick={saveReflexao}
                              disabled={saving}
                              data-testid="save-reflexao-button"
                              className="bg-[#DAA520] text-[#0B1120] hover:bg-[#B8860B] font-medium px-6 py-2 rounded-full transition-all duration-300"
                            >
                              {saving ? 'Salvando...' : 'Salvar'}
                            </Button>
                            <Button
                              onClick={() => {
                                setEditingTarefa(null);
                                setReflexao('');
                              }}
                              data-testid="cancel-reflexao-button"
                              className="bg-transparent border border-slate-600 text-slate-400 hover:bg-white/5 px-6 py-2 rounded-full transition-all duration-300"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          {tarefa.reflexao && (
                            <div className="mt-4 p-4 bg-[#0B1120]/50 rounded-xl border border-slate-700">
                              <p className="text-sm text-slate-400 mb-2">Sua Reflexão:</p>
                              <p className="text-slate-300">{tarefa.reflexao}</p>
                            </div>
                          )}
                          <Button
                            onClick={() => startEditingReflexao(tarefa)}
                            data-testid={`edit-reflexao-${index}`}
                            className="mt-4 bg-transparent border border-[#DAA520]/50 text-[#DAA520] hover:bg-[#DAA520]/10 px-6 py-2 rounded-full transition-all duration-300"
                          >
                            {tarefa.reflexao ? 'Editar Reflexão' : 'Adicionar Reflexão'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Concluidas */}
        {tarefasConcluidas.length > 0 && (
          <div>
            <h2 className="text-2xl font-heading font-medium text-slate-300 mb-4">Concluídas</h2>
            <div className="space-y-4">
              {tarefasConcluidas.map((tarefa, index) => (
                <div
                  key={tarefa.tarefa_id}
                  data-testid={`tarefa-concluida-${index}`}
                  className="relative overflow-hidden rounded-2xl bg-[#111827]/80 backdrop-blur-md border border-white/5 shadow-xl p-6 opacity-60"
                >
                  <div className="flex items-start space-x-4">
                    <button
                      onClick={() => toggleStatus(tarefa)}
                      className="flex-shrink-0 mt-1 text-[#DAA520] hover:text-slate-500 transition-colors"
                    >
                      <CheckCircle className="w-6 h-6" />
                    </button>
                    <div className="flex-1">
                      <p className="text-lg text-slate-200 line-through mb-2">{tarefa.descricao}</p>
                      {tarefa.reflexao && (
                        <div className="mt-4 p-4 bg-[#0B1120]/50 rounded-xl border border-slate-700">
                          <p className="text-sm text-slate-400 mb-2">Reflexão:</p>
                          <p className="text-slate-300">{tarefa.reflexao}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tarefas;
