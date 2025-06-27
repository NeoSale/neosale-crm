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

  static handleSuccess(message?: string, config?: ToastConfig) {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    if (finalConfig.showSuccess) {
      const successMessage = message || finalConfig.successMessage || 'Operação realizada com sucesso!';
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
    }
  }

  static handleError(message?: string, config?: ToastConfig) {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    if (finalConfig.showError) {
      const errorMessage = message || finalConfig.errorMessage || 'Ocorreu um erro. Tente novamente.';
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