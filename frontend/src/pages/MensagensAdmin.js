import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, User, Circle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MensagensAdmin = ({ user }) => {
  const [mentoradas, setMentoradas] = useState([]);
  const [selectedMentorada, setSelectedMentorada] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMentoradas();
    // Poll for new messages every 5 seconds
    const interval = setInterval(() => {
      if (selectedMentorada) {
        fetchMensagens(selectedMentorada.user_id);
      }
      fetchUnreadCounts();
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedMentorada]);

  const fetchMentoradas = async () => {
    try {
      const response = await axios.get(`${API}/users`);
      const mentoradasList = response.data.filter(u => u.role === 'mentorada');
      setMentoradas(mentoradasList);
      if (mentoradasList.length > 0 && !selectedMentorada) {
        setSelectedMentorada(mentoradasList[0]);
        fetchMensagens(mentoradasList[0].user_id);
      }
      fetchUnreadCounts();
    } catch (error) {
      console.error('Error fetching mentoradas:', error);
      toast.error('Erro ao carregar mentoradas');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCounts = async () => {
    try {
      const counts = {};
      for (const mentorada of mentoradas) {
        const response = await axios.get(`${API}/mensagens/unread-count-from/${mentorada.user_id}`);
        counts[mentorada.user_id] = response.data.unread_count;
      }
      setUnreadCounts(counts);
    } catch (error) {
      console.error('Error fetching unread counts:', error);
    }
  };

  const fetchMensagens = async (mentoradaUserId) => {
    try {
      const response = await axios.get(`${API}/mensagens/conversation/${mentoradaUserId}`);
      setMensagens(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedMentorada) return;

    setSending(true);
    try {
      await axios.post(`${API}/mensagens`, {
        mentorada_user_id: selectedMentorada.user_id,
        sender_user_id: user.user_id,
        message: newMessage,
      });

      fetchMensagens(selectedMentorada.user_id);
      setNewMessage('');
      toast.success('Mensagem enviada!');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  if (loading) {
    return (
      <div className="p-6 md:p-12 flex items-center justify-center min-h-screen">
        <div className="text-[#DAA520] text-xl font-heading">Carregando...</div>
      </div>
    );
  }

  if (mentoradas.length === 0) {
    return (
      <div className="p-6 md:p-12">
        <h1 className="text-4xl md:text-5xl font-heading font-semibold text-[#DAA520] mb-4" data-testid="mensagens-title">
          Mensagens
        </h1>
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <p className="text-slate-300 text-lg">Nenhuma mentorada cadastrada ainda.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12 h-screen flex flex-col">
      <h1 className="text-4xl md:text-5xl font-heading font-semibold text-[#DAA520] mb-8" data-testid="mensagens-title">
        Mensagens
      </h1>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Lista de Mentoradas */}
        <div className="w-80 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 overflow-y-auto">
          <h2 className="text-lg font-heading font-medium text-slate-200 mb-4">Mentoradas</h2>
          <div className="space-y-2">
            {mentoradas.map((mentorada) => (
              <button
                key={mentorada.user_id}
                onClick={() => {
                  setSelectedMentorada(mentorada);
                  fetchMensagens(mentorada.user_id);
                }}
                data-testid={`mentorada-${mentorada.email}`}
                className={`w-full text-left p-4 rounded-xl transition-all duration-300 ${
                  selectedMentorada?.user_id === mentorada.user_id
                    ? 'bg-[#DAA520]/10 border border-[#DAA520]/30'
                    : 'bg-[#0B1120]/50 border border-slate-700 hover:border-[#DAA520]/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-[#DAA520]/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-[#DAA520]" />
                    </div>
                    <div>
                      <p className="text-slate-200 font-medium">{mentorada.name}</p>
                      <p className="text-xs text-slate-400">{mentorada.email}</p>
                    </div>
                  </div>
                  {unreadCounts[mentorada.user_id] > 0 && (
                    <div className="w-6 h-6 rounded-full bg-[#DAA520] flex items-center justify-center">
                      <span className="text-xs text-[#0B1120] font-bold">{unreadCounts[mentorada.user_id]}</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl flex flex-col overflow-hidden">
          {selectedMentorada ? (
            <>
              {/* Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-[#DAA520]/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-[#DAA520]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-heading font-medium text-slate-200" data-testid="selected-mentorada-name">
                      {selectedMentorada.name}
                    </h3>
                    <p className="text-sm text-slate-400">Mentorada</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4" data-testid="messages-container">
                {mensagens.length === 0 ? (
                  <div className="text-center text-slate-400 py-12">
                    <p>Nenhuma mensagem ainda. Comece a conversa!</p>
                  </div>
                ) : (
                  mensagens.map((msg, index) => {
                    const isFromMe = msg.sender_user_id === user.user_id;
                    return (
                      <div
                        key={msg.mensagem_id}
                        data-testid={`message-${index}`}
                        className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                            isFromMe
                              ? 'bg-[#DAA520] text-[#0B1120]'
                              : 'bg-[#111827] text-slate-200 border border-white/10'
                          }`}
                        >
                          <p className="whitespace-pre-wrap" data-testid={`message-text-${index}`}>{msg.message}</p>
                          <p className={`text-xs mt-2 ${
                            isFromMe ? 'text-[#0B1120]/70' : 'text-slate-500'
                          }`}>
                            {new Date(msg.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-6 border-t border-white/10">
                <div className="flex space-x-4">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    data-testid="message-input"
                    placeholder="Digite sua mensagem..."
                    className="flex-1 bg-[#0B1120]/50 border-slate-700 focus:border-[#DAA520] focus:ring-1 focus:ring-[#DAA520] text-slate-200 placeholder:text-slate-600 rounded-xl p-4 resize-none"
                    rows={3}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    data-testid="send-message-button"
                    className="bg-[#DAA520] text-[#0B1120] hover:bg-[#B8860B] font-medium px-6 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(218,165,32,0.3)] hover:shadow-[0_0_25px_rgba(218,165,32,0.5)] h-auto"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <p>Selecione uma mentorada para conversar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MensagensAdmin;
