import { router } from 'expo-router';

export interface SelectOption {
  value: string;
  label: string;
  subtitle?: string;
}

interface SelectRequest {
  title: string;
  options: SelectOption[];
  value: string | null;
  searchPlaceholder?: string;
  onSelect: (value: string) => void;
}

// A tiny hand-off between a form row and the /select sheet: the row stores the
// request, pushes the route, and the sheet reads it. Avoids serialising option
// lists (and callbacks) into route params.
let pending: SelectRequest | null = null;

export function openSelect(request: SelectRequest) {
  pending = request;
  router.push('/select');
}

export function takeSelectRequest(): SelectRequest | null {
  return pending;
}

export function clearSelectRequest() {
  pending = null;
}
