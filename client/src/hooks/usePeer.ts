import { useRef } from "react";
import {
  ISeverMessageDataReq,
  ISeverMessageDataRes,
  PeerMessage,
  PeerMessageType,
  ServerMessage,
  ServerMessageType,
} from "libs/peer";
import { ImmutableRecord } from "utils/record";
import { ActivityLogType, useActivityLogs } from "./useActivityLog";
import { genId } from "utils/id";
import Peer, {
  DataConnection,
  PeerError,
  PeerErrorType,
  SocketEventType,
} from "peerjs";

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
  const serverPeerRef = useRef<Peer>();
  const peersRef = useRef<Record<string, DataConnection>>({}); // "We recommend keeping track of connections..." https://peerjs.com/docs/#peerconnections
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
        peersRef.current = ImmutableRecord.add(peersRef.current, peerId, conn);
        if (callback) callback();
        addActivityLog({ peerId, type: "NEW_CONNECTION_OK" });
      })
      .on("data", (receivedData: any) => {
        _onReceiveMessage(peerId, receivedData as PeerMessage);
      })
      .on("close", () => {
        peersRef.current = ImmutableRecord.remove(peersRef.current, peerId);
        addActivityLog({ peerId, type: "CONNECTION_CLOSE" });
      })
      .on("error", (err: PeerError<string>) => {
        if (callback) callback(err);
        addActivityLog({ peerId, type: "NEW_CONNECTION_ERROR", data: err });
      });
  };

  const startSession = (): Promise<string> =>
    new Promise<string>((resolve, reject) => {
      serverPeerRef.current = new Peer(genId(), {
        host: "127.0.0.1",
        port: 8081,
        path: "/sockets",
        debug: 3,
        secure: false,
      });
      addActivityLog({
        peerId: serverPeerRef.current.id,
        type: "CREATE_SESSION_REQUESTED",
      });
      serverPeerRef.current
        .on("open", (id: string) => {
          addActivityLog({ type: "CREATE_SESSION_OK" });
          resolve(id);
        })
        .on("connection", (conn: DataConnection) => {
          if (Object.keys(peersRef.current).length) {
            throw Error("receiver only allows 1 connection");
          }
          const connId = conn.peer;
          peersRef.current = ImmutableRecord.add(
            peersRef.current,
            connId,
            conn
          );
          _listenToPeerEvents(connId, conn);
        })
        .on("error", (err: PeerError<string>) => {
          // TODO https://peerjs.com/docs/#peeron-error
          if (err.type === PeerErrorType.Network) {
            addActivityLog({ type: "DISCONNECTED_FROM_SERVER", data: err });
          } else {
            addActivityLog({ type: "CREATE_SESSION_ERROR", data: err });
            reject(err);
          }
        });
    });

  const connectToNewPeer = (peerId: string) =>
    new Promise<void>((resolve, reject) => {
      addActivityLog({ type: "CREATE_ROOM_REQUESTED", peerId });
      if (peersRef.current[peerId]) {
        const errMsg = "Connection existed";
        addActivityLog({ peerId, type: "CREATE_ROOM_ERROR", data: errMsg });
        return reject(new Error(errMsg));
      }
      const conn = serverPeerRef.current?.connect(peerId, { reliable: true });
      if (!conn) {
        const errMsg = "Connection can't be established";
        addActivityLog({ peerId, type: "CREATE_ROOM_ERROR", data: errMsg });
        return reject(new Error(errMsg));
      }
      _listenToPeerEvents(peerId, conn, (err?: Error) => {
        if (err) {
          addActivityLog({ peerId, type: "CREATE_ROOM_ERROR", data: err });
          reject(err);
        } else {
          addActivityLog({ peerId, type: "CREATE_ROOM_OK" });
          resolve();
        }
      });
    });

  const sendMessageToPeer = (peerId: string, msg: PeerMessage): Promise<void> =>
    new Promise(async (resolve, reject) => {
      try {
        addActivityLog({ peerId, type: msg.type, data: msg.data });
        const conn = peersRef.current[peerId];
        await conn.send(msg, true);
        addActivityLog({ peerId, type: `${msg.type}_OK` as PeerMessageType });
        resolve();
      } catch (err) {
        addActivityLog({
          peerId,
          type: `${msg.type}_ERROR` as PeerMessageType,
          data: err,
        });
        reject(err);
      }
    });

  const sendMessageToServer = async <
    T extends ISeverMessageDataReq,
    X extends ISeverMessageDataRes
  >(
    messageType: ActivityLogType,
    payload: ServerMessage<T>,
    onServerEvent: (d: ServerMessage<X>) => any
  ) => {
    try {
      addActivityLog({ type: messageType });
      listenToServerEvent(payload.type, onServerEvent);
      serverPeerRef.current?.socket.send({ type: "PEER_DROP", payload });
      addActivityLog({ type: `${messageType}_OK` as ActivityLogType });
    } catch (err) {
      addActivityLog({
        type: `${messageType}_ERROR` as ActivityLogType,
        data: err,
      });
    }
  };

  const listenToServerEvent = <T extends ISeverMessageDataRes>(
    messageType: ServerMessageType,
    onServerEvent: (d: ServerMessage<T>) => any,
    { once = true } = {} // TODO
  ) => {
    serverPeerRef.current?.socket?.on(
      SocketEventType.Message,
      (message: any) => {
        const msg = message as ServerMessage<T>;
        if (msg.type === messageType) {
          onServerEvent(msg);

          if (msg.error) {
            addActivityLog({
              type: `${messageType}_ERROR` as ActivityLogType,
              data: msg.error,
            });
          } else {
            addActivityLog({
              type: `${messageType}_OK` as ActivityLogType,
              // data: msg, // TODO
            });
          }
        }
      }
    );
  };

  return {
    myId: serverPeerRef.current?.id || "",
    peers: Object.keys(peersRef.current).map((p) => peersRef.current[p].peer),
    activityLogs,
    startSession,
    connectToNewPeer,
    sendMessageToPeer,
    addActivityLog,
    sendMessageToServer,
    listenToServerEvents: listenToServerEvent,
  };
};
