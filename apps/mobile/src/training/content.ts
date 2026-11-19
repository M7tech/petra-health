import type { IconName } from '@/components/ui';

export type ModuleKey = 'dose' | 'sites' | 'inject' | 'missed' | 'storage';
export const MODULE_KEYS: ModuleKey[] = ['dose', 'sites', 'inject', 'missed', 'storage'];

export type ReviewStatus = 'pending-medical-review' | 'reviewed';

export interface ModuleMeta {
  key: ModuleKey;
  icon: IconName;
  /** Route inside app/training. */
  href: '/training/dose' | '/training/sites' | '/training/inject' | '/training/missed' | '/training/storage';
  /** Quiz question ids (strings live under train.q.<id>). */
  quiz: { id: string; /** Display order of the original options a/b/c (the correct answer is always original option "a"). */ order: [number, number, number] }[];
  /** Where each medical fact comes from — official Semetra patient guide page numbers. */
  sources: string[];
  /** Nothing is "reviewed" until a clinician signs it off — see docs/training/MEDICAL_REVIEW.md. */
  review: ReviewStatus;
}

export const MODULES: Record<ModuleKey, ModuleMeta> = {
  dose: {
    key: 'dose',
    icon: 'calendar',
    href: '/training/dose',
    quiz: [
      { id: 'dose1', order: [1, 0, 2] },
      { id: 'dose2', order: [2, 1, 0] },
    ],
    sources: ['Guide p.2 (pens, 1.34 mg/ml)', 'Guide p.4 (first 8 weeks, after week 8)', 'Guide p.12 (once weekly)'],
    review: 'pending-medical-review',
  },
  sites: {
    key: 'sites',
    icon: 'pin',
    href: '/training/sites',
    quiz: [
      { id: 'sites1', order: [2, 0, 1] },
      { id: 'sites2', order: [1, 2, 0] },
    ],
    sources: ['Guide p.6 (recommended sites, rotate within the same area)', 'Box: "For subcutaneous use only"'],
    review: 'pending-medical-review',
  },
  inject: {
    key: 'inject',
    icon: 'syringe',
    href: '/training/inject',
    quiz: [
      { id: 'inject1', order: [1, 2, 0] },
      { id: 'inject2', order: [2, 0, 1] },
    ],
    sources: ['Guide p.8 (steps 1–11)', 'Guide p.9 (steps 12–18, count slowly to 6)'],
    review: 'pending-medical-review',
  },
  missed: {
    key: 'missed',
    icon: 'alert',
    href: '/training/missed',
    quiz: [
      { id: 'missed1', order: [0, 2, 1] },
      { id: 'missed2', order: [2, 0, 1] },
    ],
    sources: ['Guide p.14 (5 days or fewer: take it; more than 5: skip; never double)'],
    review: 'pending-medical-review',
  },
  storage: {
    key: 'storage',
    icon: 'snowflake',
    href: '/training/storage',
    quiz: [
      { id: 'storage1', order: [1, 0, 2] },
      { id: 'storage2', order: [0, 2, 1] },
    ],
    sources: ['Guide p.16 (before opening 2–8 °C; in use up to 8 weeks below 30 °C or 2–8 °C; do not freeze; expiry; children)'],
    review: 'pending-medical-review',
  },
};

// Injection chapters → the guide's step numbers (guide p.8–9).
export const CHAPTERS: { key: 'chA' | 'chB' | 'chC' | 'chD' | 'chE'; steps: number[] }[] = [
  { key: 'chA', steps: [1, 2, 3, 4, 5, 6] },
  { key: 'chB', steps: [7, 8, 9] },
  { key: 'chC', steps: [10, 11] },
  { key: 'chD', steps: [12, 13, 14, 15] },
  { key: 'chE', steps: [16, 17, 18] },
];
