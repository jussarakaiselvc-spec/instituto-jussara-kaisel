import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MeusProdutos = ({ user }) => {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProdutos();
  }, []);

  const fetchProdutos = async () => {
    try {
      const response = await axios.get(`${API}/produtos/my`);
      setProdutos(response.data);
    } catch (error) {
      console.error('Error fetching produtos:', error);
      toast.error('Erro ao carregar produtos');
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

  return (
    <div className="p-6 md:p-12">
      <h1 className="text-4xl md:text-5xl font-heading font-semibold text-[#DAA520] mb-8" data-testid="produtos-title">
        Meus Produtos
      </h1>

      {produtos.length === 0 ? (
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <p className="text-slate-300 text-lg">Você ainda não possui produtos adquiridos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {produtos.map((produto, index) => (
            <div
              key={produto.produto_id}
              data-testid={`produto-${index}`}
              className="relative overflow-hidden rounded-2xl bg-[#111827]/80 backdrop-blur-md border border-white/5 shadow-xl p-6 group hover:border-[#DAA520]/30 transition-all duration-500 cursor-pointer hover:-translate-y-1"
            >
              <div className="flex items-center space-x-2 mb-4">
                <Package className="w-6 h-6 text-[#DAA520]" />
                <span className="text-sm tracking-wide uppercase opacity-70 text-slate-400">Produto</span>
              </div>

              <h3 className="text-2xl font-heading font-medium text-slate-200 mb-3" data-testid={`produto-name-${index}`}>
                {produto.name}
              </h3>

              {produto.description && (
                <p className="text-slate-400 mb-4 leading-relaxed" data-testid={`produto-desc-${index}`}>
                  {produto.description}
                </p>
              )}

              {produto.content_url && (
                <Button
                  onClick={() => window.open(produto.content_url, '_blank')}
                  data-testid={`produto-access-${index}`}
                  className="w-full bg-[#DAA520] text-[#0B1120] hover:bg-[#B8860B] font-medium px-6 py-3 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(218,165,32,0.3)] hover:shadow-[0_0_25px_rgba(218,165,32,0.5)] flex items-center justify-center space-x-2"
                >
                  <span>Acessar Conteúdo</span>
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MeusProdutos;
