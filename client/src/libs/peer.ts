import { Room } from "dto/room";

export enum PeerMessageType {
  FILES_LIST_REQ = "FILES_LIST_REQ",
  FILES_LIST_RES = "FILES_LIST_RES",
  FILES_DOWNLOAD_REQ = "FILES_DOWNLOAD_REQ",
  FILES_DOWNLOAD_RES = "FILES_DOWNLOAD_RES",
}

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
/**  END SHARE WITH BACKEND  */

export interface IData {}

export interface DataFile extends IData {
  blob: Blob;
  name: string;
  type: string;
  size: number;
}

export type DataFileListItem = Omit<DataFile, "blob">;

export interface DataFileList extends IData {
  items: DataFileListItem[];
}

export interface PeerMessage {
  type: PeerMessageType;
  data?: IData;
}

export type OnReceiveMessageFnType = (peerId: string, msg: PeerMessage) => any;
