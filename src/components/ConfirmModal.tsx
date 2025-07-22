import React from 'react';
import Modal from './Modal';
import { ExclamationTriangleIcon, TrashIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'success' | 'info';
  icon?: React.ReactNode;
  isLoading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger',
  icon,
  isLoading = false
}) => {
  const typeConfig = {
    danger: {
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      titleColor: 'text-red-600',
      confirmBg: 'bg-red-600 hover:bg-red-700',
      defaultIcon: <TrashIcon className="w-5 h-5" />
    },
    warning: {
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      titleColor: 'text-yellow-600',
      confirmBg: 'bg-yellow-600 hover:bg-yellow-700',
      defaultIcon: <ExclamationTriangleIcon className="w-5 h-5" />
    },
    success: {
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      titleColor: 'text-green-600',
      confirmBg: 'bg-green-600 hover:bg-green-700',
      defaultIcon: <CheckCircleIcon className="w-5 h-5" />
    },
    info: {
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-600',
      confirmBg: 'bg-blue-600 hover:bg-blue-700',
      defaultIcon: <InformationCircleIcon className="w-5 h-5" />
    }
  };

  const config = typeConfig[type];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={false}
      closeOnBackdropClick={!isLoading}
    >
      <div className="text-center">
        {/* Ícone */}
        <div className="flex justify-center mb-4">
          <div className={`flex-shrink-0 w-12 h-12 ${config.iconBg} rounded-full flex items-center justify-center`}>
            <div className={config.iconColor}>
              {icon || config.defaultIcon}
            </div>
          </div>
        </div>

        {/* Título */}
        <h3 className={`text-lg font-semibold mb-3 ${config.titleColor}`}>
          {title}
        </h3>

        {/* Mensagem */}
        <div className="text-gray-700 mb-6 text-sm">
          {typeof message === 'string' ? (
            <p dangerouslySetInnerHTML={{ __html: message }} />
          ) : (
            message
          )}
        </div>

        {/* Aviso adicional para ações perigosas */}
        {type === 'danger' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
            <p className="text-red-800 text-sm">
              <strong>Atenção:</strong> Esta ação não pode ser desfeita.
            </p>
          </div>
        )}

        {/* Botões */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 ${config.confirmBg} text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;