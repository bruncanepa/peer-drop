import { ErrorMessage } from "./error";
import { CryptoLib } from "./lib/crypto";

export type Room = {
  id: string;
  ownerId: string;
  date: Date;
  expires: Date;
  pendingDownloads: number;
  receipt: string;
};

export type RoomShared = Omit<Room, "receipt" | "pendingDownloads">;

export class RoomManager {
  private rooms: Map<string, Room>;
  constructor() {
    this.rooms = new Map();
  }

  add = (ownerId: string, downloadTimes = 1): Room => {
    const date = new Date();
    const expires = new Date(date);
    expires.setDate(date.getDate() + 1); // expires in 1 day

    const session: Room = {
      id: CryptoLib.random(24),
      ownerId,
      date,
      expires,
      pendingDownloads: downloadTimes,
      receipt: CryptoLib.random(50),
    };

    this.rooms.set(session.id, session);

    return session;
  };

  get = (sessionId: string): RoomShared => {
    const session = this.getThrow(sessionId);
    return this.roomToRoomShared(session);
  };

  downloaded = (sessionId: string, receipt: string): Room => {
    const session = this.getThrow(sessionId);
    if (session.receipt === receipt) {
      session.pendingDownloads -= 1;
      if (session.pendingDownloads === 0) this.rooms.delete(sessionId);
      return session;
    }
    console.log(
      `file ${sessionId} found but invalid receipt. is ${session.receipt}, got ${receipt}`
    );
    throw Error(ErrorMessage.NOT_FOUND.key);
  };

  private getThrow = (sessionId: string): Room => {
    const session = this.rooms.get(sessionId);
    if (session) return session;
    throw Error(ErrorMessage.NOT_FOUND.key);
  };

  private roomToRoomShared = (session: Room): RoomShared => {
    const shared: RoomShared = {
      date: new Date(session.date),
      expires: new Date(session.expires),
      id: session.id,
      ownerId: session.ownerId,
    };
    return shared;
  };
}
