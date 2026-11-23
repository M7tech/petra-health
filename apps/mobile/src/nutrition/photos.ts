
// Optional real food photos. A key with no entry simply shows the 3D illustration instead, so the guide always works.
// To add a photo: put the file in assets/nutrition/photos/ and register it below, e.g.
//   plate: require('../../assets/nutrition/photos/plate.jpg'),
// Keys: plate, foods, daily, comfort, and one per meal as `<day>-<meal>` (d1-b, d1-l, d1-s, d1-d ... d7-d).
export const PHOTOS: Partial<Record<string, number>> = {};
