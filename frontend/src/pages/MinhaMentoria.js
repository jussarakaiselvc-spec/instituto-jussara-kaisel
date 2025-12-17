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

  const fetchMentoriaDetails = async (mentoriaId) => {
    try {
      const response = await axios.get(`${API}/mentorias/${mentoriaId}`);
      setMentoriaDetails(response.data);
    } catch (error) {
      console.error('Error fetching mentoria details:', error);
    }
  };

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
        {/* Mentoria Info Card */}
        <div className="relative overflow-hidden rounded-2xl bg-[#111827]/80 backdrop-blur-md border border-white/5 shadow-xl p-8">
          <div className="absolute inset-0 opacity-5">
            <img
              src="https://images.unsplash.com/photo-1584406029443-6f2aa671b5dd?crop=entropy&cs=srgb&fm=jpg&q=85"
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-4">
              <Activity className="w-6 h-6 text-[#DAA520]" />
              <span className="text-sm tracking-wide uppercase opacity-70 text-slate-400">Mentoria</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-heading font-medium text-[#DAA520] mb-6" data-testid="mentoria-name">
              {mentoriaDetails?.name || 'Carregando...'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-slate-400 mb-1">Data de Início</p>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-[#DAA520]" />
                  <p className="text-lg text-slate-200" data-testid="start-date">
                    {new Date(selectedMentoria.start_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Status</p>
                <p className="text-lg text-slate-200 capitalize" data-testid="mentoria-status">{selectedMentoria.status}</p>
              </div>
              {mentoriaDetails?.description && (
                <div className="col-span-1 md:col-span-3">
                  <p className="text-sm text-slate-400 mb-1">Descrição</p>
                  <p className="text-slate-300">{mentoriaDetails.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Diagnostico Card */}
        <div className="relative overflow-hidden rounded-2xl bg-[#111827]/80 backdrop-blur-md border border-white/5 shadow-xl p-8">
          <div className="flex items-center space-x-2 mb-6">
            <FileText className="w-6 h-6 text-[#DAA520]" />
            <h3 className="text-2xl font-heading font-medium text-slate-200">Diagnóstico</h3>
          </div>

          <div className="space-y-6">
            <div>
              <Label htmlFor="pdf-url" className="text-slate-300 mb-2 block">
                Link do PDF do Diagnóstico
              </Label>
              <Input
                id="pdf-url"
                data-testid="pdf-url-input"
                value={formData.diagnostico_pdf_url}
                onChange={(e) => setFormData({ ...formData, diagnostico_pdf_url: e.target.value })}
                placeholder="https://drive.google.com/..."
                className="bg-[#0B1120]/50 border-slate-700 focus:border-[#DAA520] focus:ring-1 focus:ring-[#DAA520] text-slate-200 placeholder:text-slate-600 rounded-xl h-12 px-4"
              />
              {formData.diagnostico_pdf_url && (
                <a
                  href={formData.diagnostico_pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="view-pdf-link"
                  className="inline-block mt-2 text-[#DAA520] hover:text-[#B8860B] text-sm transition-colors"
                >
                  Visualizar PDF
                </a>
              )}
            </div>

            <div>
              <Label htmlFor="pontos-chave" className="text-slate-300 mb-2 block">
                Pontos-Chave do Diagnóstico
              </Label>
              <Textarea
                id="pontos-chave"
                data-testid="pontos-chave-textarea"
                value={formData.diagnostico_pontos_chave}
                onChange={(e) => setFormData({ ...formData, diagnostico_pontos_chave: e.target.value })}
                placeholder="Descreva os principais pontos identificados no diagnóstico..."
                className="bg-[#0B1120]/50 border-slate-700 focus:border-[#DAA520] focus:ring-1 focus:ring-[#DAA520] text-slate-200 placeholder:text-slate-600 rounded-xl p-4 min-h-[120px]"
              />
            </div>

            <div>
              <Label htmlFor="foco-atual" className="text-slate-300 mb-2 block">
                Foco Atual do Trabalho
              </Label>
              <Textarea
                id="foco-atual"
                data-testid="foco-atual-textarea"
                value={formData.diagnostico_foco_atual}
                onChange={(e) => setFormData({ ...formData, diagnostico_foco_atual: e.target.value })}
                placeholder="Qual é o foco principal do seu trabalho atual na mentoria..."
                className="bg-[#0B1120]/50 border-slate-700 focus:border-[#DAA520] focus:ring-1 focus:ring-[#DAA520] text-slate-200 placeholder:text-slate-600 rounded-xl p-4 min-h-[120px]"
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              data-testid="save-diagnostico-button"
              className="bg-[#DAA520] text-[#0B1120] hover:bg-[#B8860B] font-medium px-8 py-3 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(218,165,32,0.3)] hover:shadow-[0_0_25px_rgba(218,165,32,0.5)]"
            >
              {saving ? 'Salvando...' : 'Salvar Diagnóstico'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MinhaMentoria;
