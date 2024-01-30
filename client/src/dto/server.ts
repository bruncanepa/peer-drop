/**  BEGIN SHARE WITH BACKEND  */
export type ServerMessageType = "CREATE_ROOM" | "GET_ROOM";

export interface ISeverMessageDataReq {}
export interface ISeverMessageDataRes {}

export interface SeverMessageGeneric extends ISeverMessageDataReq {}

export interface SeverMessageDataCreateRoomReq extends ISeverMessageDataReq {
  userId: string;
}

export interface SeverMessageDataCreateRoomRes
  extends ISeverMessageDataRes,
    Room {}

export interface SeverMessageDataGetRoomReq extends ISeverMessageDataReq {
  roomId: string;
}

export interface SeverMessageDataGetRoomRes
  extends ISeverMessageDataRes,
    Room {}

export interface ServerMessage<T extends ISeverMessageDataReq> {
  type: ServerMessageType;
  data: T;
  error?: string;
}
export interface ServerMessageWrapped<T extends ISeverMessageDataReq> {
  type: string;
  payload: ServerMessage<T>;
}

export type Room = {
  id: string;
  ownerId: string;
};

/**  END SHARE WITH BACKEND  */
