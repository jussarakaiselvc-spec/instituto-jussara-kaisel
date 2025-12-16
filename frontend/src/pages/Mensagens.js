import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, User } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Mensagens = ({ user }) => {
  const [mensagens, setMensagens] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [mentora, setMentora] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMentora();
  }, []);

  const fetchMentora = async () => {
    try {
      // Get mentora
      const response = await axios.get(`${API}/mentora`);
      setMentora(response.data);
      fetchMensagens(response.data.user_id);
    } catch (error) {
      console.error('Error fetching mentora:', error);
      toast.error('Erro ao carregar conversa');
      setLoading(false);
    }
  };

  const fetchMensagens = async (mentoraUserId) => {
    try {
      const response = await axios.get(`${API}/mensagens/conversation/${mentoraUserId}`);
      setMensagens(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !mentora) return;

    setSending(true);
    try {
      const mentoradaUserId = user.role === 'admin' ? mentora.user_id : user.user_id;
      const senderUserId = user.user_id;

      await axios.post(`${API}/mensagens`, {
        mentorada_user_id: mentoradaUserId,
        sender_user_id: senderUserId,
        message: newMessage,
      });

      // Refresh messages
      fetchMensagens(user.role === 'admin' ? mentoradaUserId : mentora.user_id);
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

  if (!mentora) {
    return (
      <div className="p-6 md:p-12">
        <h1 className="text-4xl md:text-5xl font-heading font-semibold text-[#DAA520] mb-4" data-testid="mensagens-title">
          Mensagens
        </h1>
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <p className="text-slate-300 text-lg">Nenhuma mentora disponível.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12 h-screen flex flex-col">
      <h1 className="text-4xl md:text-5xl font-heading font-semibold text-[#DAA520] mb-8" data-testid="mensagens-title">
        Mensagens
      </h1>

      <div className="flex-1 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-[#DAA520]/10 flex items-center justify-center">
              <User className="w-6 h-6 text-[#DAA520]" />
            </div>
            <div>
              <h3 className="text-lg font-heading font-medium text-slate-200" data-testid="mentora-name">{mentora.name}</h3>
              <p className="text-sm text-slate-400">Mentora</p>
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
      </div>
    </div>
  );
};

export default Mensagens;
