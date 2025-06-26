'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Lead {
  [key: string]: any;
}

interface UploadLeadsProps {
  onImport?: (leads: Lead[]) => void;
  initialFile?: File | null;
}

const UploadLeads: React.FC<UploadLeadsProps> = ({ onImport, initialFile }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  // Processar arquivo inicial se fornecido
  React.useEffect(() => {
    if (initialFile) {
      processFile(initialFile);
    }
  }, [initialFile]);

  // Adicionar event listener para paste
  React.useEffect(() => {
    const handleGlobalPaste = (event: ClipboardEvent) => {
      if (dropZoneRef.current && document.activeElement === dropZoneRef.current) {
        handlePaste(event);
      }
    };

    document.addEventListener('paste', handleGlobalPaste);
    return () => {
      document.removeEventListener('paste', handleGlobalPaste);
    };
  }, []);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('Por favor, selecione um arquivo Excel (.xlsx ou .xls)');
      return;
    }

    setIsLoading(true);
    setError('');
    setFileName(file.name);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      setLeads(jsonData as Lead[]);
    } catch (err) {
      setError('Erro ao processar o arquivo. Verifique se é um arquivo Excel válido.');
      console.error('Erro ao processar arquivo:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaste = async (event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          event.preventDefault();
          processFile(file);
          break;
        }
      }
    }
  };

  const handleImportLeads = () => {
    if (onImport) {
      onImport(leads);
      setLeads([]);
      setFileName('');
    } else {
      alert(`Importando ${leads.length} leads para o sistema...`);
    }
  };

  return (
    <div className="w-full">
      <div className="space-y-6">

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div
          ref={dropZoneRef}
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          <div className="flex flex-col items-center gap-4">
            {isLoading ? (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            ) : (
              <Upload size={48} className="text-gray-400" />
            )}
            
            <div>
              <p className="text-lg font-medium text-gray-700 mb-2">
                {isLoading ? 'Processando arquivo...' : 'Clique para selecionar, arraste ou cole (Ctrl+V) seu arquivo aqui'}
              </p>
              <p className="text-sm text-gray-500">
                Formatos suportados: .xlsx, .xls
              </p>
            </div>
          </div>
        </div>

        {fileName && !isLoading && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <FileSpreadsheet size={20} className="text-green-600" />
            <span className="text-green-700 font-medium">{fileName}</span>
          </div>
        )}

        {leads.length > 0 && (
          <div className="mt-6">
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={20} className="text-green-600" />
                <span className="font-medium text-green-700">
                  {leads.length} leads processados com sucesso!
                </span>
              </div>
              <div className="text-sm text-gray-600 mb-4">
                Preview dos primeiros campos detectados:
              </div>
              <div className="bg-gray-50 rounded p-3 text-sm">
                <strong>Campos encontrados:</strong> {Object.keys(leads[0] || {}).join(', ')}
              </div>
            </div>
            
            <div className="text-center mt-6">
              <button
                onClick={handleImportLeads}
                className="bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-8 rounded-lg transition-colors shadow-lg"
              >
                Confirmar Importação de {leads.length} leads
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadLeads;