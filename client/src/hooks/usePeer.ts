import { useRef } from "react";
import { unpack } from "peerjs-js-binarypack";
import {
  Chunk,
  DataFileProgress,
  ISeverMessageDataReq,
  ISeverMessageDataRes,
  PeerMessage,
  PeerMessageType,
  ServerMessage,
  ServerMessageType,
  ServerMessageWrapped,
} from "libs/peer";
import { ImmutableRecord } from "utils/record";
import {
  ActivityLogType,
  toActivityLogType,
  useActivityLogs,
} from "./useActivityLog";
import { genId } from "utils/id";
import Peer, {
  DataConnection,
  PeerError,
  PeerErrorType,
  SocketEventType,
} from "peerjs";
import { useOnTabUnloaded } from "dto/useOnTabUnloaded";

export type OnReceiveMessageFnType = (peerId: string, msg: PeerMessage) => any;

type PeerType = "SENDER" | "RECEIVER";

interface UsePeerProps {
  peerType: PeerType;
  onReceiveMessage: OnReceiveMessageFnType;
}

const isSender = (peerType: PeerType) => peerType === "SENDER";
const isInterestedInMessage = (peerType: PeerType, msgType: PeerMessageType) =>
  (isSender(peerType)
    ? [
        PeerMessageType.FILES_DOWNLOAD_REQ,
        PeerMessageType.FILES_LIST_REQ,
        PeerMessageType.FILES_DOWNLOAD_PROGRESS,
      ]
    : [PeerMessageType.FILES_LIST_RES, PeerMessageType.FILES_DOWNLOAD_RES]
  ).includes(msgType);

export const usePeer = ({ peerType, onReceiveMessage }: UsePeerProps) => {
  const serverPeerRef = useRef<Peer>();
  const peersRef = useRef<Record<string, DataConnection>>({}); // "We recommend keeping track of connections..." https://peerjs.com/docs/#peerconnections
  const { activityLogs, addActivityLog } = useActivityLogs();
  useOnTabUnloaded(Boolean(serverPeerRef.current));

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
    addActivityLog({ peerId, type: "LISTEN_CONNECTION_REQUESTED" });
    conn
      .on("open", () => {
        peersRef.current = ImmutableRecord.add(peersRef.current, peerId, conn);
        if (callback) callback();
        addActivityLog({ peerId, type: "LISTEN_CONNECTION_OK" });
        if (!isSender(peerType)) {
          conn.dataChannel.addEventListener(
            "message",
            (event: MessageEvent) => {
              const chunk = unpack<Chunk>(event.data);
              if (chunk.__peerData && chunk.total) {
                const peerMsg: PeerMessage = {
                  type: PeerMessageType.FILES_DOWNLOAD_PROGRESS,
                  data: {
                    id: "",
                    progress: chunk.n,
                    total: chunk.total,
                  } as DataFileProgress,
                };
                conn.send(peerMsg);
              }
            }
          );
        }
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
        addActivityLog({ peerId, type: "LISTEN_CONNECTION_ERROR", data: err });
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
      addActivityLog({ type: "NEW_CONNECTION_OK", peerId });
      if (peersRef.current[peerId]) {
        const errMsg = "Connection existed";
        addActivityLog({ peerId, type: "NEW_CONNECTION_ERROR", data: errMsg });
        return reject(new Error(errMsg));
      }
      const conn = serverPeerRef.current?.connect(peerId, { reliable: true });
      if (!conn) {
        const errMsg = "Connection can't be established";
        addActivityLog({ peerId, type: "NEW_CONNECTION_ERROR", data: errMsg });
        return reject(new Error(errMsg));
      }
      addActivityLog({ peerId, type: "NEW_CONNECTION_OK" });
      _listenToPeerEvents(peerId, conn, (err?: Error) =>
        err ? reject(err) : resolve()
      );
    });

  const sendMessageToPeer = (peerId: string, msg: PeerMessage): Promise<void> =>
    new Promise((resolve, reject) => {
      try {
        addActivityLog({ peerId, type: msg.type, data: msg.data });
        const conn = peersRef.current[peerId];
        conn.send(msg);
        addActivityLog({
          peerId,
          type: toActivityLogType(msg.type, "OK"),
        });
        resolve();
      } catch (err) {
        addActivityLog({
          peerId,
          type: toActivityLogType(msg.type, "ERROR"),
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
      addActivityLog({ type: toActivityLogType(messageType, "OK") });
    } catch (err) {
      addActivityLog({
        type: toActivityLogType(messageType, "ERROR"),
        data: err,
      });
    }
  };

  const listenToServerEvent = <T extends ISeverMessageDataRes>(
    messageType: ServerMessageType,
    onServerEvent: (d: ServerMessage<T>) => any
  ) => {
    serverPeerRef.current?.socket?.once(
      SocketEventType.Message,
      (message: ServerMessageWrapped<T>) => {
        if (message.type === "PEER_DROP") {
          const { payload } = message;
          if (payload.type === messageType) {
            onServerEvent(payload);

            if (payload.error) {
              addActivityLog({
                type: toActivityLogType(messageType, "ERROR"),
                data: payload.error,
              });
            } else {
              addActivityLog({
                type: toActivityLogType(messageType, "OK"),
                // data: message, // TODO
              });
            }
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
