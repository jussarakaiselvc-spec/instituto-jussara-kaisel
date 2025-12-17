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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Users, BookOpen, Video, CheckSquare, Package, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import FinanceiroAdmin from '@/components/FinanceiroAdmin';
import TarefasAdmin from '@/components/TarefasAdmin';
import AgendamentosIntegrations from '@/components/AgendamentosIntegrations';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminPanel = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [mentorias, setMentorias] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [mentoradaMentorias, setMentoradaMentorias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [usersRes, mentoriasRes, produtosRes, mmRes] = await Promise.all([
        axios.get(`${API}/users`),
        axios.get(`${API}/mentorias`),
        axios.get(`${API}/produtos`),
        axios.get(`${API}/mentorada-mentorias/all`),
      ]);
      setUsers(usersRes.data);
      setMentorias(mentoriasRes.data);
      setProdutos(produtosRes.data);
      setMentoradaMentorias(mmRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // Helper to get mentorada name from mentorada_mentoria
  const getMentoradaMentoriaLabel = (mm) => {
    const user = users.find(u => u.user_id === mm.user_id);
    const mentoria = mentorias.find(m => m.mentoria_id === mm.mentoria_id);
    return `${user?.name || 'N/A'} - ${mentoria?.name || 'N/A'}`;
  };

  // Create Mentorada
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'mentorada' });
  const [creatingUser, setCreatingUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editUserData, setEditUserData] = useState({ name: '', email: '' });
  const [deletingUserId, setDeletingUserId] = useState(null);

  const createUser = async () => {
    setCreatingUser(true);
    try {
      await axios.post(`${API}/auth/register`, newUser);
      toast.success('Mentorada criada com sucesso!');
      setNewUser({ name: '', email: '', password: '', role: 'mentorada' });
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao criar mentorada');
    } finally {
      setCreatingUser(false);
    }
  };

  const updateUser = async () => {
    try {
      await axios.put(`${API}/users/${editingUser.user_id}`, editUserData);
      toast.success('Mentorada atualizada com sucesso!');
      setEditingUser(null);
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao atualizar mentorada');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta mentorada? Todos os dados relacionados serão excluídos.')) {
      return;
    }
    setDeletingUserId(userId);
    try {
      await axios.delete(`${API}/users/${userId}`);
      toast.success('Mentorada excluída com sucesso!');
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao excluir mentorada');
    } finally {
      setDeletingUserId(null);
    }
  };

  const openEditUser = (user) => {
    setEditingUser(user);
    setEditUserData({ name: user.name, email: user.email });
  };

  // Create Mentoria
  const [newMentoria, setNewMentoria] = useState({ name: '', description: '', cover_image_url: '', sales_link: '' });
  const [creatingMentoria, setCreatingMentoria] = useState(false);
  const [editingMentoria, setEditingMentoria] = useState(null);
  const [editMentoriaData, setEditMentoriaData] = useState({ name: '', description: '', cover_image_url: '', sales_link: '' });
  const [deletingMentoriaId, setDeletingMentoriaId] = useState(null);

  const createMentoria = async () => {
    setCreatingMentoria(true);
    try {
      await axios.post(`${API}/mentorias`, newMentoria);
      toast.success('Mentoria criada com sucesso!');
      setNewMentoria({ name: '', description: '', cover_image_url: '', sales_link: '' });
      fetchAllData();
    } catch (error) {
      toast.error('Erro ao criar mentoria');
    } finally {
      setCreatingMentoria(false);
    }
  };

  const updateMentoria = async () => {
    try {
      await axios.put(`${API}/mentorias/${editingMentoria.mentoria_id}`, editMentoriaData);
      toast.success('Mentoria atualizada com sucesso!');
      setEditingMentoria(null);
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao atualizar mentoria');
    }
  };

  const deleteMentoria = async (mentoriaId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta mentoria? Todos os dados relacionados serão excluídos.')) {
      return;
    }
    setDeletingMentoriaId(mentoriaId);
    try {
      await axios.delete(`${API}/mentorias/${mentoriaId}`);
      toast.success('Mentoria excluída com sucesso!');
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao excluir mentoria');
    } finally {
      setDeletingMentoriaId(null);
    }
  };

  const openEditMentoria = (mentoria) => {
    setEditingMentoria(mentoria);
    setEditMentoriaData({ 
      name: mentoria.name, 
      description: mentoria.description || '',
      cover_image_url: mentoria.cover_image_url || '',
      sales_link: mentoria.sales_link || ''
    });
  };

  // Assign Mentoria to User
  const [assignData, setAssignData] = useState({
    user_id: '',
    mentoria_id: '',
    start_date: new Date().toISOString().split('T')[0],
    status: 'ativa',
  });
  const [assigning, setAssigning] = useState(false);

  const assignMentoria = async () => {
    setAssigning(true);
    try {
      await axios.post(`${API}/mentorada-mentorias`, {
        ...assignData,
        start_date: new Date(assignData.start_date).toISOString(),
      });
      toast.success('Mentoria atribuída com sucesso!');
      setAssignData({
        user_id: '',
        mentoria_id: '',
        start_date: new Date().toISOString().split('T')[0],
        status: 'ativa',
      });
    } catch (error) {
      toast.error('Erro ao atribuir mentoria');
    } finally {
      setAssigning(false);
    }
  };

  // Create Sessao
  const [newSessao, setNewSessao] = useState({
    mentorada_mentoria_id: '',
    session_number: 1,
    tema: '',
    session_date: new Date().toISOString().split('T')[0],
    video_url: '',
    audio_url: '',
    resumo: '',
  });
  const [creatingSessao, setCreatingSessao] = useState(false);

  const createSessao = async () => {
    setCreatingSessao(true);
    try {
      await axios.post(`${API}/sessoes`, {
        ...newSessao,
        session_date: new Date(newSessao.session_date).toISOString(),
        session_number: parseInt(newSessao.session_number),
      });
      toast.success('Sessão criada com sucesso!');
      setNewSessao({
        mentorada_mentoria_id: '',
        session_number: 1,
        tema: '',
        session_date: new Date().toISOString().split('T')[0],
        video_url: '',
        audio_url: '',
        resumo: '',
      });
    } catch (error) {
      toast.error('Erro ao criar sessão');
    } finally {
      setCreatingSessao(false);
    }
  };

  // Create Tarefa
  const [newTarefa, setNewTarefa] = useState({
    mentorada_mentoria_id: '',
    descricao: '',
    status: 'pendente',
    due_date: '',
  });
  const [creatingTarefa, setCreatingTarefa] = useState(false);

  const createTarefa = async () => {
    setCreatingTarefa(true);
    try {
      await axios.post(`${API}/tarefas`, {
        ...newTarefa,
        due_date: newTarefa.due_date ? new Date(newTarefa.due_date).toISOString() : null,
      });
      toast.success('Tarefa criada com sucesso!');
      setNewTarefa({
        mentorada_mentoria_id: '',
        descricao: '',
        status: 'pendente',
        due_date: '',
      });
    } catch (error) {
      toast.error('Erro ao criar tarefa');
    } finally {
      setCreatingTarefa(false);
    }
  };

  // Create Produto
  const [newProduto, setNewProduto] = useState({ name: '', description: '', content_url: '' });
  const [creatingProduto, setCreatingProduto] = useState(false);

  const createProduto = async () => {
    setCreatingProduto(true);
    try {
      await axios.post(`${API}/produtos`, newProduto);
      toast.success('Produto criado com sucesso!');
      setNewProduto({ name: '', description: '', content_url: '' });
      fetchAllData();
    } catch (error) {
      toast.error('Erro ao criar produto');
    } finally {
      setCreatingProduto(false);
    }
  };

  // Assign Produto to User
  const [assignProduto, setAssignProduto] = useState({ user_id: '', produto_id: '' });
  const [assigningProduto, setAssigningProduto] = useState(false);

  const assignProdutoToUser = async () => {
    setAssigningProduto(true);
    try {
      await axios.post(`${API}/user-produtos`, assignProduto);
      toast.success('Produto atribuído com sucesso!');
      setAssignProduto({ user_id: '', produto_id: '' });
    } catch (error) {
      toast.error('Erro ao atribuir produto');
    } finally {
      setAssigningProduto(false);
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
      <h1 className="text-4xl md:text-5xl font-heading font-semibold text-[#DAA520] mb-8" data-testid="admin-title">
        Painel de Administração
      </h1>

      <Tabs defaultValue={new URLSearchParams(window.location.search).get('tab') || 'mentoradas'} className="space-y-6">
        <TabsList className="bg-[#111827]/80 border border-white/10 flex-wrap">
          <TabsTrigger value="mentoradas" data-testid="tab-mentoradas">Mentoradas</TabsTrigger>
          <TabsTrigger value="mentorias" data-testid="tab-mentorias">Mentorias</TabsTrigger>
          <TabsTrigger value="sessoes" data-testid="tab-sessoes">Sessões</TabsTrigger>
          <TabsTrigger value="tarefas" data-testid="tab-tarefas">Tarefas</TabsTrigger>
          <TabsTrigger value="financeiro" data-testid="tab-financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="produtos" data-testid="tab-produtos">Produtos</TabsTrigger>
          <TabsTrigger value="agendamentos" data-testid="tab-agendamentos">Agendamentos</TabsTrigger>
        </TabsList>

        {/* Mentoradas Tab */}
        <TabsContent value="mentoradas" className="space-y-6">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-heading font-medium text-slate-200">Mentoradas Cadastradas</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button data-testid="create-mentorada-button" className="bg-[#DAA520] text-[#0B1120] hover:bg-[#B8860B]">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Mentorada
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#111827] border-white/10">
                  <DialogHeader>
                    <DialogTitle className="text-[#DAA520] font-heading">Criar Nova Mentorada</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-slate-300">Nome</Label>
                      <Input
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        data-testid="mentorada-name-input"
                        className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Email</Label>
                      <Input
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        data-testid="mentorada-email-input"
                        className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Senha</Label>
                      <Input
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        data-testid="mentorada-password-input"
                        className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
                      />
                    </div>
                    <Button
                      onClick={createUser}
                      disabled={creatingUser}
                      data-testid="submit-mentorada-button"
                      className="w-full bg-[#DAA520] text-[#0B1120] hover:bg-[#B8860B]"
                    >
                      {creatingUser ? 'Criando...' : 'Criar Mentorada'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-3">
              {users.filter(u => u.role === 'mentorada').map((u, i) => (
                <div key={u.user_id} data-testid={`user-${i}`} className="p-4 bg-[#0B1120]/50 rounded-xl border border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Users className="w-5 h-5 text-[#DAA520]" />
                      <div>
                        <p className="text-slate-200 font-medium">{u.name}</p>
                        <p className="text-sm text-slate-400">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditUser(u)}
                        className="text-slate-400 hover:text-[#DAA520] hover:bg-[#DAA520]/10"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteUser(u.user_id)}
                        disabled={deletingUserId === u.user_id}
                        className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Edit User Dialog */}
            <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
              <DialogContent className="bg-[#111827] border-white/10">
                <DialogHeader>
                  <DialogTitle className="text-[#DAA520] font-heading">Editar Mentorada</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-slate-300">Nome</Label>
                    <Input
                      value={editUserData.name}
                      onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                      className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Email</Label>
                    <Input
                      type="email"
                      value={editUserData.email}
                      onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                      className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
                    />
                  </div>
                  <Button
                    onClick={updateUser}
                    className="w-full bg-[#DAA520] text-[#0B1120] hover:bg-[#B8860B]"
                  >
                    Salvar Alterações
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Assign Mentoria */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
            <h2 className="text-2xl font-heading font-medium text-slate-200 mb-6">Atribuir Mentoria</h2>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300">Mentorada</Label>
                <Select value={assignData.user_id} onValueChange={(v) => setAssignData({ ...assignData, user_id: v })}>
                  <SelectTrigger data-testid="assign-user-select" className="bg-[#0B1120]/50 border-slate-700 text-slate-200">
                    <SelectValue placeholder="Selecione a mentorada" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111827] border-white/10">
                    {users.filter(u => u.role === 'mentorada').map((u) => (
                      <SelectItem key={u.user_id} value={u.user_id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">Mentoria</Label>
                <Select value={assignData.mentoria_id} onValueChange={(v) => setAssignData({ ...assignData, mentoria_id: v })}>
                  <SelectTrigger data-testid="assign-mentoria-select" className="bg-[#0B1120]/50 border-slate-700 text-slate-200">
                    <SelectValue placeholder="Selecione a mentoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111827] border-white/10">
                    {mentorias.map((m) => (
                      <SelectItem key={m.mentoria_id} value={m.mentoria_id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">Data de Início</Label>
                <Input
                  type="date"
                  value={assignData.start_date}
                  onChange={(e) => setAssignData({ ...assignData, start_date: e.target.value })}
                  data-testid="assign-start-date-input"
                  className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
                />
              </div>
              <Button
                onClick={assignMentoria}
                disabled={assigning || !assignData.user_id || !assignData.mentoria_id}
                data-testid="submit-assign-button"
                className="bg-[#DAA520] text-[#0B1120] hover:bg-[#B8860B]"
              >
                {assigning ? 'Atribuindo...' : 'Atribuir Mentoria'}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Mentorias Tab */}
        <TabsContent value="mentorias" className="space-y-6">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-heading font-medium text-slate-200">Mentorias Disponíveis</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button data-testid="create-mentoria-button" className="bg-[#DAA520] text-[#0B1120] hover:bg-[#B8860B]">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Mentoria
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#111827] border-white/10">
                  <DialogHeader>
                    <DialogTitle className="text-[#DAA520] font-heading">Criar Nova Mentoria</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-slate-300">Nome</Label>
                      <Input
                        value={newMentoria.name}
                        onChange={(e) => setNewMentoria({ ...newMentoria, name: e.target.value })}
                        data-testid="mentoria-name-input"
                        className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Descrição</Label>
                      <Textarea
                        value={newMentoria.description}
                        onChange={(e) => setNewMentoria({ ...newMentoria, description: e.target.value })}
                        data-testid="mentoria-desc-input"
                        className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Imagem de Capa (URL)</Label>
                      <Input
                        value={newMentoria.cover_image_url}
                        onChange={(e) => setNewMentoria({ ...newMentoria, cover_image_url: e.target.value })}
                        data-testid="mentoria-cover-input"
                        placeholder="https://exemplo.com/imagem.jpg"
                        className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
                      />
                      <p className="text-xs text-slate-500 mt-1">Cole o link de uma imagem (Google Drive, Unsplash, etc.)</p>
                    </div>
                    {newMentoria.cover_image_url && (
                      <div className="rounded-lg overflow-hidden border border-slate-700">
                        <img 
                          src={newMentoria.cover_image_url} 
                          alt="Preview" 
                          className="w-full h-32 object-cover"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      </div>
                    )}
                    <div>
                      <Label className="text-slate-300">Link da Página de Vendas</Label>
                      <Input
                        value={newMentoria.sales_link}
                        onChange={(e) => setNewMentoria({ ...newMentoria, sales_link: e.target.value })}
                        data-testid="mentoria-sales-link-input"
                        placeholder="https://exemplo.com/pagina-de-vendas"
                        className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
                      />
                      <p className="text-xs text-slate-500 mt-1">Link para página de vendas com pagamento</p>
                    </div>
                    <Button
                      onClick={createMentoria}
                      disabled={creatingMentoria}
                      data-testid="submit-mentoria-button"
                      className="w-full bg-[#DAA520] text-[#0B1120] hover:bg-[#B8860B]"
                    >
                      {creatingMentoria ? 'Criando...' : 'Criar Mentoria'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mentorias.map((m, i) => (
                <div key={m.mentoria_id} data-testid={`mentoria-${i}`} className="bg-[#0B1120]/50 rounded-xl border border-slate-700 overflow-hidden hover:border-[#DAA520]/30 transition-all">
                  {m.cover_image_url ? (
                    <div className="h-40 overflow-hidden">
                      <img 
                        src={m.cover_image_url} 
                        alt={m.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-24 bg-gradient-to-r from-[#DAA520]/20 to-[#B8860B]/20 flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-[#DAA520]/50" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-slate-200 font-medium text-lg">{m.name}</p>
                        {m.description && <p className="text-sm text-slate-400 mt-1 line-clamp-2">{m.description}</p>}
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditMentoria(m)}
                          className="text-slate-400 hover:text-[#DAA520] hover:bg-[#DAA520]/10"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMentoria(m.mentoria_id)}
                          disabled={deletingMentoriaId === m.mentoria_id}
                          className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Edit Mentoria Dialog */}
            <Dialog open={!!editingMentoria} onOpenChange={(open) => !open && setEditingMentoria(null)}>
              <DialogContent className="bg-[#111827] border-white/10">
                <DialogHeader>
                  <DialogTitle className="text-[#DAA520] font-heading">Editar Mentoria</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-slate-300">Nome</Label>
                    <Input
                      value={editMentoriaData.name}
                      onChange={(e) => setEditMentoriaData({ ...editMentoriaData, name: e.target.value })}
                      className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Descrição</Label>
                    <Textarea
                      value={editMentoriaData.description}
                      onChange={(e) => setEditMentoriaData({ ...editMentoriaData, description: e.target.value })}
                      className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Imagem de Capa (URL)</Label>
                    <Input
                      value={editMentoriaData.cover_image_url}
                      onChange={(e) => setEditMentoriaData({ ...editMentoriaData, cover_image_url: e.target.value })}
                      placeholder="https://exemplo.com/imagem.jpg"
                      className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
                    />
                  </div>
                  {editMentoriaData.cover_image_url && (
                    <div className="rounded-lg overflow-hidden border border-slate-700">
                      <img 
                        src={editMentoriaData.cover_image_url} 
                        alt="Preview" 
                        className="w-full h-32 object-cover"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    </div>
                  )}
                  <Button
                    onClick={updateMentoria}
                    className="w-full bg-[#DAA520] text-[#0B1120] hover:bg-[#B8860B]"
                  >
                    Salvar Alterações
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </TabsContent>

        {/* Sessoes Tab */}
        <TabsContent value="sessoes">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
            <h2 className="text-2xl font-heading font-medium text-slate-200 mb-6">Criar Sessão</h2>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300">Mentorada/Mentoria (ID)</Label>
                <Input
                  value={newSessao.mentorada_mentoria_id}
                  onChange={(e) => setNewSessao({ ...newSessao, mentorada_mentoria_id: e.target.value })}
                  data-testid="sessao-mentoria-id-input"
                  placeholder="ID da mentoria atribuída"
                  className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
                />
              </div>
              <div>
                <Label className="text-slate-300">Número da Sessão</Label>
                <Input
                  type="number"
                  value={newSessao.session_number}
                  onChange={(e) => setNewSessao({ ...newSessao, session_number: e.target.value })}
                  data-testid="sessao-number-input"
                  className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
                />
              </div>
              <div>
                <Label className="text-slate-300">Tema</Label>
                <Input
                  value={newSessao.tema}
                  onChange={(e) => setNewSessao({ ...newSessao, tema: e.target.value })}
                  data-testid="sessao-tema-input"
                  className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
                />
              </div>
              <div>
                <Label className="text-slate-300">Data da Sessão</Label>
                <Input
                  type="date"
                  value={newSessao.session_date}
                  onChange={(e) => setNewSessao({ ...newSessao, session_date: e.target.value })}
                  data-testid="sessao-date-input"
                  className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
                />
              </div>
              <div>
                <Label className="text-slate-300">Link do Vídeo (YouTube)</Label>
                <Input
                  value={newSessao.video_url}
                  onChange={(e) => setNewSessao({ ...newSessao, video_url: e.target.value })}
                  data-testid="sessao-video-input"
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
                />
              </div>
              <div>
                <Label className="text-slate-300">Link do Áudio (Spotify)</Label>
                <Input
                  value={newSessao.audio_url}
                  onChange={(e) => setNewSessao({ ...newSessao, audio_url: e.target.value })}
                  data-testid="sessao-audio-input"
                  placeholder="https://open.spotify.com/..."
                  className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
                />
              </div>
              <div>
                <Label className="text-slate-300">Resumo</Label>
                <Textarea
                  value={newSessao.resumo}
                  onChange={(e) => setNewSessao({ ...newSessao, resumo: e.target.value })}
                  data-testid="sessao-resumo-input"
                  className="bg-[#0B1120]/50 border-slate-700 text-slate-200 min-h-[120px]"
                />
              </div>
              <Button
                onClick={createSessao}
                disabled={creatingSessao}
                data-testid="submit-sessao-button"
                className="bg-[#DAA520] text-[#0B1120] hover:bg-[#B8860B]"
              >
                {creatingSessao ? 'Criando...' : 'Criar Sessão'}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Tarefas Tab */}
        <TabsContent value="tarefas" className="space-y-6">
          {/* Visualização de Tarefas */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
            <h2 className="text-2xl font-heading font-medium text-slate-200 mb-6">Todas as Tarefas</h2>
            <TarefasAdmin />
          </div>

          {/* Criar Tarefa */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
            <h2 className="text-2xl font-heading font-medium text-slate-200 mb-6">Criar Nova Tarefa</h2>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300">Mentorada/Mentoria (ID)</Label>
                <Input
                  value={newTarefa.mentorada_mentoria_id}
                  onChange={(e) => setNewTarefa({ ...newTarefa, mentorada_mentoria_id: e.target.value })}
                  data-testid="tarefa-mentoria-id-input"
                  placeholder="ID da mentoria atribuída"
                  className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
                />
              </div>
              <div>
                <Label className="text-slate-300">Descrição</Label>
                <Textarea
                  value={newTarefa.descricao}
                  onChange={(e) => setNewTarefa({ ...newTarefa, descricao: e.target.value })}
                  data-testid="tarefa-desc-input"
                  className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
                />
              </div>
              <div>
                <Label className="text-slate-300">Prazo (opcional)</Label>
                <Input
                  type="date"
                  value={newTarefa.due_date}
                  onChange={(e) => setNewTarefa({ ...newTarefa, due_date: e.target.value })}
                  data-testid="tarefa-duedate-input"
                  className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
                />
              </div>
              <Button
                onClick={createTarefa}
                disabled={creatingTarefa}
                data-testid="submit-tarefa-button"
                className="bg-[#DAA520] text-[#0B1120] hover:bg-[#B8860B]"
              >
                {creatingTarefa ? 'Criando...' : 'Criar Tarefa'}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Financeiro Tab */}
        <TabsContent value="financeiro" className="space-y-6">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
            <h2 className="text-2xl font-heading font-medium text-slate-200 mb-6">Controle Financeiro - Todas as Mentoradas</h2>
            <FinanceiroAdmin />
          </div>
        </TabsContent>

        {/* Agendamentos Tab */}
        <TabsContent value="agendamentos" className="space-y-6">
          <AgendamentosIntegrations />
        </TabsContent>

        {/* Produtos Tab */}
        <TabsContent value="produtos" className="space-y-6">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-heading font-medium text-slate-200">Produtos</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button data-testid="create-produto-button" className="bg-[#DAA520] text-[#0B1120] hover:bg-[#B8860B]">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Produto
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#111827] border-white/10">
                  <DialogHeader>
                    <DialogTitle className="text-[#DAA520] font-heading">Criar Novo Produto</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-slate-300">Nome</Label>
                      <Input
                        value={newProduto.name}
                        onChange={(e) => setNewProduto({ ...newProduto, name: e.target.value })}
                        data-testid="produto-name-input"
                        className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Descrição</Label>
                      <Textarea
                        value={newProduto.description}
                        onChange={(e) => setNewProduto({ ...newProduto, description: e.target.value })}
                        data-testid="produto-desc-input"
                        className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Link do Conteúdo</Label>
                      <Input
                        value={newProduto.content_url}
                        onChange={(e) => setNewProduto({ ...newProduto, content_url: e.target.value })}
                        data-testid="produto-url-input"
                        className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
                      />
                    </div>
                    <Button
                      onClick={createProduto}
                      disabled={creatingProduto}
                      data-testid="submit-produto-button"
                      className="w-full bg-[#DAA520] text-[#0B1120] hover:bg-[#B8860B]"
                    >
                      {creatingProduto ? 'Criando...' : 'Criar Produto'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-3">
              {produtos.map((p, i) => (
                <div key={p.produto_id} data-testid={`produto-${i}`} className="p-4 bg-[#0B1120]/50 rounded-xl border border-slate-700">
                  <div className="flex items-start space-x-3">
                    <Package className="w-5 h-5 text-[#DAA520] mt-1" />
                    <div>
                      <p className="text-slate-200 font-medium">{p.name}</p>
                      {p.description && <p className="text-sm text-slate-400 mt-1">{p.description}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assign Produto */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
            <h2 className="text-2xl font-heading font-medium text-slate-200 mb-6">Atribuir Produto</h2>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300">Mentorada</Label>
                <Select value={assignProduto.user_id} onValueChange={(v) => setAssignProduto({ ...assignProduto, user_id: v })}>
                  <SelectTrigger data-testid="assign-produto-user-select" className="bg-[#0B1120]/50 border-slate-700 text-slate-200">
                    <SelectValue placeholder="Selecione a mentorada" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111827] border-white/10">
                    {users.filter(u => u.role === 'mentorada').map((u) => (
                      <SelectItem key={u.user_id} value={u.user_id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">Produto</Label>
                <Select value={assignProduto.produto_id} onValueChange={(v) => setAssignProduto({ ...assignProduto, produto_id: v })}>
                  <SelectTrigger data-testid="assign-produto-select" className="bg-[#0B1120]/50 border-slate-700 text-slate-200">
                    <SelectValue placeholder="Selecione o produto" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111827] border-white/10">
                    {produtos.map((p) => (
                      <SelectItem key={p.produto_id} value={p.produto_id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={assignProdutoToUser}
                disabled={assigningProduto || !assignProduto.user_id || !assignProduto.produto_id}
                data-testid="submit-assign-produto-button"
                className="bg-[#DAA520] text-[#0B1120] hover:bg-[#B8860B]"
              >
                {assigningProduto ? 'Atribuindo...' : 'Atribuir Produto'}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
