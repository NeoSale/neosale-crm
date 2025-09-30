// Interface para resposta do endpoint de parâmetros

export interface Parametro {
  id: string;
  chave: string;
  valor: string;
  embedding: any;
  created_at: string;
  updated_at: string;
}

export interface ParametroResponse {
  success: boolean;
  data: Parametro;
  message?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}