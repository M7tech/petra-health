// Shared contract between api, web, and mobile.
// Kept framework-free so all three tiers can import it.

export type AdminRole = 'SUPERADMIN' | 'EDITOR';

// ---- Auth ----
export interface AuthTokens {
  accessToken: string;
}

export type Gender = 'MALE' | 'FEMALE' | 'UNSPECIFIED';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  birthDate: string | null; // ISO date
  gender: Gender | null;
  heightCm: number | null;
  chronicConditions: string[];
  otherConditions: string | null;
  countryId: string | null;
  cityId: string | null;
  doctorId: string | null;
}

// Canonical chronic-condition keys (labels are localized in the client).
export const CHRONIC_CONDITIONS = [
  'diabetes',
  'hypertension',
  'heart_disease',
  'asthma',
  'thyroid',
  'kidney_disease',
] as const;
export type ChronicCondition = (typeof CHRONIC_CONDITIONS)[number];

// BMI = kg / m^2. Returns null if inputs missing/invalid.
export function computeBmi(weightKg?: number | null, heightCm?: number | null): number | null {
  if (!weightKg || !heightCm || heightCm <= 0) return null;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

export type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obese';
export function bmiCategory(bmi: number | null): BmiCategory | null {
  if (bmi == null) return null;
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
}

export interface AuthAdmin {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface SignupDto {
  email: string;
  password: string;
  fullName: string;
}

export interface UserLoginResponse extends AuthTokens {
  user: AuthUser;
}

export interface AdminLoginResponse extends AuthTokens {
  admin: AuthAdmin;
}

// ---- Directory ----
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
  phone: string | null;
  cityId: string;
  countryId: string;
}

export interface UpsertCountryDto {
  name: string;
  isoCode: string;
}

export interface UpsertCityDto {
  name: string;
  countryId: string;
}

export interface UpsertDoctorDto {
  fullName: string;
  specialty?: string;
  phone?: string;
  cityId: string;
  countryId: string;
}

// ---- Profile ----
export interface UpdateProfileDto {
  fullName?: string;
  phone?: string;
  birthDate?: string; // ISO date
  gender?: Gender;
  heightCm?: number;
  chronicConditions?: string[];
  otherConditions?: string;
  countryId?: string;
  cityId?: string;
  doctorId?: string;
  // When present, also records a weight entry (used for BMI).
  currentWeightKg?: number;
}

// Full profile with derived health metrics.
export interface PatientProfile extends AuthUser {
  latestWeightKg: number | null;
  bmi: number | null;
  bmiCategory: BmiCategory | null;
  age: number | null;
}

// ---- Medication / titration ----
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
  pens?: Pen[];
}

export interface CreateUserMedicationDto {
  medicationId?: string;
  name: string;
  dosage?: string;
  frequency?: string;
  timeOfDay?: string; // "HH:mm"
  startDate?: string; // ISO
}

export interface LogDoseDto {
  userMedicationId: string;
  scheduledFor: string; // ISO
  doseMg?: number;
  note?: string;
}

// ---- Weight ----
export interface WeightEntry {
  id: string;
  weightKg: number;
  recordedAt: string;
  note: string | null;
}

export interface CreateWeightEntryDto {
  weightKg: number;
  recordedAt?: string; // ISO
  note?: string;
}

// ---- Admin analytics ----
export interface RegionCount {
  label: string; // e.g. "Erbil, Iraq"
  count: number;
}

export interface AdminStats {
  totalPatients: number;
  totalDoctors: number;
  totalCountries: number;
  totalCities: number;
  totalMedicationsEnrolled: number;
  totalDosesLogged: number;
  totalWeightEntries: number;
  patientsByCity: RegionCount[];
  doctorsByCity: RegionCount[];
  recentPatients: { id: string; fullName: string; email: string; createdAt: string }[];
}

export interface PatientSummary {
  id: string;
  fullName: string;
  email: string;
  countryName: string | null;
  cityName: string | null;
  doctorName: string | null;
  medicationCount: number;
  doseCount: number;
  createdAt: string;
}

export interface PatientDetail extends PatientSummary {
  medications: {
    id: string;
    name: string;
    dosage: string | null;
    frequency: string | null;
    startDate: string;
    active: boolean;
    doseCount: number;
  }[];
  recentDoses: { id: string; medicationName: string; scheduledFor: string; takenAt: string; doseMg: number | null }[];
  weightEntries: WeightEntry[];
}
