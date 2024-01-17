export type FileSession = {
  id: string;
  ownerId: string;
  date: Date;
  expires: Date;
  pendingDownloads: number;
  receipt: string;
};

export type FileSessionShared = Omit<
  FileSession,
  "receipt" | "pendingDownloads"
>;
