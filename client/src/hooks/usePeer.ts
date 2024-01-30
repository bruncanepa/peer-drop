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
import { genId, idToShortId } from "utils/id";
import Peer, {
  DataConnection,
  PeerError,
  PeerErrorType,
  SocketEventType,
} from "peerjs";
import { useOnTabUnloaded } from "dto/useOnTabUnloaded";
import { useMultipleProgress } from "./useMultipleProgess";
import { UseToastOptions, useToast } from "@chakra-ui/react";

export type OnReceiveMessageFnType = (peerId: string, msg: PeerMessage) => any;

type PeerType = "SENDER" | "RECEIVER";

interface UsePeerProps {
  peerType: PeerType;
  onReceiveMessage: OnReceiveMessageFnType;
}

const isSender = (peerType: PeerType) => peerType === "SENDER";
const isInterestedInMessage = (peerType: PeerType, msgType: PeerMessageType) =>
  (isSender(peerType)
    ? (["FILES_DOWNLOAD_REQ", "FILES_LIST_REQ"] as PeerMessageType[])
    : (["FILES_LIST_RES", "FILES_DOWNLOAD_RES"] as PeerMessageType[])
  ).includes(msgType);

const toastDefaultProps: UseToastOptions = { duration: null, isClosable: true };

export const usePeer = ({ peerType, onReceiveMessage }: UsePeerProps) => {
  const serverPeerRef = useRef<Peer>();
  const peersRef = useRef<Record<string, DataConnection>>({}); // "We recommend keeping track of connections..." https://peerjs.com/docs/#peerconnections
  const { progressMap, onProgress, onReset } = useMultipleProgress();
  const peerIsSender = isSender(peerType);
  useOnTabUnloaded(Boolean(serverPeerRef.current));
  const toast = useToast();

  const toastSuccess = (title: string) =>
    toast({ ...toastDefaultProps, title, status: "error" });
  const toastInfo = (title: string) =>
    toast({ ...toastDefaultProps, title, status: "info" });
  const toastError = (err: Error) =>
    toast({
      ...toastDefaultProps,
      title: err.message || "An error ocurred",
      status: "error",
    });

  const { activityLogs, addActivityLog } = useActivityLogs(toastError);

  const _onReceiveMessage: OnReceiveMessageFnType = (
    peerId: string,
    msg: PeerMessage
  ) => {
    if (isInterestedInMessage(peerType, msg.type)) {
      onReceiveMessage(peerId, msg);
    } else if (msg.type === "FILES_DOWNLOAD_PROGRESS") {
      const msgData = msg.data as DataFileProgress;
      onProgress(msgData.id, msgData.progress, msgData.total);
    }
    addActivityLog({ type: msg.type, peerId, data: msg.data });
  };

  const _listenToPeerEvents = (
    peerId: string,
    conn: DataConnection,
    resultCallback?: (err?: Error) => any
  ) => {
    addActivityLog({ peerId, type: "LISTEN_CONNECTION_REQUESTED" });
    conn
      .on("open", () => {
        peersRef.current = ImmutableRecord.add(peersRef.current, peerId, conn);
        if (resultCallback) resultCallback();
        addActivityLog({ peerId, type: "LISTEN_CONNECTION_OK" });
        if (!peerIsSender) {
          conn.dataChannel.addEventListener(
            "message",
            (event: MessageEvent) => {
              const chunk = unpack<Chunk>(event.data);
              if (chunk.__peerData && chunk.total) {
                // update every 5% progress or when completed
                const fivePercentage = Math.trunc(chunk.total * 0.05);
                const isPrevLastChunk = chunk.n === chunk.total - 1;
                if (isPrevLastChunk || chunk.n % fivePercentage === 0) {
                  const progress = isPrevLastChunk ? chunk.total : chunk.n;
                  onProgress(`${chunk.__peerData}`, progress, chunk.total);
                  // const peerMsg: PeerMessage = {
                  //   type: "FILES_DOWNLOAD_PROGRESS",
                  //   data: {
                  //     id: `${chunk.__peerData}`,
                  //     progress,
                  //     total: chunk.total,
                  //   } as DataFileProgress,
                  // };
                  // conn.send(peerMsg);
                }
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
        if (resultCallback) resultCallback(err);
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
          const connId = conn.peer;
          peersRef.current = ImmutableRecord.add(
            peersRef.current,
            connId,
            conn
          );
          if (peerIsSender) _listenToPeerEvents(connId, conn);
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
        if (!conn) {
          throw new Error(`Connection ${idToShortId(peerId)} disconnected`);
        }
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

  const sendMessageToServer = <
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
    fileProgressMap: progressMap,
    startSession,
    connectToNewPeer,
    sendMessageToPeer,
    addActivityLog,
    sendMessageToServer,
    listenToServerEvents: listenToServerEvent,
    toastSuccess,
    toastError,
    toastInfo,
    onResetFileProgess: onReset,
  };
};
