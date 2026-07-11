import type { User } from '@prisma/client';
import type { AuthUser } from '@petra/shared';

export function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    birthDate: user.birthDate ? user.birthDate.toISOString() : null,
    gender: user.gender,
    heightCm: user.heightCm,
    chronicConditions: user.chronicConditions,
    otherConditions: user.otherConditions,
    countryId: user.countryId,
    cityId: user.cityId,
    doctorId: user.doctorId,
  };
}

export function computeAge(birthDate: Date | null): number | null {
  if (!birthDate) return null;
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const m = now.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) age -= 1;
  return age >= 0 && age < 150 ? age : null;
}
