import toast from 'react-hot-toast';

export interface ToastConfig {
  showSuccess?: boolean;
  showError?: boolean;
  successMessage?: string;
  errorMessage?: string;
  duration?: number;
}

export class ToastInterceptor {
  private static defaultConfig: ToastConfig = {
    showSuccess: true,
    showError: true,
    duration: 8000,
  };

  // Armazenar mensagens ativas para evitar duplicatas
  private static activeMessages: Set<string> = new Set();
  private static messageTimers: Map<string, NodeJS.Timeout> = new Map();

  static handleSuccess(message?: string, config?: ToastConfig) {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    if (finalConfig.showSuccess) {
      const successMessage = message || finalConfig.successMessage || 'Operação realizada com sucesso!';
      
      // Verificar se a mensagem já está ativa
      const messageKey = `success:${successMessage}`;
      if (this.activeMessages.has(messageKey)) {
        return; // Não exibir mensagem duplicada
      }
      
      // Adicionar à lista de mensagens ativas
      this.activeMessages.add(messageKey);
      
      toast.success(successMessage, {
        duration: finalConfig.duration,
        position: 'bottom-right',
        style: {
          background: '#10B981',
          color: '#fff',
          fontWeight: '500',
        },
        iconTheme: {
          primary: '#fff',
          secondary: '#10B981',
        },
      });
      
      // Remover da lista após a duração do toast
      const timer = setTimeout(() => {
        this.activeMessages.delete(messageKey);
        this.messageTimers.delete(messageKey);
      }, finalConfig.duration || 8000);
      
      this.messageTimers.set(messageKey, timer);
    }
  }

  static handleError(message?: string, config?: ToastConfig) {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    if (finalConfig.showError) {
      const errorMessage = message || finalConfig.errorMessage || 'Ocorreu um erro. Tente novamente.';
      
      // Verificar se a mensagem já está ativa
      const messageKey = `error:${errorMessage}`;
      if (this.activeMessages.has(messageKey)) {
        return; // Não exibir mensagem duplicada
      }
      
      // Adicionar à lista de mensagens ativas
      this.activeMessages.add(messageKey);
      
      toast.error(errorMessage, {
        duration: finalConfig.duration,
        position: 'bottom-right',
        style: {
          background: '#EF4444',
          color: '#fff',
          fontWeight: '500',
        },
        iconTheme: {
          primary: '#fff',
          secondary: '#EF4444',
        },
      });
      
      // Remover da lista após a duração do toast
      const timer = setTimeout(() => {
        this.activeMessages.delete(messageKey);
        this.messageTimers.delete(messageKey);
      }, finalConfig.duration || 8000);
      
      this.messageTimers.set(messageKey, timer);
    }
  }

  static handleLoading(message: string = 'Carregando...') {
    return toast.loading(message, {
      position: 'top-right',
      style: {
        background: '#3B82F6',
        color: '#fff',
        fontWeight: '500',
      },
    });
  }

  static dismiss(toastId?: string) {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
      // Limpar todas as mensagens ativas e timers
      this.activeMessages.clear();
      this.messageTimers.forEach(timer => clearTimeout(timer));
      this.messageTimers.clear();
    }
  }

  static promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error | unknown) => string);
    },
    config?: ToastConfig
  ) {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    return toast.promise(
      promise,
      messages,
      {
        position: 'top-right',
        duration: finalConfig.duration,
        style: {
          fontWeight: '500',
        },
        success: {
          style: {
            background: '#10B981',
            color: '#fff',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#10B981',
          },
        },
        error: {
          style: {
            background: '#EF4444',
            color: '#fff',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#EF4444',
          },
        },
        loading: {
          style: {
            background: '#3B82F6',
            color: '#fff',
          },
        },
      }
    );
  }
}

export default ToastInterceptor;