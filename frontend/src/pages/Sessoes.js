import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Video, Music, Calendar, FileText } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Sessoes = ({ user }) => {
  const [sessoes, setSessoes] = useState([]);
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
        // Get sessoes
        const sessoesResponse = await axios.get(`${API}/sessoes/mentoria/${active.mentorada_mentoria_id}`);
        setSessoes(sessoesResponse.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar sessões');
    } finally {
      setLoading(false);
    }
  };

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const videoId = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=))([\w-]{10,12})/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  if (loading) {
    return (
      <div className="p-6 md:p-12 flex items-center justify-center min-h-screen">
        <div className="text-[#DAA520] text-xl font-heading">Carregando...</div>
      </div>
    );
  }

  if (!activeMentoria || sessoes.length === 0) {
    return (
      <div className="p-6 md:p-12">
        <h1 className="text-4xl md:text-5xl font-heading font-semibold text-[#DAA520] mb-4" data-testid="sessoes-title">
          Sessões
        </h1>
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <p className="text-slate-300 text-lg">Nenhuma sessão disponível ainda.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12">
      <h1 className="text-4xl md:text-5xl font-heading font-semibold text-[#DAA520] mb-8" data-testid="sessoes-title">
        Sessões
      </h1>

      <div className="space-y-6">
        {sessoes.map((sessao, index) => {
          const embedUrl = getYouTubeEmbedUrl(sessao.video_url);
          
          return (
            <div
              key={sessao.sessao_id}
              data-testid={`sessao-${index}`}
              className="relative overflow-hidden rounded-2xl bg-[#111827]/80 backdrop-blur-md border border-white/5 shadow-xl p-8 group hover:border-[#DAA520]/30 transition-all duration-500"
            >
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-[#DAA520]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#DAA520] font-heading text-xl font-semibold">{sessao.session_number}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-heading font-medium text-slate-200 mb-2" data-testid={`sessao-tema-${index}`}>
                    {sessao.tema}
                  </h3>
                  <div className="flex items-center space-x-2 text-slate-400">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm" data-testid={`sessao-date-${index}`}>
                      {new Date(sessao.session_date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>

              {embedUrl && (
                <div className="mb-6 rounded-xl overflow-hidden">
                  <div className="aspect-video">
                    <iframe
                      src={embedUrl}
                      title={`Sessão ${sessao.session_number} - ${sessao.tema}`}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {sessao.audio_url && (
                <div className="mb-6">
                  <div className="flex items-center space-x-3 p-4 bg-[#0B1120]/50 rounded-xl border border-slate-700">
                    <Music className="w-5 h-5 text-[#DAA520]" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-400 mb-1">Áudio da Sessão</p>
                      <a
                        href={sessao.audio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid={`sessao-audio-${index}`}
                        className="text-[#DAA520] hover:text-[#B8860B] text-sm transition-colors"
                      >
                        Ouvir no Spotify
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {sessao.resumo && (
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <FileText className="w-5 h-5 text-[#DAA520]" />
                    <h4 className="text-lg font-heading font-medium text-slate-200">Resumo da Sessão</h4>
                  </div>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap" data-testid={`sessao-resumo-${index}`}>
                    {sessao.resumo}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Sessoes;
