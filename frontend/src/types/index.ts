export type UserRole = 'ALUMNO' | 'DOCENTE' | 'ADMINISTRADOR' | 'EXTERNO';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  nombre: string;
  apellido: string;
  matricula_o_nomina: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AcademicLoad {
  id: number;
  student_id: number;
  docente_id: number;
  materia: string;
  periodo: string;
  calificacion_final: number | null;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: number;
  nombre: string;
  rfc: string;
  direccion: string | null;
  sector: string | null;
  contacto_nombre: string | null;
  contacto_email: string | null;
  contacto_telefono: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ProjectStatus = 'ACTIVO' | 'COMPLETADO' | 'CANCELADO';

export interface DualProject {
  id: number;
  student_id: number;
  asesor_academico_id: number;
  mentor_empresarial_id: number;
  company_id: number;
  materia: string;
  periodo: string;
  status: ProjectStatus;
  descripcion: string | null;
  academic_load_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface Evaluation7030 {
  id: number;
  dual_project_id: number;
  student_id: number;
  nota_empresa: number | null;
  nota_docente: number | null;
  observaciones_empresa: string | null;
  observaciones_docente: string | null;
  sincronizado_core: boolean;
  final_grade_calculated: number | null;
  created_at: string;
  updated_at: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  role: UserRole;
  user_id: number;
}
