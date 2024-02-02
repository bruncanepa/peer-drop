export const random = (min: number, max: number) =>
  Math.round(Math.random() * Math.abs(max - min) + min);
