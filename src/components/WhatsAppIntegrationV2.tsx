'use client';

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    ArrowPathIcon,
    QrCodeIcon,
    CheckCircleIcon,
    XCircleIcon,
    LinkIcon,
    PowerIcon,
    DocumentDuplicateIcon,
    UserGroupIcon,
    UserPlusIcon,
} from '@heroicons/react/24/outline';
import { AlertCircle } from 'lucide-react';
import { Search, UserIcon, Download } from 'lucide-react';
import {
    evolutionApiV2,
    EvolutionInstancesV2,
    QRCodeResponse,
    Contact,
} from '../services/evolutionApiV2';

import Modal from './Modal';
import ConfirmModal from './ConfirmModal';
import { agentesApi, Agente } from '@/services/agentesApi';
import { leadsApi, Lead } from '@/services/leadsApi';
import { getClienteId } from '@/utils/cliente-utils';

interface ImportError {
    phone: string;
    name: string;
    message: string;
}

const WhatsAppIntegrationV2: React.FC = () => {
    const [instances, setInstances] = useState<EvolutionInstancesV2[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [refreshingQR, setRefreshingQR] = useState(false);
    const [loadingInstances, setLoadingInstances] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingInstance, setEditingInstance] = useState<EvolutionInstancesV2 | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string | null }>({ show: false, id: null });
    const [qrCodeModal, setQrCodeModal] = useState<{
        show: boolean;
        data: QRCodeResponse | null;
        instanceName: string | null;
        instanceId: string | null;
        loading: boolean;
    }>({
        show: false,
        data: null,
        instanceName: null,
        instanceId: null,
        loading: false
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [showAgenteModal, setShowAgenteModal] = useState(false);
    const [selectedAgente, setSelectedAgente] = useState<any>(null);
    const [agentes, setAgentes] = useState<Agente[]>([]);
    const updateQtdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [contactsModal, setContactsModal] = useState<{
        show: boolean;
        instanceName: string | null;
        whatsappNumber: string | null;
        contacts: Contact[];
        loading: boolean;
    }>({
        show: false,
        instanceName: null,
        whatsappNumber: null,
        contacts: [],
        loading: false
    });
    const [importingContacts, setImportingContacts] = useState<Set<string>>(new Set());
    const [bulkImporting, setBulkImporting] = useState(false);
    const [bulkImportProgress, setBulkImportProgress] = useState({ current: 0, total: 0 });
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [importErrors, setImportErrors] = useState<ImportError[]>([]);
    const [contactSearchTerm, setContactSearchTerm] = useState('');

    // Estado local para manter compatibilidade com o formulário
    const [localFormData, setLocalFormData] = useState<EvolutionInstancesV2 | null>(null);

    useEffect(() => {
        loadInstances();
        loadAgentes();
    }, []);

    const loadInstances = async (showLoadingState = true) => {
        if (showLoadingState) {
            setLoading(true);
        } else {
            setLoadingInstances(true);
        }
        try {
            const response = await evolutionApiV2.getInstances();
            if (response.success && response.data && Array.isArray(response.data)) {
                setInstances(response.data.sort((a, b) => {
                    // Handle cases where createdAt might be undefined by providing default values
                    const dateA = a.createdAt || '';
                    const dateB = b.createdAt || '';
                    return dateA.localeCompare(dateB);
                }));
            }
        } catch (error) {
            console.error('Erro ao carregar instâncias:', error);
        } finally {
            if (showLoadingState) {
                setLoading(false);
            } else {
                setLoadingInstances(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validação obrigatória do agente
        if (!localFormData?.id_agente) {
            toast.error('Por favor, selecione um agente.');
            return;
        }

        setSubmitting(true);

        try {
            const response = editingInstance
                ? await evolutionApiV2.updateInstance(localFormData.instanceId, localFormData)
                : await evolutionApiV2.createInstance(localFormData)

            if (response.success) {
                loadInstances(false);
                resetForm();
            }
        } catch (error) {
            console.error('Erro ao salvar instância:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (instance: EvolutionInstancesV2) => {
        setLocalFormData(instance);
        setEditingInstance(instance);
        setShowModal(true);
    };

    const handleDelete = (id: string) => {
        setDeleteConfirm({ show: true, id });
    };

    const confirmDelete = async () => {
        if (deleteConfirm.id) {
            try {
                const response = await evolutionApiV2.deleteInstance(deleteConfirm.id);
                if (response.success) {
                    loadInstances(false);
                    setDeleteConfirm({ show: false, id: null });
                }
            } catch (error) {
                console.error('Erro ao deletar instância:', error);
            }
        }
    };

    // Modal para visualizar dados do agente
    const handleOpenAgenteModal = (agente: any) => {
        setSelectedAgente(agente);
        setShowAgenteModal(true);
    };

    const handleCloseAgenteModal = () => {
        setShowAgenteModal(false);
        setSelectedAgente(null);
    };

    const loadAgentes = async () => {
        try {
            const response = await agentesApi.getAgentes();
            setAgentes(response.data);
        } catch (error) {
            console.error('Erro ao carregar agentes:', error);
        }
    };

    const cancelDelete = () => {
        setDeleteConfirm({ show: false, id: null });
    };

    const handleConnect = async (instanceId: string, instanceName: string) => {
        // Abre o modal com loading
        setQrCodeModal({
            show: true,
            instanceName: instanceName,
            instanceId: instanceId,
            data: null,
            loading: true
        });

        try {
            const response = await evolutionApiV2.getQRCode(instanceId);
            if (response) {
                setQrCodeModal(prev => ({
                    ...prev,
                    data: response as any,
                    loading: false
                }));
            } else {
                setQrCodeModal(prev => ({
                    ...prev,
                    loading: false
                }));
                toast.error('Erro ao obter QR Code');
            }
        } catch (error) {
            console.error('Erro ao conectar instância:', error);
            setQrCodeModal(prev => ({
                ...prev,
                loading: false
            }));
            toast.error('Erro ao conectar instância');
        }
    };

    const handleDisconnect = async (instanceId: string) => {
        try {
            const response = await evolutionApiV2.disconnectInstance(instanceId);
            if (response.success) {
                loadInstances();
            }
        } catch (error) {
            console.error('Erro ao desconectar instância:', error);
            toast.error('Erro ao desconectar instância');
        }
    };

    const handleRestart = async (instanceId: string) => {
        try {
            const response = await evolutionApiV2.restartInstance(instanceId);
            if (response.success) {
                loadInstances();
            }
        } catch (error) {
            console.error('Erro ao reiniciar instância:', error);
            toast.error('Erro ao reiniciar instância');
        }
    };

    const handleRefreshQRCode = async () => {
        if (!qrCodeModal.instanceName) return;

        setQrCodeModal(prev => ({ ...prev, loading: true }));
        try {
            const response = await evolutionApiV2.getQRCode(qrCodeModal.instanceId || '');

            if (response) {
                setQrCodeModal(prev => ({ ...prev, data: response as any, loading: false }));
                toast.success('QR Code atualizado com sucesso!');
            } else {
                setQrCodeModal(prev => ({ ...prev, loading: false }));
                toast.error('Erro ao atualizar QR Code');
            }
        } catch (error) {
            console.error('Erro ao atualizar QR Code:', error);
            setQrCodeModal(prev => ({ ...prev, loading: false }));
            toast.error('Erro ao atualizar QR Code');
        }
    };

    const handleViewContacts = async (instanceName: string, whatsappNumber: string) => {
        setContactsModal({
            show: true,
            instanceName,
            whatsappNumber,
            contacts: [],
            loading: true
        });

        try {
            const response = await evolutionApiV2.getContacts(instanceName);
            if (response.success && response.data) {
                // Filtrar apenas contatos com números válidos (excluindo o próprio número)
                const validContacts = response.data.filter(contact => 
                    isValidPhoneNumber(contact.remoteJid, whatsappNumber)
                );
                
                setContactsModal(prev => ({
                    ...prev,
                    contacts: validContacts,
                    loading: false
                }));
            } else {
                setContactsModal(prev => ({
                    ...prev,
                    loading: false
                }));
                toast.error('Erro ao buscar contatos');
            }
        } catch (error) {
            console.error('Erro ao buscar contatos:', error);
            setContactsModal(prev => ({
                ...prev,
                loading: false
            }));
            toast.error('Erro ao buscar contatos');
        }
    };

    const resetForm = () => {
        setLocalFormData({
            instanceName: '',
            integration: 'WHATSAPP-BAILEYS',
            qrcode: true,
            followup: false,
            qtd_envios_diarios: 50,
            id_agente: '',
            Setting: {
                rejectCall: true,
                msgCall: '',
                groupsIgnore: true,
                alwaysOnline: true,
                readMessages: true,
                readStatus: false,
                syncFullHistory: false,
            }
        });

        setEditingInstance(null);
        setShowModal(false);
    };

    const getStatusIcon = (status: string) => {
        if (status === 'open') {
            return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
        } else {
            return <XCircleIcon className="h-5 w-5 text-red-500" />;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'open':
                return 'Conectado';
            case 'connecting':
                return 'Desconectado';
            case 'disconnected':
            case 'close':
            default:
                return 'Desconectado';
        }
    };

    const formatPhone = (phone: string) => {
        if (!phone) return 'Não conectado';
        // Remove todos os caracteres não numéricos
        const cleaned = phone.replace(/\D/g, '');

        // Se tem 13 dígitos e começa com 55, é um número brasileiro
        if (cleaned.length === 13 && cleaned.startsWith('55')) {
            const countryCode = cleaned.slice(0, 2);
            const areaCode = cleaned.slice(2, 4);
            const firstPart = cleaned.slice(4, 9);
            const secondPart = cleaned.slice(9, 13);
            return `+${countryCode} (${areaCode}) ${firstPart}-${secondPart}`;
        }

        // Se tem 12 dígitos e começa com 55, é um número brasileiro (telefone fixo)
        if (cleaned.length === 12 && cleaned.startsWith('55')) {
            const countryCode = cleaned.slice(0, 2);
            const areaCode = cleaned.slice(2, 4);
            const firstPart = cleaned.slice(4, 8);
            const secondPart = cleaned.slice(8, 12);
            return `+${countryCode} (${areaCode}) ${firstPart}-${secondPart}`;
        }

        // Se tem 11 dígitos, assume que é brasileiro sem código do país
        if (cleaned.length === 11) {
            const areaCode = cleaned.slice(0, 2);
            const firstPart = cleaned.slice(2, 7);
            const secondPart = cleaned.slice(7, 11);
            return `+55 (${areaCode}) ${firstPart}-${secondPart}`;
        }

        // Se tem 10 dígitos, assume que é brasileiro sem código do país (telefone fixo)
        if (cleaned.length === 10) {
            const areaCode = cleaned.slice(0, 2);
            const firstPart = cleaned.slice(2, 6);
            const secondPart = cleaned.slice(6, 10);
            return `+55 (${areaCode}) ${firstPart}-${secondPart}`;
        }

        // Retorna o número original se não conseguir formatar
        return phone;
    };

    const formatWhatsAppNumber = (remoteJid: string) => {
        if (!remoteJid) return '';
        // Remove o sufixo @s.whatsapp.net, @c.us, @g.us, etc
        const numberOnly = remoteJid.split('@')[0];
        // Usa a função formatPhone existente para formatar o número
        return formatPhone(numberOnly);
    };

    const copyPhoneToClipboard = async (phone: string) => {
        if (!phone || phone === 'Não conectado') {
            toast.error('Número não disponível para cópia');
            return;
        }

        try {
            // Verifica se o número tem o padrão @lid
            if (phone.includes('@lid')) {
                // Se tem @lid, copia o número completo incluindo @lid
                await navigator.clipboard.writeText(phone);
            } else {
                // Remove todos os caracteres não numéricos para copiar apenas os números
                const cleanPhone = phone.replace(/\D/g, '');
                await navigator.clipboard.writeText(cleanPhone);
            }
            toast.success('Número copiado para a área de transferência!');
        } catch (error) {
            console.error('Erro ao copiar número:', error);
            toast.error('Erro ao copiar número');
        }
    };

    const isValidPhoneNumber = (remoteJid: string, whatsappNumber?: string): boolean => {
        if (!remoteJid) return false;
        
        // Remove o sufixo @s.whatsapp.net, @c.us, @g.us, etc
        const numberOnly = remoteJid.split('@')[0];
        
        // Remove todos os caracteres não numéricos
        const cleanNumber = numberOnly.replace(/\D/g, '');
        
        // Verifica se é um número válido:
        // - Deve ter entre 10 e 13 dígitos (formato brasileiro: DDD + número ou 55 + DDD + número)
        // - Não deve ser um grupo (grupos geralmente têm formato diferente)
        // - Não deve conter apenas zeros ou números repetidos
        if (cleanNumber.length < 10 || cleanNumber.length > 13) return false;
        
        // Verifica se não é apenas zeros ou números repetidos
        if (/^0+$/.test(cleanNumber) || /(\d)\1+$/.test(cleanNumber)) return false;
        
        // Verifica se não é um ID de grupo (grupos geralmente terminam com @g.us)
        if (remoteJid.includes('@g.us')) return false;
        
        // Ignora o próprio número do WhatsApp
        if (whatsappNumber) {
            const cleanWhatsAppNumber = whatsappNumber.replace(/\D/g, '');
            if (cleanNumber === cleanWhatsAppNumber || cleanNumber.endsWith(cleanWhatsAppNumber) || cleanWhatsAppNumber.endsWith(cleanNumber)) {
                return false;
            }
        }
        
        return true;
    };

    const formatPhoneForLead = (remoteJid: string): string => {
        if (!remoteJid) return '';
        // Remove o sufixo @s.whatsapp.net, @c.us, @g.us, etc
        const numberOnly = remoteJid.split('@')[0];
        // Remove todos os caracteres não numéricos
        const cleanNumber = numberOnly.replace(/\D/g, '');
        
        // Garante que o número está no formato correto (5511999999999 ou 551199999999)
        // Se já tem código do país (55), retorna como está
        if (cleanNumber.startsWith('55')) {
            return cleanNumber;
        }
        
        // Se não tem código do país, adiciona 55 (Brasil)
        return `55${cleanNumber}`;
    };

    const importContactAsLead = async (contact: Contact) => {
        if (!contact.remoteJid || !isValidPhoneNumber(contact.remoteJid, contactsModal.whatsappNumber || undefined)) {
            toast.error('Número de telefone inválido ou grupo');
            return;
        }

        if (!contactsModal.instanceName || !contactsModal.whatsappNumber) {
            toast.error('Informações da instância não encontradas');
            return;
        }

        // Adiciona o contato ao set de importação
        setImportingContacts(prev => new Set(prev).add(contact.id));

        try {
            const phone = formatPhoneForLead(contact.remoteJid);
            const name = contact.pushName || 'Sem nome';

            const result = await evolutionApiV2.importContactAsLead(
                name, 
                phone, 
                contactsModal.instanceName, 
                contactsModal.whatsappNumber,
                contact.profilePicUrl
            );

            if (!result.success) {
                throw new Error(result.message);
            }

            toast.success(`Contato ${name} importado como lead com sucesso!`);
        } catch (error) {
            console.error('Erro ao importar contato:', error);
            toast.error(error instanceof Error ? String(error) : 'Erro ao importar contato');
        } finally {
            // Remove o contato do set de importação
            setImportingContacts(prev => {
                const newSet = new Set(prev);
                newSet.delete(contact.id);
                return newSet;
            });
        }
    };

    const bulkImportContacts = async () => {
        if (!contactsModal.contacts || contactsModal.contacts.length === 0) {
            toast.error('Nenhum contato disponível para importar');
            return;
        }

        if (!contactsModal.instanceName || !contactsModal.whatsappNumber) {
            toast.error('Informações da instância não encontradas');
            return;
        }

        setBulkImporting(true);
        const totalContacts = contactsModal.contacts.length;
        setBulkImportProgress({ current: 0, total: totalContacts });

        // Criar toast com progresso
        const toastId = toast.loading(
            <div className="flex flex-col gap-2 min-w-[250px]">
                <div className="flex justify-between items-center">
                    <span>Importando contatos...</span>
                    <span className="text-sm text-gray-500">0/{totalContacts}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: '0%' }}
                    ></div>
                </div>
            </div>,
            { duration: Infinity }
        );

        const errors: ImportError[] = [];
        const leadsToImport: Omit<Lead, 'id'>[] = [];

        try {
            // Preparar todos os leads
            for (let i = 0; i < contactsModal.contacts.length; i++) {
                const contact = contactsModal.contacts[i];
                
                try {
                    // Validar se o número é válido antes de processar
                    if (!contact.remoteJid || !isValidPhoneNumber(contact.remoteJid, contactsModal.whatsappNumber || undefined)) {
                        errors.push({
                            phone: contact.remoteJid || 'N/A',
                            name: contact.pushName || 'Sem nome',
                            message: 'Número de telefone inválido ou grupo'
                        });
                        continue;
                    }

                    const phone = formatPhoneForLead(contact.remoteJid);
                    const name = contact.pushName || 'Sem nome';

                    leadsToImport.push({
                        nome: name,
                        telefone: phone,
                        origem: `WhatsApp: ${contactsModal.instanceName}\\nNúmero: ${contactsModal.whatsappNumber}`,
                        profile_picture_url: contact.profilePicUrl || undefined
                    });

                } catch (error) {
                    errors.push({
                        phone: contact.remoteJid || 'N/A',
                        name: contact.pushName || 'Sem nome',
                        message: error instanceof Error ? error.message : 'Erro ao processar contato'
                    });
                }

                // Atualizar progresso
                const current = i + 1;
                setBulkImportProgress({ current, total: totalContacts });
                toast.loading(
                    <div className="flex flex-col gap-2 min-w-[250px]">
                        <div className="flex justify-between items-center">
                            <span>Preparando contatos...</span>
                            <span className="text-sm text-gray-500">{current}/{totalContacts}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(current / totalContacts) * 100}%` }}
                            ></div>
                        </div>
                    </div>,
                    { id: toastId }
                );
            }

            // Importar em massa usando a API
            if (leadsToImport.length > 0) {
                toast.loading(
                    <div className="flex flex-col gap-2 min-w-[250px]">
                        <div className="flex justify-between items-center">
                            <span>Enviando para o servidor...</span>
                            <span className="text-sm text-gray-500">{leadsToImport.length} leads</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full w-full animate-pulse"></div>
                        </div>
                    </div>,
                    { id: toastId }
                );

                const clienteId = getClienteId();
                const response = await leadsApi.createMultipleLeads(leadsToImport, clienteId);

                if (response.success) {
                    toast.dismiss(toastId);
                    
                    if (errors.length > 0) {
                        toast.success(`${leadsToImport.length} leads importados! ${errors.length} erro(s) encontrado(s).`, {
                            duration: 6000
                        });
                        setImportErrors(errors);
                        setShowErrorModal(true);
                    }

                    // Fechar modal de contatos
                    setContactsModal({ show: false, instanceName: null, whatsappNumber: null, contacts: [], loading: false });
                } else {
                    toast.dismiss(toastId);
                    
                    // Processar erros da API
                    if (response.errors && Array.isArray(response.errors)) {
                        response.errors.forEach((error: any) => {
                            const index = error.path && error.path[1] !== undefined ? error.path[1] : 0;
                            const lead = leadsToImport[index];
                            errors.push({
                                phone: lead?.telefone || 'N/A',
                                name: lead?.nome || 'Sem nome',
                                message: error.message || 'Erro desconhecido'
                            });
                        });
                    }

                    setImportErrors(errors);
                    setShowErrorModal(true);
                    toast.error('Erro ao importar alguns contatos. Verifique os detalhes.');
                }
            } else {
                toast.dismiss(toastId);
                if (errors.length > 0) {
                    setImportErrors(errors);
                    setShowErrorModal(true);
                    toast.error('Nenhum contato válido para importar');
                }
            }

        } catch (error) {
            console.error('Erro ao importar contatos em massa:', error);
            toast.dismiss(toastId);
            toast.error('Erro ao importar contatos em massa');
        } finally {
            setBulkImporting(false);
            setBulkImportProgress({ current: 0, total: 0 });
        }
    };

    // Função para exportar contatos para CSV
    const handleExportContactsCSV = () => {
        try {
            if (contactsModal.contacts.length === 0) {
                toast.error('Não há contatos para exportar');
                return;
            }

            // Definir cabeçalhos do CSV em português
            const headers = [
                'Nome',
                'Telefone'
            ];

            // Mapear dados dos contatos
            const csvData = contactsModal.contacts.map(contact => {
                return [
                    contact.pushName || 'Sem nome',
                    formatPhoneForLead(contact.remoteJid) || ''
                ];
            });

            // Criar conteúdo CSV
            const csvContent = [
                headers.join(';'),
                ...csvData.map(row =>
                    row.map(field => {
                        // Escapar aspas duplas e envolver campos com vírgulas/quebras de linha em aspas
                        const fieldStr = String(field || '');
                        if (fieldStr.includes(';') || fieldStr.includes('"') || fieldStr.includes('\n')) {
                            return `"${fieldStr.replace(/"/g, '""')}"`;
                        }
                        return fieldStr;
                    }).join(';')
                )
            ].join('\n');

            // Criar e baixar arquivo com BOM UTF-8 para corrigir acentuação
            const BOM = '\uFEFF'; // Byte Order Mark para UTF-8
            const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);

            link.setAttribute('href', url);
            link.setAttribute('download', `contatos_${contactsModal.instanceName}_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success(`${contactsModal.contacts.length} contatos exportados com sucesso!`);
        } catch (error) {
            console.error('Erro ao exportar CSV:', error);
            toast.error('Erro ao exportar contatos para CSV');
        }
    };

    // Filtrar contatos baseado no termo de busca
    const filteredContacts = contactsModal.contacts.filter(contact => {
        if (!contactSearchTerm) return true;
        const searchLower = contactSearchTerm.toLowerCase();
        const name = (contact.pushName || '').toLowerCase();
        const phone = formatWhatsAppNumber(contact.remoteJid).toLowerCase();
        return name.includes(searchLower) || phone.includes(searchLower);
    });

    // Filtrar instâncias baseado no termo de busca
    const filteredInstances = instances.filter(instance => {
        if (!searchTerm) return true;
        if (!instance) return false;
        return instance.instanceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            instance.instanceId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (instance.owner && instance.owner.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (instance.profileName && instance.profileName.toLowerCase().includes(searchTerm.toLowerCase()));
    });

    // Cálculos de paginação
    const totalPages = Math.ceil(filteredInstances.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentInstances = filteredInstances.slice(startIndex, endIndex);

    if (loading && instances.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-primary text-white p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <LinkIcon className="h-8 w-8 text-white" />
                            <div>
                                <h2 className="text-lg font-bold text-white !text-white">Integração WhatsApp</h2>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => loadInstances(false)}
                                disabled={loading || loadingInstances}
                                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5 text-white"
                            >
                                <ArrowPathIcon className={`h-4 w-4 ${(loading || loadingInstances) ? 'animate-spin' : ''}`} />
                                Atualizar
                            </button>
                            <button
                                onClick={() => {
                                    resetForm();
                                    setEditingInstance(null);
                                    setShowModal(true);
                                }}
                                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5 text-white"
                            >
                                <PlusIcon className="h-4 w-4" />
                                Nova Instância
                            </button>
                        </div>
                    </div>
                </div>

                {/* Estatísticas */}
                {instances.length > 0 && (
                    <div className="p-6 border-b border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">
                                    {instances.length}
                                </div>
                                <div className="text-sm text-gray-600">Total</div>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">
                                    {instances.filter(i => i.status === 'open').length}
                                </div>
                                <div className="text-sm text-gray-600">Conectadas</div>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">
                                    {instances.filter(i => i.status !== 'open').length}
                                </div>
                                <div className="text-sm text-gray-600">Desconectadas</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Barra de Busca */}
                <div className="p-3 bg-gray-50 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" width={16} height={16} />
                        <input
                            type="text"
                            placeholder="Buscar instâncias..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Tabela de Instâncias */}
                <div className="overflow-x-auto relative">
                    {loadingInstances && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                            <div className="flex items-center space-x-2">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                <span className="text-sm text-gray-600">Atualizando instâncias...</span>
                            </div>
                        </div>
                    )}
                    {currentInstances.length === 0 ? (
                        <div className="text-center py-12">
                            <LinkIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                                {searchTerm ? 'Nenhuma instância encontrada' : 'Nenhuma instância cadastrada'}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Comece criando sua primeira instância do WhatsApp.'}
                            </p>
                            {!searchTerm && (
                                <div className="mt-6">
                                    <button
                                        onClick={() => {
                                            resetForm();
                                            setEditingInstance(null);
                                            setShowModal(true);
                                        }}
                                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
                                    >
                                        <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                                        Nova Instância
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Perfil WhatsApp
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Instância
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Telefone
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Agente
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                        Follow UP
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                        Por dia
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentInstances.map((instance, index) => {
                                    if (!instance) return null;
                                    return (
                                        <tr key={instance.instanceId || `instance-${index}`} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {instance.profilePictureUrl && (
                                                        <img
                                                            src={instance.profilePictureUrl}
                                                            alt="Profile"
                                                            className="h-8 w-8 rounded-full"
                                                        />
                                                    )}
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {instance.profileName || 'Não conectado'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {instance.instanceName}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {formatPhone(instance.owner!)}
                                                    </div>
                                                    {instance.owner && instance.owner !== 'Não conectado' && (
                                                        <button
                                                            onClick={() => copyPhoneToClipboard(instance.owner!)}
                                                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                                            title="Copiar número"
                                                        >
                                                            <DocumentDuplicateIcon className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(instance.status || 'close')}
                                                    <span className={`text-sm font-medium text-primary`}>
                                                        {getStatusText(instance.status || 'close')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {instance.agente?.nome ? (
                                                            <button
                                                                onClick={() => handleOpenAgenteModal(instance.agente)}
                                                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors cursor-pointer"
                                                            >
                                                                {instance.agente?.nome}
                                                            </button>
                                                        ) : (
                                                            <span className="text-gray-400">Nenhum agente</span>
                                                        )}
                                                    </div>

                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={async () => {
                                                        if (!instance?.instanceId) return;
                                                        try {
                                                            const newValue = !instance.followup;
                                                            const response = await evolutionApiV2.updateInstance(instance.instanceId, {
                                                                followup: newValue
                                                            });
                                                            if (response.success) {
                                                                // Atualizar a instância localmente sem chamar a API novamente
                                                                setInstances(prev => prev.map(inst =>
                                                                    inst.instanceId === instance.instanceId
                                                                        ? { ...inst, followup: newValue }
                                                                        : inst
                                                                ));
                                                                toast.success(`Follow UP ${newValue ? 'ativado' : 'desativado'} com sucesso!`);
                                                            }
                                                        } catch (error) {
                                                            toast.error('Erro ao atualizar follow up');
                                                        }
                                                    }}
                                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300 shadow-sm cursor-pointer ${instance.followup ? 'bg-[#403CCF]' : 'bg-gray-300'
                                                        }`}
                                                    title={`Follow UP ${instance.followup ? 'ativo' : 'inativo'}`}
                                                >
                                                    <span
                                                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-300 ${instance.followup ? 'translate-x-5' : 'translate-x-1'
                                                            }`}
                                                    />
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={instance.qtd_envios_diarios || 0}
                                                    disabled={!instance.followup}
                                                    onChange={(e) => {
                                                        const newValue = Math.max(0, parseInt(e.target.value) || 0);

                                                        // Atualizar o estado local imediatamente para feedback visual
                                                        setInstances(prev => prev.map(inst =>
                                                            inst.instanceId === instance.instanceId
                                                                ? { ...inst, qtd_envios_diarios: newValue }
                                                                : inst
                                                        ));

                                                        // Limpar timeout anterior se existir
                                                        if (updateQtdTimeoutRef.current) {
                                                            clearTimeout(updateQtdTimeoutRef.current);
                                                        }

                                                        // Criar novo timeout com delay de 1 segundo
                                                        updateQtdTimeoutRef.current = setTimeout(async () => {
                                                            try {
                                                                const response = await evolutionApiV2.updateInstance(instance.instanceId, {
                                                                    qtd_envios_diarios: newValue
                                                                });
                                                                if (response.success) {
                                                                    toast.success('Quantidade de envios atualizada com sucesso!');
                                                                }
                                                            } catch (error) {
                                                                console.error('Erro ao atualizar quantidade de envios:', error);
                                                                toast.error('Erro ao atualizar quantidade de envios');
                                                                // Reverter o valor em caso de erro
                                                                setInstances(prev => prev.map(inst =>
                                                                    inst.instanceId === instance.instanceId
                                                                        ? { ...inst, qtd_envios_diarios: instance.qtd_envios_diarios || 0 }
                                                                        : inst
                                                                ));
                                                            }
                                                        }, 1000);
                                                    }}
                                                    className={`w-20 px-2 py-1 border rounded text-sm text-center ${!instance.followup
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        : 'bg-white text-gray-900 border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent'
                                                        }`}
                                                    title={!instance.followup ? 'Ative o Follow UP para configurar' : 'Quantidade de envios por dia'}
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center space-x-2">
                                                    {(instance.status || 'close') !== 'open' ? (
                                                        <button
                                                            onClick={() => handleConnect(instance.instanceId!, instance.instanceName!)}
                                                            className="inline-flex items-center px-3 py-1.5 border border-green-300 text-xs font-medium rounded text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                                            title="Conectar"
                                                        >
                                                            <QrCodeIcon className="h-4 w-4 mr-1" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleDisconnect(instance.instanceId!)}
                                                            className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                                            title="Desconectar"
                                                        >
                                                            <PowerIcon className="h-4 w-4 mr-1" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleRestart(instance.instanceId!)}
                                                        disabled={instance.status !== 'open'}
                                                        className={`inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 ${instance.status !== 'open'
                                                            ? 'border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed'
                                                            : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-gray-500'
                                                            }`}
                                                        title={instance.status !== 'open' ? 'Não é possível Reiniciar instância desconectada' : 'Reiniciar'}
                                                    >
                                                        <ArrowPathIcon className="h-4 w-4 mr-1" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleViewContacts(instance.instanceName!, instance.owner || '')}
                                                        disabled={instance.status !== 'open'}
                                                        className={`inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 ${instance.status !== 'open'
                                                            ? 'border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed'
                                                            : 'border-blue-300 text-blue-700 bg-white hover:bg-blue-50 focus:ring-blue-500'
                                                            }`}
                                                        title={instance.status !== 'open' ? 'Conecte a instância para ver contatos' : 'Ver Contatos'}
                                                    >
                                                        <UserPlusIcon className="h-4 w-4 mr-1" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(instance)}
                                                        className="inline-flex items-center px-3 py-1.5 border border-primary text-xs font-medium rounded text-primary bg-white hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                                        title="Editar"
                                                    >
                                                        <PencilIcon className="h-4 w-4 mr-1" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(instance.instanceId!)}
                                                        disabled={instance.status === 'open'}
                                                        className={`inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 ${instance.status === 'open'
                                                            ? 'border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed'
                                                            : 'border-red-300 text-red-700 bg-white hover:bg-red-50 focus:ring-red-500'
                                                            }`}
                                                        title={instance.status === 'open' ? 'Não é possível excluir instância conectada' : 'Excluir'}
                                                    >
                                                        <TrashIcon className="h-4 w-4 mr-1" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {filteredInstances.length > 0 && (
                    <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <p className="text-sm text-gray-700">
                                    Mostrando <span className="font-medium">{startIndex + 1}</span> a{' '}
                                    <span className="font-medium">{Math.min(endIndex, filteredInstances.length)}</span> de{' '}
                                    <span className="font-medium">{filteredInstances.length}</span> resultados
                                </p>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="ml-4 text-sm border border-gray-300 rounded px-2 py-1"
                                >
                                    <option value={5}>5 por página</option>
                                    <option value={10}>10 por página</option>
                                    <option value={20}>20 por página</option>
                                    <option value={50}>50 por página</option>
                                </select>
                            </div>
                            <div className="flex space-x-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNumber;
                                    if (totalPages <= 5) {
                                        pageNumber = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNumber = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNumber = totalPages - 4 + i;
                                    } else {
                                        pageNumber = currentPage - 2 + i;
                                    }

                                    return (
                                        <button
                                            key={pageNumber}
                                            onClick={() => setCurrentPage(pageNumber)}
                                            className={`px-3 py-1 text-sm border rounded-md ${currentPage === pageNumber
                                                ? 'bg-primary text-white border-primary'
                                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            {pageNumber}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal para criar/editar instância */}
            <Modal
                isOpen={showModal}
                onClose={resetForm}
                title={editingInstance ? 'Editar Instância' : 'Nova Instância'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nome da Instância
                        </label>
                        <input
                            type="text"
                            value={localFormData?.instanceName}
                            onChange={(e) => {
                                let instanceName = e.target.value;
                                // No cadastro, não permitir espaços
                                if (!editingInstance) {
                                    instanceName = instanceName.replace(/\s/g, '');
                                }
                                setLocalFormData({
                                    ...localFormData,
                                    instanceName,
                                });
                            }}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm ${editingInstance ? 'bg-gray-100 cursor-not-allowed' : ''
                                }`}
                            placeholder="Digite o nome da instância"
                            disabled={!!editingInstance}
                            required
                        />
                    </div>

                    {/* Configurações setting */}
                    <div className="border-t pt-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-3">Configurações</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center">

                                <input
                                    type="checkbox"
                                    id="rejectCall"
                                    checked={localFormData?.Setting?.rejectCall}
                                    onChange={(e) => setLocalFormData({ ...localFormData, Setting: { ...localFormData?.Setting, rejectCall: e.target.checked } })}
                                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                />
                                <label htmlFor="rejectCall" className="ml-2 block text-sm text-gray-900">
                                    Rejeitar Chamadas
                                </label>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="groupsIgnore"
                                    checked={localFormData?.Setting?.groupsIgnore}
                                    onChange={(e) => setLocalFormData({ ...localFormData, Setting: { ...localFormData?.Setting, groupsIgnore: e.target.checked } })}
                                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                />
                                <label htmlFor="groupsIgnore" className="ml-2 block text-sm text-gray-900">
                                    Ignorar Grupos
                                </label>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="alwaysOnline"
                                    checked={localFormData?.Setting?.alwaysOnline}
                                    onChange={(e) => setLocalFormData({ ...localFormData, Setting: { ...localFormData?.Setting, alwaysOnline: e.target.checked } })}
                                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                />
                                <label htmlFor="alwaysOnline" className="ml-2 block text-sm text-gray-900">
                                    Sempre Online
                                </label>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="readMessages"
                                    checked={localFormData?.Setting?.readMessages}
                                    onChange={(e) => setLocalFormData({ ...localFormData, Setting: { ...localFormData?.Setting, readMessages: e.target.checked } })}
                                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                />
                                <label htmlFor="readMessages" className="ml-2 block text-sm text-gray-900">
                                    Ler Mensagens
                                </label>
                            </div>
                        </div>

                        <div className="mt-4 mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mensagem para Chamadas Rejeitadas
                            </label>
                            <textarea
                                value={localFormData?.Setting?.msgCall}
                                onChange={(e) => setLocalFormData({ ...localFormData, Setting: { ...localFormData?.Setting, msgCall: e.target.value } })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm h-24"
                                placeholder="Mensagem automática para chamadas rejeitadas"
                            />
                        </div>

                        {/* ID do Agente */}
                        <div className="mb-4 border-t pt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Agente
                            </label>
                            <select
                                value={localFormData?.id_agente}
                                onChange={(e) => setLocalFormData({ ...localFormData, id_agente: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                                required
                            >
                                <option value="">Selecione um agente</option>
                                {agentes.map((agente) => (
                                    <option key={agente.id} value={agente.id}>
                                        {agente.nome} - {agente.tipo_agente?.nome || 'Sem tipo'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Follow UP e Quantidade lado a lado */}
                        <div className="flex mb-4">
                            {/* Follow UP */}
                            <div className="mt-2 mr-4">
                                <div className="flex items-center">
                                    <label className="mr-3 block text-sm text-gray-900">
                                        Follow UP
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setLocalFormData({ ...localFormData, followup: !localFormData?.followup })}
                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300 shadow-sm cursor-pointer ${localFormData?.followup ? 'bg-[#403CCF]' : 'bg-gray-300'
                                            }`}
                                        title={`Follow UP ${localFormData?.followup ? 'ativo' : 'inativo'}`}
                                    >
                                        <span
                                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-300 ${localFormData?.followup ? 'translate-x-5' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* Por dia */}
                            <div className="flex-1 flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                                    Por dia
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={localFormData?.qtd_envios_diarios}
                                    onChange={(e) => {
                                        const value = Math.max(0, parseInt(e.target.value) || 0);
                                        setLocalFormData({ ...localFormData, qtd_envios_diarios: value });
                                    }}
                                    className={`w-16 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-center ${!localFormData?.followup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    placeholder="0"
                                    disabled={!localFormData?.followup}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={resetForm}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md flex items-center justify-center space-x-2 ${submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary'
                                }`}
                        >
                            {submitting && (
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            <span>
                                {submitting
                                    ? (editingInstance ? 'Atualizando...' : 'Criando...')
                                    : (editingInstance ? 'Atualizar' : 'Criar Instância')
                                }
                            </span>
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal QR Code */}
            <Modal
                isOpen={qrCodeModal.show}
                onClose={() => {
                    setQrCodeModal({
                        show: false,
                        instanceName: null,
                        instanceId: null,
                        data: null,
                        loading: false
                    });
                    loadInstances(false); // Recarrega as instâncias ao fechar o modal com loading específico
                }}
                title={`QR Code - ${qrCodeModal.instanceName}`}
                size="md"
            >
                <div className="text-center space-y-4">
                    {qrCodeModal.loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <>
                            {qrCodeModal.data?.base64 && qrCodeModal.data.base64 !== "data:image/png;base64," && (
                                <div className="flex justify-center">
                                    <img
                                        src={qrCodeModal.data.base64}
                                        alt="QR Code"
                                        className="max-w-xs"
                                    />
                                </div>
                            )}

                            {qrCodeModal.data?.code && (!qrCodeModal.data?.base64 || qrCodeModal.data.base64 === "data:image/png;base64,") && (
                                <div className="flex justify-center">
                                    <img
                                        src={qrCodeModal.data.code}
                                        alt="QR Code"
                                        className="max-w-xs"
                                    />
                                </div>
                            )}

                            {qrCodeModal.data?.pairingCode && (
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <p className="text-sm text-blue-800 mb-2">Código de Pareamento:</p>
                                    <code className="text-lg font-mono font-bold text-blue-900">{qrCodeModal.data.pairingCode}</code>
                                </div>
                            )}

                            {(!qrCodeModal.data?.base64 || qrCodeModal.data.base64 === "data:image/png;base64,") && !qrCodeModal.data?.code && !qrCodeModal.data?.pairingCode && (
                                <div className="text-center text-gray-500">
                                    <p className="mb-2">Não foi possível carregar o QRCode.</p>
                                    <button
                                        onClick={handleRefreshQRCode}
                                        disabled={qrCodeModal.loading}
                                        className="text-blue-600 hover:text-blue-800 underline text-sm"
                                    >
                                        Clique aqui para atualizar
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    <p className="text-sm text-gray-600">
                        Escaneie o QR Code com seu WhatsApp para conectar a instância.
                    </p>

                    <div className="flex space-x-3 pt-4">
                        <button
                            onClick={handleRefreshQRCode}
                            disabled={refreshingQR}
                            className={`flex-1 px-4 py-2 text-sm font-medium border border-gray-300 rounded-md flex items-center justify-center space-x-2 ${refreshingQR ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            {refreshingQR && (
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            <span>{refreshingQR ? 'Atualizando...' : 'Atualizar QR'}</span>
                        </button>
                        <button
                            onClick={() => {
                                setQrCodeModal({
                                    show: false,
                                    instanceName: null,
                                    instanceId: null,
                                    data: null,
                                    loading: false
                                });
                                loadInstances(false); // Recarrega as instâncias ao fechar o modal com loading específico
                            }}
                            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal de confirmação de exclusão */}
            <ConfirmModal
                isOpen={deleteConfirm.show}
                onConfirm={confirmDelete}
                onClose={cancelDelete}
                title="Excluir Instância"
                message="Tem certeza que deseja excluir esta instância? Esta ação não pode ser desfeita."
                confirmText="Excluir"
                cancelText="Cancelar"
                type="danger"
            />

            {/* Modal de Detalhes do Agente */}
            <Modal
                isOpen={showAgenteModal && !!selectedAgente}
                onClose={handleCloseAgenteModal}
                title={`Detalhes do Agente - ${selectedAgente?.nome}`}
                size="2xl"
            >
                <div>
                    {selectedAgente ? (
                        <div className="space-y-6">
                            {/* Informações básicas */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Coluna esquerda */}
                                <div className="space-y-4">
                                    {/* Nome */}
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Nome do Agente</label>
                                        <div className="text-sm font-medium text-gray-900 mt-1">
                                            {selectedAgente?.nome || 'Nome não disponível'}
                                        </div>
                                    </div>

                                    {/* Tipo de Agente */}
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de Agente</label>
                                        <div className="text-sm font-medium text-gray-900 mt-1">
                                            {selectedAgente?.tipo_agente?.nome || 'Não definido'}
                                        </div>
                                    </div>


                                </div>

                                {/* Coluna direita */}
                                <div className="space-y-4">
                                    {/* Status */}
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`inline-flex h-4 w-7 items-center rounded-full ${selectedAgente?.ativo ? 'bg-[#403CCF]' : 'bg-gray-300'
                                                }`}>
                                                <span className={`inline-block h-2 w-2 transform rounded-full bg-white transition-transform ${selectedAgente?.ativo ? 'translate-x-4' : 'translate-x-1'
                                                    }`} />
                                            </span>
                                            <span className="text-sm font-medium text-gray-900">
                                                {selectedAgente?.ativo ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Agendamento */}
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Agendamento</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`inline-flex h-4 w-7 items-center rounded-full ${selectedAgente?.agendamento ? 'bg-[#403CCF]' : 'bg-gray-300'
                                                }`}>
                                                <span className={`inline-block h-2 w-2 transform rounded-full bg-white transition-transform ${selectedAgente?.agendamento ? 'translate-x-4' : 'translate-x-1'
                                                    }`} />
                                            </span>
                                            <span className="text-sm text-gray-600">
                                                {selectedAgente?.agendamento ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </div>
                                    </div>

                                </div>
                            </div>

                            {/* Prompt Principal */}
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Prompt Principal</label>
                                <textarea
                                    value={selectedAgente?.prompt || ''}
                                    placeholder="Nenhum prompt definido"
                                    className="mt-2 w-full p-4 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    rows={6}
                                    readOnly
                                />
                            </div>

                            {/* Prompt de Agendamento */}
                            {selectedAgente?.agendamento && selectedAgente?.prompt_agendamento && (
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Prompt de Agendamento</label>
                                    <div className="mt-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <div className="text-sm text-gray-900 whitespace-pre-wrap max-h-40 overflow-y-auto">
                                            {selectedAgente?.prompt_agendamento}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
                            </div>
                            <p className="text-gray-500">Nenhum agente selecionado.</p>
                        </div>
                    )}

                    <div className="flex justify-end pt-4 border-t border-gray-200 mt-6">
                        <button
                            onClick={handleCloseAgenteModal}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal de Contatos */}
            <Modal
                isOpen={contactsModal.show}
                onClose={() => {
                    setContactsModal({ show: false, instanceName: null, whatsappNumber: null, contacts: [], loading: false });
                    setContactSearchTerm('');
                }}
                title={`Contatos - ${contactsModal.instanceName}`}
                size="2xl"
            >
                <div>
                    {contactsModal.loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : contactsModal.contacts.length === 0 ? (
                        <div className="text-center py-12">
                            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum contato encontrado</h3>
                            <p className="mt-1 text-sm text-gray-500">Esta instância ainda não possui contatos salvos.</p>
                        </div>
                    ) : (
                        <>
                            {/* Campo de busca */}
                            <div className="relative mb-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={contactSearchTerm}
                                    onChange={(e) => setContactSearchTerm(e.target.value)}
                                    placeholder="Buscar por nome ou número..."
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                                />
                            </div>

                            {filteredContacts.length === 0 ? (
                                <div className="text-center py-8">
                                    <Search className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum contato encontrado</h3>
                                    <p className="mt-1 text-sm text-gray-500">Tente buscar com outros termos.</p>
                                </div>
                            ) : (
                                <div className="max-h-96 overflow-y-auto">
                                    <div className="grid grid-cols-1 gap-3">
                                    {filteredContacts.map((contact) => (
                                    <div
                                        key={contact.id}
                                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        {contact.profilePicUrl ? (
                                            <div className="h-10 w-10 rounded-full relative bg-gray-300 flex items-center justify-center">
                                                <img
                                                    src={contact.profilePicUrl}
                                                    aria-hidden="true"
                                                    className="h-10 w-10 rounded-full absolute inset-0"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                                <UserIcon
                                                    aria-hidden="true"
                                                    className="h-6 w-6 text-gray-600"
                                                />
                                            </div>
                                        ) : (
                                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                                <UserIcon className="h-6 w-6 text-gray-600" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {contact.pushName}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {formatWhatsAppNumber(contact.remoteJid)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => importContactAsLead(contact)}
                                                disabled={importingContacts.has(contact.id)}
                                                className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Importar como lead"
                                            >
                                                {importingContacts.has(contact.id) ? (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                                                ) : (
                                                    <UserPlusIcon className="h-4 w-4" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => copyPhoneToClipboard(contact.remoteJid)}
                                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                                title="Copiar número"
                                            >
                                                <DocumentDuplicateIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                </div>
                            </div>
                            )}
                        </>
                    )}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                            {contactSearchTerm ? (
                                <>
                                    Exibindo: <span className="font-medium">{filteredContacts.length.toLocaleString('pt-BR')}</span> de <span className="font-medium">{contactsModal.contacts.length.toLocaleString('pt-BR')}</span> contatos
                                </>
                            ) : (
                                <>
                                    Total: <span className="font-medium">{contactsModal.contacts.length.toLocaleString('pt-BR')}</span> contatos
                                </>
                            )}
                        </p>
                        <div className="flex gap-3">
                            {contactsModal.contacts.length > 0 && (
                                <>
                                    <button
                                        onClick={handleExportContactsCSV}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                                        title="Exportar contatos para CSV"
                                    >
                                        <Download className="h-4 w-4" />
                                        <span>Exportar CSV</span>
                                    </button>
                                    <button
                                        onClick={bulkImportContacts}
                                        disabled={bulkImporting}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        title="Importar todos os contatos como leads"
                                    >
                                        {bulkImporting ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                <span>Importando...</span>
                                            </>
                                        ) : (
                                            <>
                                                <UserPlusIcon className="h-4 w-4" />
                                                <span>Importar Leads</span>
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => {
                                    setContactsModal({ show: false, instanceName: null, whatsappNumber: null, contacts: [], loading: false });
                                    setContactSearchTerm('');
                                }}
                                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Modal de Erros de Importação */}
            {showErrorModal && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 text-gray-700"
                    onClick={() => {
                        setShowErrorModal(false);
                        setImportErrors([]);
                    }}
                >
                    <div
                        className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">
                                    Erros na Importação
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {importErrors.length} erro(s) encontrado(s) durante a importação
                                </p>
                            </div>
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                            <p className="text-red-800 text-sm">
                                <strong>Atenção:</strong> Os contatos com erros não foram importados. Corrija os problemas e tente novamente.
                            </p>
                        </div>

                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Nome
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Telefone
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Erro
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {importErrors.map((error, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                                {error.name}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-700">
                                                {error.phone}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-700">
                                                {error.message}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex gap-3 justify-end mt-6">
                            <button
                                onClick={() => {
                                    setShowErrorModal(false);
                                    setImportErrors([]);
                                }}
                                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WhatsAppIntegrationV2;