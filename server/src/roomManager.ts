import { ErrorMessage } from "./error";
import { CryptoLib } from "./lib/crypto";

export type Room = {
  id: string;
  ownerId: string;
};

export class RoomManager {
  private rooms: Record<string, Room>;
  constructor() {
    this.rooms = {};
  }

  add = (ownerId: string): Room => {
    const room: Room = { id: CryptoLib.random(24), ownerId };
    this.rooms[room.id] = room;
    return room;
  };

  get = (roomId: string): Room | undefined => {
    return this.rooms[roomId];
  };

  delete = (ownerId: string): number => {
    let count = 0;
    Object.keys(this.rooms).forEach((roomId) => {
      const room = this.rooms[roomId];
      if (room.ownerId === ownerId) {
        delete this.rooms[roomId];
        count++;
      }
    });
    return count;
  };
}
