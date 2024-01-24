import { ErrorMessage } from "./error";
import { CryptoLib } from "./lib/crypto";

export type Room = {
  id: string;
  ownerId: string;
};

export class RoomManager {
  private rooms: Map<string, Room>;
  constructor() {
    this.rooms = new Map();
  }

  add = (ownerId: string): Room => {
    const room: Room = { id: CryptoLib.random(24), ownerId };
    this.rooms.set(room.id, room);
    return room;
  };

  get = (roomId: string): Room | undefined => {
    return this.rooms.get(roomId);
  };
}
