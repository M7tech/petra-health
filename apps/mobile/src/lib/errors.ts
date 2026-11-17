/** A readable message from anything thrown — falls back to a localised default. */
export function notifyError(e: unknown, fallback: string): string {
  return e instanceof Error && e.message ? e.message : fallback;
}
