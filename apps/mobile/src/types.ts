// Self-contained copy of the API contract (mobile is outside the TS workspace,
// so it doesn't import @petra/shared directly to keep Metro bundling simple).
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  countryId: string | null;
  cityId: string | null;
  doctorId: string | null;
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
