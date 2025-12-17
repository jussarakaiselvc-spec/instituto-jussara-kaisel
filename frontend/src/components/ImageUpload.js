import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ImageUpload = ({ value, onChange, label = "Imagem" }) => {
  const [uploading, setUploading] = useState(false);
  const [useUrl, setUseUrl] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não permitido. Use: JPG, PNG, GIF ou WebP');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo: 5MB');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${BACKEND_URL}/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Construct full URL
      const imageUrl = `${BACKEND_URL}${response.data.url}`;
      onChange(imageUrl);
      toast.success('Imagem enviada com sucesso!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.detail || 'Erro ao enviar imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm text-slate-300">{label}</label>
        <button
          type="button"
          onClick={() => setUseUrl(!useUrl)}
          className="text-xs text-[#DAA520] hover:underline"
        >
          {useUrl ? 'Fazer upload' : 'Usar URL externa'}
        </button>
      </div>

      {useUrl ? (
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://exemplo.com/imagem.jpg"
          className="bg-[#0B1120]/50 border-slate-700 text-slate-200"
        />
      ) : (
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {!value ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full h-32 border-2 border-dashed border-slate-600 rounded-xl hover:border-[#DAA520]/50 transition-colors flex flex-col items-center justify-center gap-2 bg-[#0B1120]/30"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-8 h-8 text-[#DAA520] animate-spin" />
                  <span className="text-sm text-slate-400">Enviando...</span>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-slate-500" />
                  <span className="text-sm text-slate-400">Clique para enviar imagem</span>
                  <span className="text-xs text-slate-500">JPG, PNG, GIF ou WebP (máx. 5MB)</span>
                </>
              )}
            </button>
          ) : (
            <div className="relative">
              <img
                src={value}
                alt="Preview"
                className="w-full h-32 object-cover rounded-xl border border-slate-700"
                onError={(e) => {
                  e.target.src = '';
                  e.target.className = 'hidden';
                }}
              />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 p-1 bg-red-500/80 hover:bg-red-500 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          )}
        </div>
      )}

      {value && !useUrl && (
        <p className="text-xs text-green-400 flex items-center gap-1">
          <ImageIcon className="w-3 h-3" />
          Imagem carregada com sucesso
        </p>
      )}
    </div>
  );
};

export default ImageUpload;
