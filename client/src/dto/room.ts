export type Room = {
  id: string;
  ownerId: string;
  date: Date;
  expires: Date;
  pendingDownloads: number;
  receipt: string;
};

export type RoomShared = Omit<Room, "receipt" | "pendingDownloads">;
