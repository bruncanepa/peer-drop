import Peer, { DataConnection } from "peerjs";
import { CryptoLib } from "./crypto";
import { Logger } from "utils/logger";

export enum PeerMessageType {
  FILES_LIST_REQ = "FILES_LIST_REQ",
  FILES_LIST_RES = "FILES_LIST_RES",
  FILES_DOWNLOAD_REQ = "FILES_DOWNLOAD_REQ",
  FILES_DOWNLOAD_RES = "FILES_DOWNLOAD_RES",
}

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

type NotifyFn = (peers: string[]) => any;
export type OnReceiveMessageFnType = (peerId: string, msg: PeerMessage) => any;

export class PeerConnection {
  private peer: Peer;
  // "We recommend keeping track of connections..." https://peerjs.com/docs/#peerconnections
  private connections: Map<string, DataConnection>;
  private notify: NotifyFn;

  constructor(watchConnections: NotifyFn) {
    this.peer = this.initPeer();
    this.connections = new Map<string, DataConnection>();
    this.notify = watchConnections;
  }

  initPeer = () =>
    new Peer(this.genId(), {
      host: "127.0.0.1",
      port: 8081,
      path: "/sockets",
      debug: 3,
      secure: false,
    });

  getPeer = () => this.peer;

  getId = () => this.peer.id;

  getConnections = () => this.connections;

  startSession = (onReceiveData: OnReceiveMessageFnType) =>
    new Promise<string>((resolve, reject) => {
      this.peer
        .on("open", (id: string) => {
          Logger.info(`connection open ${id}`);
          resolve(id);
        })
        .on("connection", (conn: DataConnection) => {
          const connId = conn.peer;
          Logger.info("Incoming connection:", connId);
          this.connections.set(connId, conn);
          this.notify(Array.from(this.connections.keys()));
          this.listenToPeerEvents(connId, conn, onReceiveData);
        })
        .on("error", (err: Error) => {
          Logger.error("startPeerSession-error:", err);
          // alert(`Error: ${err.message}`); // TODO
          reject(err);
        });
    });

  connectToNewPeer = (peerId: string, onReceiveData: OnReceiveMessageFnType) =>
    new Promise<void>((resolve, reject) => {
      if (this.connections.has(peerId)) {
        return reject(new Error("Connection existed"));
      }
      const conn = this.peer.connect(peerId, { reliable: true });
      if (!conn) return reject(new Error("Connection can't be established"));
      this.listenToPeerEvents(peerId, conn, onReceiveData);
    });

  sendMessageToConnection = (id: string, data: PeerMessage): Promise<void> =>
    new Promise((resolve, reject) => {
      if (!this.connections.has(id)) {
        reject(new Error("Connection didn't exist"));
      }
      try {
        const conn = this.connections.get(id);
        if (conn) conn.send(data);
        resolve();
      } catch (err) {
        Logger.error("sendConnection", err);
        reject(err);
      }
    });

  private listenToPeerEvents = (
    peerId: string,
    conn: DataConnection,
    onReceiveData: OnReceiveMessageFnType
  ) =>
    conn
      .on("open", () => {
        Logger.info("Connect to: " + peerId);
        this.connections.set(peerId, conn);
        this.notify(Array.from(this.connections.keys()));
      })
      .on("data", (receivedData: any) => {
        Logger.info("Receiving data from " + peerId);
        onReceiveData(peerId, receivedData as PeerMessage);
      })
      .on("close", () => {
        Logger.info("Connection closed: " + peerId);
        this.connections.delete(peerId);
        this.notify(Object.keys(this.connections));
      })
      .on("error", (err: Error) => {
        Logger.error("connectPeer-error", err);
      });

  private genId = () => `${CryptoLib.uuid(true)}-${CryptoLib.random(8)}`;
}
