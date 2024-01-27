export class ImmutableArray {
  static push = <T>(array: T[], item: T): T[] => [...array, item];
  static remove = <T>(array: T[], filter: (it: T) => boolean) =>
    array.filter(filter);
  static pushUnique = <T>(array: T[], item: T, key: keyof T): T[] =>
    array.find((el) => el[key] === item[key])
      ? array
      : ImmutableArray.push(array, item);
}
