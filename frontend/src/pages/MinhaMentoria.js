import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileText, Calendar, Activity, Lock, Unlock, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MinhaMentoria = ({ user }) => {
  const [mentorias, setMentorias] = useState([]);
  const [selectedMentoria, setSelectedMentoria] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    diagnostico_pdf_url: '',
    diagnostico_pontos_chave: '',
    diagnostico_foco_atual: '',
  });

  useEffect(() => {
    fetchMentorias();
  }, []);

  const fetchMentorias = async () => {
    try {
      const response = await axios.get(`${API}/mentorada-mentorias/my`);
      setMentorias(response.data);
      if (response.data.length > 0) {
        const active = response.data.find(m => m.status === 'ativa') || response.data[0];
        setSelectedMentoria(active);
        setFormData({
          diagnostico_pdf_url: active.diagnostico_pdf_url || '',
          diagnostico_pontos_chave: active.diagnostico_pontos_chave || '',
          diagnostico_foco_atual: active.diagnostico_foco_atual || '',
        });
        fetchMentoriaDetails(active.mentoria_id);
      }
    } catch (error) {
      console.error('Error fetching mentorias:', error);
      toast.error('Erro ao carregar mentorias');
    } finally {
      setLoading(false);
    }
  };

  const [mentoriaDetails, setMentoriaDetails] = useState(null);
  const [allMentorias, setAllMentorias] = useState([]);

  const fetchMentoriaDetails = async (mentoriaId) => {
    try {
      const response = await axios.get(`${API}/mentorias/${mentoriaId}`);
      setMentoriaDetails(response.data);
    } catch (error) {
      console.error('Error fetching mentoria details:', error);
    }
  };

  useEffect(() => {
    // Fetch all available mentorias
    const fetchAllMentorias = async () => {
      try {
        const response = await axios.get(`${API}/mentorias`);
        setAllMentorias(response.data);
      } catch (error) {
        console.error('Error fetching all mentorias:', error);
      }
    };
    fetchAllMentorias();
  }, []);

  const handleSave = async () => {
    if (!selectedMentoria) return;

    setSaving(true);
    try {
      await axios.put(`${API}/mentorada-mentorias/${selectedMentoria.mentorada_mentoria_id}`, {
        ...selectedMentoria,
        ...formData,
      });
      toast.success('Diagnóstico atualizado com sucesso!');
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Erro ao salvar diagnóstico');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-12 flex items-center justify-center min-h-screen">
        <div className="text-[#DAA520] text-xl font-heading">Carregando...</div>
      </div>
    );
  }

  if (mentorias.length === 0) {
    return (
      <div className="p-6 md:p-12">
        <h1 className="text-4xl md:text-5xl font-heading font-semibold text-[#DAA520] mb-4" data-testid="mentoria-title">
          Minha Mentoria
        </h1>
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <p className="text-slate-300 text-lg">Você ainda não possui nenhuma mentoria ativa.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12">
      <h1 className="text-4xl md:text-5xl font-heading font-semibold text-[#DAA520] mb-8" data-testid="mentoria-title">
        Minha Mentoria
      </h1>

      <div className="space-y-6">
        {/* Mentoria Hero Card with Cover Image */}
        <div className="relative overflow-hidden rounded-2xl bg-[#111827]/80 backdrop-blur-md border border-white/5 shadow-xl">
          {/* Cover Image - Full Width */}
          {mentoriaDetails?.cover_image_url ? (
            <div className="relative w-full h-48 sm:h-64 md:h-80 overflow-hidden">
              <img
                src={mentoriaDetails.cover_image_url.startsWith('/uploads') 
                  ? `${BACKEND_URL}/api${mentoriaDetails.cover_image_url}` 
                  : mentoriaDetails.cover_image_url}
                alt={mentoriaDetails?.name}
                className="w-full h-full object-cover"
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-[#111827]/60 to-transparent" />
              
              {/* Title over image */}
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <div className="flex items-center space-x-2 mb-2">
                  <Activity className="w-5 h-5 text-[#DAA520]" />
                  <span className="text-xs sm:text-sm tracking-wide uppercase text-[#DAA520]/80">Minha Mentoria Ativa</span>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-white drop-shadow-lg" data-testid="mentoria-name">
                  {mentoriaDetails?.name || 'Carregando...'}
                </h2>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-48 sm:h-64 bg-gradient-to-br from-[#DAA520]/20 via-[#111827] to-[#0B1120] flex items-center justify-center">
              <div className="text-center p-6">
                <Activity className="w-16 h-16 text-[#DAA520]/40 mx-auto mb-4" />
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-[#DAA520]" data-testid="mentoria-name">
                  {mentoriaDetails?.name || 'Carregando...'}
                </h2>
              </div>
            </div>
          )}
          
          {/* Info Section */}
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-[#0B1120]/50 rounded-xl p-4">
                <p className="text-xs sm:text-sm text-slate-400 mb-1">Data de Início</p>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-[#DAA520]" />
                  <p className="text-base sm:text-lg text-slate-200" data-testid="start-date">
                    {new Date(selectedMentoria.start_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <div className="bg-[#0B1120]/50 rounded-xl p-4">
                <p className="text-xs sm:text-sm text-slate-400 mb-1">Status</p>
                <div className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${selectedMentoria.status === 'ativa' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                  <p className="text-base sm:text-lg text-slate-200 capitalize" data-testid="mentoria-status">{selectedMentoria.status}</p>
                </div>
              </div>
              {mentoriaDetails?.sales_link && (
                <div className="bg-[#0B1120]/50 rounded-xl p-4">
                  <p className="text-xs sm:text-sm text-slate-400 mb-1">Página da Mentoria</p>
                  <a 
                    href={mentoriaDetails.sales_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#DAA520] hover:text-[#B8860B] text-sm flex items-center space-x-1"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Ver página</span>
                  </a>
                </div>
              )}
            </div>
            
            {mentoriaDetails?.description && (
              <div className="mt-6 bg-[#0B1120]/30 rounded-xl p-4">
                <p className="text-xs sm:text-sm text-slate-400 mb-2">Sobre a Mentoria</p>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">{mentoriaDetails.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Outras Mentorias Disponíveis */}
        {allMentorias.length > 1 && (
          <div className="mt-12">
            <h2 className="text-2xl font-heading font-medium text-slate-200 mb-6">
              Outras Mentorias Disponíveis
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allMentorias.map((mentoria) => {
                const isUnlocked = mentorias.some(m => m.mentoria_id === mentoria.mentoria_id);
                const isCurrent = mentoriaDetails?.mentoria_id === mentoria.mentoria_id;
                
                if (isCurrent) return null; // Skip current mentoria
                
                return (
                  <div
                    key={mentoria.mentoria_id}
                    className={`relative overflow-hidden rounded-2xl border shadow-xl transition-all duration-300 ${
                      isUnlocked 
                        ? 'bg-[#111827]/80 border-[#DAA520]/30 hover:border-[#DAA520]/50' 
                        : 'bg-[#111827]/80 border-white/10 hover:border-white/20'
                    }`}
                  >
                    {/* Cover Image */}
                    {mentoria.cover_image_url ? (
                      <div className="h-40 overflow-hidden">
                        <img
                          src={mentoria.cover_image_url.startsWith('/uploads') 
                            ? `${BACKEND_URL}/api${mentoria.cover_image_url}` 
                            : mentoria.cover_image_url}
                          alt={mentoria.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-40 bg-gradient-to-br from-[#DAA520]/20 to-[#0B1120] flex items-center justify-center">
                        <Activity className="w-12 h-12 text-[#DAA520]/40" />
                      </div>
                    )}
                    
                    {/* Lock Overlay */}
                    {!isUnlocked && (
                      <div className="absolute top-2 right-2">
                        <div className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center border border-slate-600">
                          <Lock className="w-5 h-5 text-slate-400" />
                        </div>
                      </div>
                    )}
                    
                    {/* Unlocked Badge */}
                    {isUnlocked && (
                      <div className="absolute top-2 right-2">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/50">
                          <Unlock className="w-5 h-5 text-green-400" />
                        </div>
                      </div>
                    )}
                    
                    {/* Content */}
                    <div className="p-4">
                      <h3 className={`font-heading text-lg font-medium mb-2 ${
                        isUnlocked ? 'text-[#DAA520]' : 'text-slate-400'
                      }`}>
                        {mentoria.name}
                      </h3>
                      
                      {mentoria.description && (
                        <p className="text-sm text-slate-400 line-clamp-2 mb-3">
                          {mentoria.description}
                        </p>
                      )}
                      
                      {isUnlocked ? (
                        <span className="inline-flex items-center text-xs text-green-400">
                          <Unlock className="w-3 h-3 mr-1" />
                          Liberada
                        </span>
                      ) : (
                        <div className="space-y-2">
                          <span className="inline-flex items-center text-xs text-slate-500">
                            <Lock className="w-3 h-3 mr-1" />
                            Entre em contato para liberar
                          </span>
                          {mentoria.sales_link && (
                            <a
                              href={mentoria.sales_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-xs text-[#DAA520] hover:underline"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Saiba mais
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MinhaMentoria;
