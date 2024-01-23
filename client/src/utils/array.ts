export class ImmutableArray {
  static push = <T>(array: T[], item: T): T[] => [...array, item];
  static remove = <T>(array: T[], filter: (it: T) => boolean) =>
    array.filter(filter);
}
