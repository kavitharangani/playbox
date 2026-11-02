export const num = (n) => Number(n).toLocaleString('en-US');

export function placeText(place) {
  const rem = place % 100;
  const suffix = rem >= 11 && rem <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][place % 10] || 'th';
  return `${place}${suffix}`;
}

export const placeClass = (place) => `place-${place <= 3 ? place : 'n'}`;
