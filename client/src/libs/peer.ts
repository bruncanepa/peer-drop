export type Chunk = {
  // from PeerJS
  __peerData: number;
  n: number;
  total: number;
  data: ArrayBuffer;
};

export const PEERJS_CHUNK_SIZE = 16300; // taken from lib/dataconnection/BufferedConnection/binaryPackChunker.ts
