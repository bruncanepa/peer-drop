import { useRef } from "react";
import Peer, { DataConnection } from "peerjs";
import { PeerMessage, PeerMessageType } from "libs/peer";
import { ImmutableRecord } from "utils/record";
import { useActivityLogs } from "./useActivityLog";
import { genId } from "utils/id";

export type OnReceiveMessageFnType = (peerId: string, msg: PeerMessage) => any;

type PeerType = "SENDER" | "RECEIVER";

interface UsePeerProps {
  peerType: PeerType;
  onReceiveMessage: OnReceiveMessageFnType;
}

const isSender = (peerType: PeerType) => peerType === "SENDER";
const isInterestedInMessage = (peerType: PeerType, msgType: PeerMessageType) =>
  (isSender(peerType)
    ? [PeerMessageType.FILES_DOWNLOAD_REQ, PeerMessageType.FILES_LIST_REQ]
    : [PeerMessageType.FILES_LIST_RES, PeerMessageType.FILES_DOWNLOAD_RES]
  ).includes(msgType);

export const usePeer = ({ peerType, onReceiveMessage }: UsePeerProps) => {
  const serverPeer = useRef<Peer>();
  const peers = useRef<Record<string, DataConnection>>({});
  const { activityLogs, addActivityLog } = useActivityLogs();

  const _onReceiveMessage: OnReceiveMessageFnType = (
    peerId: string,
    msg: PeerMessage
  ) => {
    if (isInterestedInMessage(peerType, msg.type)) {
      onReceiveMessage(peerId, msg);
    }
    addActivityLog({ type: msg.type, peerId, data: msg.data });
  };

  const _listenToPeerEvents = (
    peerId: string,
    conn: DataConnection,
    callback?: (err?: Error) => any
  ) => {
    addActivityLog({ peerId, type: "NEW_CONNECTION_REQUESTED" });
    conn
      .on("open", () => {
        peers.current = ImmutableRecord.add(peers.current, peerId, conn);
        if (callback) callback();
        addActivityLog({ peerId, type: "NEW_CONNECTION_OK" });
      })
      .on("data", (receivedData: any) => {
        _onReceiveMessage(peerId, receivedData as PeerMessage);
      })
      .on("close", () => {
        peers.current = ImmutableRecord.remove(peers.current, peerId);
        addActivityLog({ peerId, type: "CONNECTION_CLOSE" });
      })
      .on("error", (err: Error) => {
        if (callback) callback(err);
        addActivityLog({ peerId, type: "NEW_CONNECTION_ERROR", data: err });
      });
  };

  const startSession = (): Promise<string> =>
    new Promise<string>((resolve, reject) => {
      serverPeer.current = new Peer(genId(), {
        host: "127.0.0.1",
        port: 8081,
        path: "/sockets",
        debug: 3,
        secure: false,
      });
      addActivityLog({
        peerId: serverPeer.current.id,
        type: "CREATE_SESSION_REQUESTED",
      });
      serverPeer.current
        .on("open", (id: string) => {
          addActivityLog({ type: "CREATE_SESSION_OK" });
          resolve(id);
        })
        .on("connection", (conn: DataConnection) => {
          if (Object.keys(peers.current).length) {
            throw Error("receiver only allows 1 connection");
          }
          const connId = conn.peer;
          peers.current = ImmutableRecord.add(peers.current, connId, conn);
          _listenToPeerEvents(connId, conn);
        })
        .on("error", (err: Error) => {
          addActivityLog({ type: "CREATE_SESSION_ERROR" });
          reject(err);
        });
    });

  const connectToNewPeer = (peerId: string) =>
    new Promise<void>((resolve, reject) => {
      if (peers.current[peerId]) {
        return reject(new Error("Connection existed"));
      }
      const conn = serverPeer.current?.connect(peerId, { reliable: true });
      if (!conn) return reject(new Error("Connection can't be established"));
      _listenToPeerEvents(peerId, conn, (err?: Error) =>
        err ? reject(err) : resolve()
      );
    });

  const sendMessageToPeer = (peerId: string, msg: PeerMessage): Promise<void> =>
    new Promise(async (resolve, reject) => {
      try {
        const conn = peers.current[peerId];
        await conn.send(msg, true);
        addActivityLog({ peerId, type: msg.type, data: msg.data });
        resolve();
      } catch (err) {
        addActivityLog({
          peerId,
          type: (msg.type + "_ERROR") as PeerMessageType,
          data: err,
        });
        reject(err);
      }
    });

  return {
    myId: serverPeer.current?.id || "",
    peers: Object.keys(peers.current).map((p) => peers.current[p].peer),
    activityLogs,
    startSession,
    connectToNewPeer,
    sendMessageToPeer,
    addActivityLog,
  };
};
