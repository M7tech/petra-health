// Self-contained copy of the API contract (mobile is outside the TS workspace,
// so it doesn't import @petra/shared directly to keep Metro bundling simple).
export type Gender = 'MALE' | 'FEMALE' | 'UNSPECIFIED';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  birthDate: string | null;
  gender: Gender | null;
  heightCm: number | null;
  chronicConditions: string[];
  otherConditions: string | null;
  countryId: string | null;
  cityId: string | null;
  doctorId: string | null;
}

export type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obese';

export interface PatientProfile extends AuthUser {
  latestWeightKg: number | null;
  bmi: number | null;
  bmiCategory: BmiCategory | null;
  age: number | null;
}

export const CHRONIC_CONDITIONS = [
  'diabetes',
  'hypertension',
  'heart_disease',
  'asthma',
  'thyroid',
  'kidney_disease',
] as const;

export type TreatmentStatus = 'ONGOING' | 'COMPLETED' | 'DISCONTINUED';
export type AdverseSeverity = 'MILD' | 'MODERATE' | 'SEVERE';
export const SEVERITIES: AdverseSeverity[] = ['MILD', 'MODERATE', 'SEVERE'];

export interface AdverseEvent {
  id: string;
  description: string;
  severity: AdverseSeverity;
  onsetDate: string;
  createdAt: string;
}
export interface PatientComment {
  id: string;
  body: string;
  doctorName: string | null;
  createdAt: string;
}
export interface ClinicalAssessment {
  treatmentStatus: TreatmentStatus;
  discontinuationReason: string | null;
  physicianComments: string | null;
}

export interface UserLoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface Country {
  id: string;
  name: string;
  isoCode: string;
}
export interface City {
  id: string;
  name: string;
  countryId: string;
}
export interface Doctor {
  id: string;
  fullName: string;
  specialty: string | null;
  cityId: string;
  countryId: string;
}

export interface TitrationWeek {
  id: string;
  weekNumber: number;
  doseMg: number;
}
export interface Pen {
  id: string;
  label: string;
  sequence: number;
  volumeMl: number | null;
  weeks: TitrationWeek[];
}
export interface Medication {
  id: string;
  name: string;
  genericName: string | null;
  manufacturer: string | null;
  isTitrated: boolean;
  pens: Pen[];
}
export interface UserMedication {
  id: string;
  name: string;
  startDate: string;
  active: boolean;
}
export interface DoseLog {
  id: string;
  userMedicationId: string;
  scheduledFor: string;
  takenAt: string;
  doseMg: number | null;
}
export interface WeightEntry {
  id: string;
  weightKg: number;
  recordedAt: string;
  note: string | null;
}
