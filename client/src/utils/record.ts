export class ImmutableRecord {
  static add = <T>(
    record: Record<string, T>,
    key: string,
    item: T
  ): typeof record => ({
    ...record,
    [key]: item,
  });

  static addMany = <T>(
    record: Record<string, T>,
    ...items: { key: string; updatedItem: T }[]
  ): typeof record => ({
    ...record,
    ...items.reduce((rec, it) => {
      rec[it.key] = it.updatedItem;
      return rec;
    }, {} as typeof record),
  });

  static remove = <T>(
    record: Record<string, T>,
    key: string
  ): typeof record => {
    const upd = { ...record };
    delete upd[key];
    return upd;
  };

  static update = <T>(
    record: Record<string, T>,
    key: string,
    updatedItem: T
  ): typeof record => ({ ...record, [key]: updatedItem });

  static updateMany = <T>(
    record: Record<string, T>,
    ...items: { key: string; updatedItem: T }[]
  ): typeof record => ({
    ...record,
    ...items.reduce((rec, it) => {
      rec[it.key] = it.updatedItem;
      return rec;
    }, {} as typeof record),
  });
}
