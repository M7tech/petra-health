// Shared contract between api, web, and mobile.
// Kept framework-free so all three tiers can import it.

export type AdminRole = 'SUPERADMIN' | 'EDITOR';

// ---- Auth ----
export interface AuthTokens {
  accessToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  countryId: string | null;
  cityId: string | null;
  doctorId: string | null;
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
  countryId?: string;
  cityId?: string;
  doctorId?: string;
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
