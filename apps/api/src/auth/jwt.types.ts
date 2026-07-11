import { AdminRole } from '@petra/shared';

export type PrincipalType = 'user' | 'admin' | 'doctor';

export interface JwtPayload {
  sub: string;
  email: string;
  type: PrincipalType;
  role?: AdminRole; // only for admins
}

// Attached to req.user by the JWT strategy.
export interface Principal {
  id: string;
  email: string;
  type: PrincipalType;
  role?: AdminRole;
}
