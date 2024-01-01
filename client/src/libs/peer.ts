import Peer, { DataConnection } from "peerjs";
import { log } from "../utils/logger";

export enum DataType {
  FILE = "FILE",
  OTHER = "OTHER",
}

export interface Data {
  dataType: DataType;
  file?: Blob;
  fileName?: string;
  fileType?: string;
  message?: string;
}

export class PeerConnection {
  private peer: Peer;
  private connections: Map<string, DataConnection>;

  constructor() {
    this.peer = new Peer();
    this.connections = new Map<string, DataConnection>();
  }

  getPeer = () => this.peer;

  getId = () => this.peer.id;

  startPeerSession = () =>
    new Promise<string>((resolve, reject) => {
      try {
        this.peer
          .on("open", (id: string) => {
            log("connection open");
            resolve(id);
          })
          .on("error", (err: Error) => {
            log(err);
            alert(`Error: ${err.message}`); // TODO
          });
      } catch (err) {
        log(err);
        reject(err);
      }
    });

  closePeerSession = () =>
    new Promise<void>((resolve, reject) => {
      try {
        if (this.peer) {
          this.peer.destroy();
          this.peer = new Peer();
        }
        resolve();
      } catch (err) {
        log(err);
        reject(err);
      }
    });

  connectPeer = (id: string) =>
    new Promise<void>((resolve, reject) => {
      if (!this.peer) {
        reject(new Error("Peer doesn't start yet"));
        return;
      }
      if (this.connections.has(id)) {
        reject(new Error("Connection existed"));
        return;
      }
      try {
        const conn = this.peer.connect(id, { reliable: true });
        if (!conn) return reject(new Error("Connection can't be established"));
        conn
          .on("open", () => {
            log("Connect to: " + id);
            this.connections.set(id, conn);
            resolve();
          })
          .on("error", (err: Error) => {
            log(err);
            reject(err);
          });
      } catch (err) {
        reject(err);
      }
    });

  onIncomingConnection = (callback: (conn: DataConnection) => void) => {
    this.peer.on("connection", (conn: DataConnection) => {
      log("Incoming connection: " + conn.peer);
      this.connections.set(conn.peer, conn);
      callback(conn);
    });
  };

  onConnectionDisconnected = (id: string, callback: () => void) => {
    if (!this.peer) {
      throw new Error("Peer doesn't start yet");
    }
    if (!this.connections.has(id)) {
      throw new Error("Connection didn't exist");
    }
    const conn = this.connections.get(id);
    if (conn) {
      conn.on("close", () => {
        log("Connection closed: " + id);
        this.connections.delete(id);
        callback();
      });
    }
  };

  sendConnection = (id: string, data: Data): Promise<void> =>
    new Promise((resolve, reject) => {
      if (!this.connections.has(id)) {
        reject(new Error("Connection didn't exist"));
      }
      try {
        const conn = this.connections.get(id);
        if (conn) {
          conn.send(data);
        }
      } catch (err) {
        reject(err);
      }
      resolve();
    });

  onConnectionReceiveData = (id: string, callback: (f: Data) => void) => {
    if (!this.peer) {
      throw new Error("Peer doesn't start yet");
    }
    if (!this.connections.has(id)) {
      throw new Error("Connection didn't exist");
    }
    const conn = this.connections.get(id);
    if (conn) {
      conn.on("data", (receivedData: any) => {
        log("Receiving data from " + id);
        callback(receivedData as Data);
      });
    }
  };
}
