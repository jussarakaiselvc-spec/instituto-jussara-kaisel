import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Video, Music, Calendar, FileText, ChevronDown, ChevronUp, ExternalLink, FolderOpen, Play } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Sessoes = ({ user }) => {
  const [sessoes, setSessoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMentoria, setActiveMentoria] = useState(null);
  const [expandedSessao, setExpandedSessao] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get all mentorias
      const mentoriasResponse = await axios.get(`${API}/mentorada-mentorias/my`);
      const mentorias = mentoriasResponse.data;
      
      if (mentorias.length > 0) {
        // Set active mentoria
        const active = mentorias.find(m => m.status === 'ativa') || mentorias[0];
        setActiveMentoria(active);
        
        // Get sessoes from ALL mentorias
        let allSessoes = [];
        for (const mentoria of mentorias) {
          try {
            const sessoesResponse = await axios.get(`${API}/sessoes/mentoria/${mentoria.mentorada_mentoria_id}`);
            allSessoes = [...allSessoes, ...sessoesResponse.data];
          } catch (error) {
            // This mentoria has no sessions, continue
            continue;
          }
        }
        
        // Sort by date
        allSessoes.sort((a, b) => new Date(a.session_date) - new Date(b.session_date));
        setSessoes(allSessoes);
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

      <div className="space-y-4">
        {sessoes.map((sessao, index) => {
          const embedUrl = getYouTubeEmbedUrl(sessao.video_url);
          const isExpanded = expandedSessao === sessao.sessao_id;
          const hasContent = sessao.video_url || sessao.audio_url || sessao.drive_link || sessao.resumo;
          
          return (
            <div
              key={sessao.sessao_id}
              data-testid={`sessao-${index}`}
              className="relative overflow-hidden rounded-2xl bg-[#111827]/80 backdrop-blur-md border border-white/5 shadow-xl transition-all duration-300"
            >
              {/* Header - Always visible, clickable */}
              <button
                onClick={() => setExpandedSessao(isExpanded ? null : sessao.sessao_id)}
                className="w-full p-4 sm:p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#DAA520]/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#DAA520] font-heading text-lg sm:text-xl font-semibold">{sessao.session_number}</span>
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg sm:text-xl font-heading font-medium text-slate-200" data-testid={`sessao-tema-${index}`}>
                      {sessao.tema || `Sessão ${sessao.session_number}`}
                    </h3>
                    <div className="flex items-center space-x-2 text-slate-400">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm" data-testid={`sessao-date-${index}`}>
                        {new Date(sessao.session_date).toLocaleDateString('pt-BR', { 
                          weekday: 'short', 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {hasContent && (
                    <span className="text-xs text-[#DAA520] bg-[#DAA520]/10 px-2 py-1 rounded-full hidden sm:inline">
                      {[sessao.video_url && 'Vídeo', sessao.audio_url && 'Áudio', sessao.drive_link && 'Materiais'].filter(Boolean).join(' • ')}
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-[#DAA520]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 sm:px-6 pb-6 space-y-4 border-t border-white/5 pt-4">
                  {/* Video */}
                  {embedUrl && (
                    <div className="rounded-xl overflow-hidden">
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

                  {/* Video Link (if no embed) */}
                  {sessao.video_url && !embedUrl && (
                    <a
                      href={sessao.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-3 p-4 bg-[#0B1120]/50 rounded-xl border border-slate-700 hover:border-[#DAA520]/30 transition-colors"
                    >
                      <Play className="w-5 h-5 text-[#DAA520]" />
                      <div className="flex-1">
                        <p className="text-sm text-slate-400">Vídeo da Sessão</p>
                        <span className="text-[#DAA520] text-sm">Assistir vídeo</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400" />
                    </a>
                  )}

                  {/* Audio */}
                  {sessao.audio_url && (
                    <a
                      href={sessao.audio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-3 p-4 bg-[#0B1120]/50 rounded-xl border border-slate-700 hover:border-[#DAA520]/30 transition-colors"
                    >
                      <Music className="w-5 h-5 text-[#DAA520]" />
                      <div className="flex-1">
                        <p className="text-sm text-slate-400">Áudio da Sessão</p>
                        <span className="text-[#DAA520] text-sm">Ouvir áudio</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400" />
                    </a>
                  )}

                  {/* Google Drive Link */}
                  {sessao.drive_link && (
                    <a
                      href={sessao.drive_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-3 p-4 bg-[#0B1120]/50 rounded-xl border border-slate-700 hover:border-[#DAA520]/30 transition-colors"
                    >
                      <FolderOpen className="w-5 h-5 text-[#DAA520]" />
                      <div className="flex-1">
                        <p className="text-sm text-slate-400">Materiais da Sessão</p>
                        <span className="text-[#DAA520] text-sm">Abrir Google Drive</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400" />
                    </a>
                  )}

                  {/* Resumo */}
                  {sessao.resumo && (
                    <div className="p-4 bg-[#0B1120]/50 rounded-xl border border-slate-700">
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
