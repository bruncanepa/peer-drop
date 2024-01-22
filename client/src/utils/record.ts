export class ImmutableRecord {
  static add = (record: Record<string, any>, key: string, item: any) => ({
    ...record,
    [key]: item,
  });

  static remove = (record: Record<string, any>, key: string) => {
    const upd = { ...record };
    delete upd[key];
    return upd;
  };
}
