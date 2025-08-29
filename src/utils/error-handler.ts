/**
 * Classe genérica para mapear e tratar mensagens de erro
 * Retorna mensagens amigáveis para o usuário
 */
export class ErrorHandler {
  /**
   * Mapeia erros conhecidos para mensagens amigáveis
   */
  private static errorMappings: Record<string, string> = {
    // Padrões específicos devem vir primeiro (mais prioritários)
    '\"exists\":false': 'Este número de telefone não possui WhatsApp ativo.',
    'exists":false': 'Este número de telefone não possui WhatsApp ativo.',
    // Padrões genéricos vêm depois
    'Bad Request': 'Solicitação inválida. Verifique os dados informados.',
    'Unauthorized': 'Acesso não autorizado. Verifique suas credenciais.',
    'Forbidden': 'Acesso negado. Você não tem permissão para esta operação.',
    'Not Found': 'Recurso não encontrado.',
    'Internal Server Error': 'Erro interno do servidor.',
    'Service Unavailable': 'Serviço temporariamente indisponível.',
    'Timeout': 'Tempo limite excedido.',
    'Network Error': 'Erro de conexão.',
    'Evolution API error': 'Erro na API do WhatsApp. Verifique a configuração da integração.'
  };

  /**
   * Processa uma mensagem de erro e retorna uma versão amigável
   * @param error - Erro original (string, Error object, ou response de API)
   * @returns Mensagem de erro amigável
   */
  static handleError(error: any): string {
    try {
      let errorMessage: string;

      // Converter para string se necessário
      if (typeof error === 'string') {
        errorMessage = error;
      }
      // Se for um objeto Error
      else if (error instanceof Error) {
        errorMessage = error.message;
      }
      // Se for um objeto de resposta de API
      else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      // Se for um objeto com propriedade message
      else if (error?.message) {
        errorMessage = error.message;
      }
      // Fallback para JSON.stringify
      else {
        errorMessage = JSON.stringify(error);
      }

      // Verificação prioritária para erros de WhatsApp inativo usando regex
      const whatsappPatterns = [
        /\\*"exists\\*"\s*:\s*false/,
        /exists\\*"\s*:\s*false/,
        /"exists"\s*:\s*false/,
        /exists"\s*:\s*false/
      ];
      
      for (const pattern of whatsappPatterns) {
        if (pattern.test(errorMessage)) {
          return 'Telefone não possui WhatsApp ativo.';
        }
      }

      // Procura por outros padrões conhecidos
      for (const [pattern, friendlyMessage] of Object.entries(this.errorMappings)) {
        if (pattern.includes('exists')) continue; // Pular padrões de exists já verificados acima
        if (errorMessage.includes(pattern)) {
          return friendlyMessage;
        }
      }

      // Se não encontrou um padrão conhecido, tenta extrair uma mensagem mais limpa
      const cleanMessage = this.extractCleanMessage(errorMessage);
      return cleanMessage || 'Ocorreu um erro inesperado.';

    } catch (e) {
      return 'Ocorreu um erro inesperado.';
    }
  }

  /**
   * Extrai uma mensagem mais limpa de erros complexos
   * @param errorMessage - Mensagem de erro original
   * @returns Mensagem limpa ou null
   */
  private static extractCleanMessage(errorMessage: string): string | null {
    try {
      // Tenta extrair mensagem de JSON aninhado
      const jsonMatch = errorMessage.match(/\{.*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.message) {
          return parsed.message;
        }
        if (parsed.error) {
          return parsed.error;
        }
      }

      // Remove códigos de status HTTP do início
      const cleanedMessage = errorMessage.replace(/^\d{3}\s*-\s*/, '');

      // Se a mensagem ainda é muito técnica, retorna null
      if (cleanedMessage.includes('Evolution API error') ||
        cleanedMessage.includes('Bad Request') ||
        cleanedMessage.length > 200) {
        return null;
      }

      return cleanedMessage;
    } catch (e) {
      return null;
    }
  }

  /**
   * Adiciona um novo mapeamento de erro
   * @param pattern - Padrão a ser procurado na mensagem de erro
   * @param friendlyMessage - Mensagem amigável correspondente
   */
  static addErrorMapping(pattern: string, friendlyMessage: string): void {
    this.errorMappings[pattern] = friendlyMessage;
  }

  /**
   * Verifica se um erro é relacionado ao WhatsApp
   * @param error - Erro a ser verificado
   * @returns true se for erro do WhatsApp
   */
  static isWhatsAppError(error: any): boolean {
    const errorMessage = typeof error === 'string' ? error : JSON.stringify(error);
    return errorMessage.includes('Evolution API') ||
      errorMessage.includes('whatsapp') ||
      errorMessage.includes('"exists":false');
  }

  /**
   * Verifica se um número de telefone não tem WhatsApp
   * @param error - Erro a ser verificado
   * @returns true se o número não tem WhatsApp
   */
  static isPhoneWithoutWhatsApp(error: any): boolean {
    const errorMessage = typeof error === 'string' ? error : JSON.stringify(error);
    return errorMessage.includes('"exists":false');
  }
}

/**
 * Função utilitária para uso rápido
 * @param error - Erro a ser tratado
 * @returns Mensagem de erro amigável
 */
export const handleError = (error: any): string => {
  return ErrorHandler.handleError(error);
};

/**
 * Função específica para erros de API
 * @param error - Erro de resposta da API
 * @returns Mensagem de erro amigável
 */
export const handleApiError = (error: any): string => {
  // Se for erro de rede
  if (!error.response) {
    return 'Erro de conexão.';
  }

  // Se for erro HTTP específico
  const status = error.response?.status;
  switch (status) {
    case 400:
      return ErrorHandler.handleError(error.response.data);
    case 401:
      return 'Sessão expirada. Faça login novamente.';
    case 403:
      return 'Acesso negado. Você não tem permissão para esta operação.';
    case 404:
      return 'Recurso não encontrado.';
    case 500:
      return ErrorHandler.handleError(error.response.data);
    default:
      return ErrorHandler.handleError(error);
  }
};