/**
 * Utilitários para formatação de data e hora
 */

/**
 * Formata uma string de data/hora para exibir apenas a hora no formato HH:MM
 * @param dateString - String de data no formato ISO ou similar
 * @returns String formatada no formato HH:MM ou '--:--' se inválida
 */
export const formatTime = (dateString: string | null): string => {
  if (!dateString) return '--:--';

  try {
    const [hours, minutes] = dateString.split('T')[1].split(':');
    return `${hours}:${minutes}`;
  } catch (error) {
    console.error('Erro ao formatar hora:', error, dateString);
    return '--:--';
  }
};

/**
 * Formata uma string de data para exibição completa com data e hora
 * @param dateString - String de data no formato ISO ou similar
 * @returns Objeto com data formatada (DD/MM/YYYY) e hora (HH:MM)
 */
export const formatDateTime = (dateString: string | null, includeSeconds: boolean = false): { date: string; time: string } => {
  if (!dateString) {
    return { date: '--/--/----', time: includeSeconds ? '--:--:--' : '--:--' };
  }

  try {
    const date = new Date(dateString);
    
    // Formatação da data
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    // Formatação da hora
    const timeParts = dateString.split('T')[1].split(':');
    const hours = timeParts[0];
    const minutes = timeParts[1];
    const seconds = timeParts[2] ? timeParts[2].split('.')[0] : '00'; // Remove milissegundos se existirem
    
    const timeString = includeSeconds ? `${hours}:${minutes}:${seconds}` : `${hours}:${minutes}`;
    
    return {
      date: `${day}/${month}/${year}`,
      time: timeString
    };
  } catch (error) {
    console.error('Erro ao formatar data/hora:', error, dateString);
    return { date: '--/--/----', time: includeSeconds ? '--:--:--' : '--:--' };
  }
};

/**
 * Formata uma string de data para exibição apenas da data
 * @param dateString - String de data no formato ISO ou similar
 * @returns String formatada no formato DD/MM/YYYY ou '--/--/----' se inválida
 */
export const formatDate = (dateString: string | null): string => {
  if (!dateString) return '--/--/----';

  try {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Erro ao formatar data:', error, dateString);
    return '--/--/----';
  }
};