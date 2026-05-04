export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  created_at: string;
}

export interface Personal {
  id: number;
  dni: string;
  nombres: string;
  apellidos: string;
  puesto?: string;
  rd?: string;
  uu?: string;
  activo: boolean;
  created_at: string;
}

export interface Ingreso {
  id?: number;
  planilla_id?: number;
  tipo: string;
  monto: number;
  comentario?: string;
}

export interface Descuento {
  id?: number;
  planilla_id?: number;
  tipo: string;
  monto: number;
  comentario?: string;
}

export interface Planilla {
  id: number;
  personal_id: number;
  personal?: Personal;
  mes: number;
  anio: number;
  total_haberes: number;
  total_descuentos: number;
  total_liquido: number;
  creado_por: number;
  creado_en: string;
  ingresos?: Ingreso[];
  descuentos?: Descuento[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: Usuario;
  csrf_token: string;
}

export interface CreatePersonalRequest {
  dni: string;
  nombres: string;
  apellidos: string;
  puesto?: string;
  rd?: string;
  uu?: string;
}

export interface UpdatePersonalRequest {
  dni: string;
  nombres: string;
  apellidos: string;
  puesto?: string;
  rd?: string;
  uu?: string;
  activo?: boolean;
}

export interface CreatePlanillaRequest {
  personal_id: number;
  mes: number;
  anio: number;
  ingresos: Ingreso[];
  descuentos: Descuento[];
}

export interface UpdatePlanillaRequest {
  ingresos: Ingreso[];
  descuentos: Descuento[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ErrorResponse {
  error: string;
  details?: string;
}

export interface PrefillResponse {
  message: string;
  planilla: Planilla;
  ingresos: Ingreso[];
  descuentos: Descuento[];
  total_haberes: number;
  total_descuentos: number;
}