export class ImmutableArray {
  static push = <T>(array: T[], ...items: T[]): T[] => [...array, ...items];
  static unshift = <T>(array: T[], ...items: T[]): T[] => [...items, ...array];
  static remove = <T>(array: T[], filter: (it: T) => boolean) =>
    array.filter(filter);
  static pushUnique = <T>(array: T[], item: T, key: keyof T): T[] =>
    array.find((el) => el[key] === item[key])
      ? array
      : ImmutableArray.push(array, item);
  static unshiftUnique = <T>(array: T[], item: T, key: keyof T): T[] =>
    array.find((el) => el[key] === item[key])
      ? array
      : ImmutableArray.unshift(array, item);
  static update = <T>(array: T[], item: T, key: keyof T): T[] => {
    const indexToUpdate = array.findIndex((el) => el[key] === item[key]);
    return indexToUpdate >= 0
      ? [
          ...array.slice(0, indexToUpdate),
          item,
          ...array.slice(indexToUpdate + 1, array.length),
        ]
      : array;
  };
}
