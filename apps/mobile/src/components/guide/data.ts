import type { ImageSourcePropType } from 'react-native';

// Injection steps grouped the way the illustrated guide flows (1–18).
export const STEP_GROUPS: { title: string; steps: number[] }[] = [
  { title: 'grp1', steps: [1, 2] },
  { title: 'grp2', steps: [3, 4, 5, 6] },
  { title: 'grp3', steps: [7, 8, 9] },
  { title: 'grp4', steps: [10, 11] },
  { title: 'grp5', steps: [12, 13, 14, 15] },
  { title: 'grp6', steps: [16, 17, 18] },
];

export const STEP_COUNT = 18;
export const groupOfStep = (n: number) => STEP_GROUPS.find((g) => g.steps.includes(n))?.title ?? '';

// The real photo for each step, cropped from the official illustrated guide.
export const STEP_IMAGES: Record<number, ImageSourcePropType> = {
  1: require('../../../assets/guide/steps/step-1.jpg'),
  2: require('../../../assets/guide/steps/step-2.jpg'),
  3: require('../../../assets/guide/steps/step-3.jpg'),
  4: require('../../../assets/guide/steps/step-4.jpg'),
  5: require('../../../assets/guide/steps/step-5.jpg'),
  6: require('../../../assets/guide/steps/step-6.jpg'),
  7: require('../../../assets/guide/steps/step-7.png'),
  8: require('../../../assets/guide/steps/step-8.png'),
  9: require('../../../assets/guide/steps/step-9.jpg'),
  10: require('../../../assets/guide/steps/step-10.png'),
  11: require('../../../assets/guide/steps/step-11.png'),
  12: require('../../../assets/guide/steps/step-12.png'),
  13: require('../../../assets/guide/steps/step-13.png'),
  14: require('../../../assets/guide/steps/step-14.png'),
  15: require('../../../assets/guide/steps/step-15.png'),
  16: require('../../../assets/guide/steps/step-16.png'),
  17: require('../../../assets/guide/steps/step-17.png'),
  18: require('../../../assets/guide/steps/step-18.png'),
};
