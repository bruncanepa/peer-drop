import { CryptoLib } from "libs/crypto";
import { PeerMessage, PeerMessageType } from "libs/peer";
import Peer, { DataConnection } from "peerjs";
import { useState } from "react";
import { Logger } from "utils/logger";
import { ImmutableRecord } from "utils/record";

export type OnReceiveMessageFnType = (peerId: string, msg: PeerMessage) => any;

type PeerType = "SENDER" | "RECEIVER";

interface UsePeerProps {
  peerType: PeerType;
  onReceiveMessage: OnReceiveMessageFnType;
}

const isSender = (peerType: PeerType) => peerType === "SENDER";
const isInterestedInMessage = (peerType: PeerType, msgType: PeerMessageType) =>
  (isSender(peerType)
    ? [PeerMessageType.REQ_FILES_DOWNLOAD, PeerMessageType.REQ_FILES_LIST]
    : [PeerMessageType.RES_FILES_LIST, PeerMessageType.RES_FILES_DOWNLOAD]
  ).includes(msgType);

export const usePeer = ({ peerType, onReceiveMessage }: UsePeerProps) => {
  const [peers, setPeers] = useState<Record<string, DataConnection>>({});
  const [myPeer] = useState(
    () =>
      new Peer(genId(), {
        host: "127.0.0.1",
        port: 8081,
        path: "/sockets",
        debug: 3,
        secure: false,
      })
  );

  const _onReceiveMessage: OnReceiveMessageFnType = (
    peerId: string,
    msg: PeerMessage
  ) => {
    Logger.info(`receiving file ${msg.type} from ${peerId}`);
    if (isInterestedInMessage(peerType, msg.type)) {
      onReceiveMessage(peerId, msg);
    }
  };

  const _listenToPeerEvents = (peerId: string, conn: DataConnection) =>
    conn
      .on("open", () => {
        Logger.info("Connect to: " + peerId);
        setPeers((c) => ImmutableRecord.add(c, peerId, conn));
      })
      .on("data", (receivedData: any) => {
        Logger.info("Receiving data from " + peerId);
        _onReceiveMessage(peerId, receivedData as PeerMessage);
      })
      .on("close", () => {
        Logger.info("Connection closed: " + peerId);
        setPeers((c) => ImmutableRecord.remove(c, peerId));
      })
      .on("error", (err: Error) => {
        Logger.error("connectPeer-error", err);
      });

  const startSession = () =>
    new Promise<string>((resolve, reject) => {
      myPeer
        .on("open", (id: string) => {
          Logger.info(`connection open ${id}`);
          resolve(id);
        })
        .on("connection", (conn: DataConnection) => {
          const connId = conn.peer;
          Logger.info("Incoming connection:", connId);
          setPeers((c) => ImmutableRecord.add(c, connId, conn));
          _listenToPeerEvents(connId, conn);
        })
        .on("error", (err: Error) => {
          Logger.error("startPeerSession-error:", err);
          // alert(`Error: ${err.message}`); // TODO
          reject(err);
        });
    });

  const connectToNewPeer = (peerId: string) =>
    new Promise<void>((resolve, reject) => {
      if (peers[peerId]) {
        return reject(new Error("Connection existed"));
      }
      const conn = myPeer.connect(peerId, { reliable: true });
      if (!conn) return reject(new Error("Connection can't be established"));
      _listenToPeerEvents(peerId, conn);
    });

  const sendMessageToPeer = (id: string, msg: PeerMessage): Promise<void> =>
    new Promise((resolve, reject) => {
      if (!peers[id]) {
        reject(new Error("Connection didn't exist"));
      }
      try {
        const conn = peers[id];
        if (conn) conn.send(msg);
        resolve();
      } catch (err) {
        Logger.error("sendConnection", err);
        reject(err);
      }
    });

  return {
    myPeer,
    peers: Object.keys(peers).map((p) => peers[p].peer),
    startSession,
    connectToNewPeer,
    sendMessageToPeer,
  };
};

const genId = () => `${CryptoLib.uuid(true)}-${CryptoLib.random(8)}`;
