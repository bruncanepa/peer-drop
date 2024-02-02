export type PeerMessageType =
  | "FILES_LIST_REQ"
  | "FILES_LIST_RES"
  | "FILES_TRANSFER_REQ"
  | "FILES_TRANSFER_RES"
  | "FILES_TRANSFER_PROGRESS"
  | "FILES_TRANSFER_END"
  | "SET_PEER_ALIAS"
  | "PEER_DROP";

export interface IData {}

export interface DataFile extends IData {
  blob: Blob;
  name: string;
  type: string;
  size: number;
  id: string;
}

export interface DataFileProgress extends IData {
  id: string;
  progress: number;
  total: number;
}

export interface DataFileListItem extends Omit<DataFile, "blob"> {
  selected?: boolean;
}

export interface DataFileList extends IData {
  items: DataFileListItem[];
}

export interface PeerMessage extends Record<string, any> {
  type: PeerMessageType;
  data?: IData;
}

export interface FilesDownloadReq extends PeerMessage {
  type: "FILES_TRANSFER_REQ";
  data: { files: string[] }; // file names
}

export type OnReceiveMessageFnType = (peerId: string, msg: PeerMessage) => any;

export interface PeerAliasReq extends IData {
  alias: string;
}

export type Chunk = {
  // from PeerJS
  __peerData: number;
  n: number;
  total: number;
  data: ArrayBuffer;
};

export const PEERJS_CHUNK_SIZE = 16300; // taken from lib/dataconnection/BufferedConnection/binaryPackChunker.ts
