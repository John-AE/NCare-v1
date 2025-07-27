export interface Appointment {
  id: string;
  patient_id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  patients: {
    first_name: string;
    last_name: string;
  };
}

export interface Service {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
}

export interface Prescription {
  serviceId: string;
  quantity: number;
  instructions: string;
}

export interface CustomPrescription {
  id: string;
  medicine: string;
  dosage: string;
  frequency: string;
  otherDetails: string;
  price: number;
}

export interface VisitData {
  complaints: string;
  diagnosis: string;
  treatment_plan: string;
  prescriptions?: string;
}

export interface NewService {
  name: string;
  description: string;
  price: number;
  category: string;
}