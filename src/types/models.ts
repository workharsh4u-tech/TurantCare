export interface Hospital {
  id: string;
  name: string;
  address?: string;
  created_at: string;
  admin_user_id: string;
}

export interface Doctor {
  id: string;
  name: string;
  email: string;
  specialization?: string;
  doctor_code?: string;
  hospital_id: string;
}

export interface ReportFile {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  report_type?: string;
  uploaded_by_role?: string;
  date_group: string;
  is_private?: boolean;
  storage_path?: string;
  file_size_bytes?: number;
  notes?: string;
}

export interface Visit {
  id: string;
  patient_id: string;
  doctor_id: string;
  diagnosis: string;
  medicines: string[];
  notes?: string;
  follow_up?: string;
  created_at: string;
}

export interface AISummary {
  id?: string;
  patient_id: string;
  date_group: string;
  summary_text: string;
}
