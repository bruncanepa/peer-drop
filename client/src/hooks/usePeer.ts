import { useRef } from "react";
import Peer, {
  DataConnection,
  PeerError,
  PeerErrorType,
  SocketEventType,
} from "peerjs";
import { PeerAliasReq, PeerMessage, PeerMessageType } from "dto/peer";
import { ImmutableRecord } from "utils/record";
import {
  ActivityLogType,
  toActivityLogType,
  useActivityLogs,
} from "./useActivityLog";
import { genAlias, genPeerId } from "utils/id";

import { useOnTabUnloaded } from "hooks/useOnTabUnloaded";
import { useToast } from "./useToast";
import {
  ISeverMessageDataReq,
  ISeverMessageDataRes,
  ServerMessage,
  ServerMessageType,
  ServerMessageWrapped,
} from "dto/server";
import { useUpdatableRef } from "./useUpdatableRef";

export type OnReceiveMessageFnType = (peerId: string, msg: PeerMessage) => any;

type PeerType = "SENDER" | "RECEIVER";

interface UsePeerProps {
  peerType: PeerType;
  onReceiveMessage: OnReceiveMessageFnType;
  onFileTransferEnd: (peerId?: string) => any;
}

const isSender = (peerType: PeerType) => peerType === "SENDER";
const isInterestedInMessage = (peerType: PeerType, msgType: PeerMessageType) =>
  (isSender(peerType)
    ? (["FILES_TRANSFER_REQ", "FILES_LIST_REQ"] as PeerMessageType[])
    : ([
        "FILES_LIST_RES",
        "FILES_TRANSFER_RES",
        "SET_PEER_ALIAS",
      ] as PeerMessageType[])
  ).includes(msgType);

export const usePeer = ({
  peerType,
  onReceiveMessage,
  onFileTransferEnd,
}: UsePeerProps) => {
  const toast = useToast();
  const peerIsSender = isSender(peerType);
  const myPeerRef = useRef<Peer>();
  const peersRef = useRef<Record<string, DataConnection>>({}); // "We recommend keeping track of connections..." https://peerjs.com/docs/#peerconnections
  const [peersAliasesRef, setPeersAliasesRef] = useUpdatableRef<
    Record<string, string>
  >({});
  useOnTabUnloaded(Boolean(myPeerRef.current));

  const { activityLogs, addActivityLog } = useActivityLogs(peersAliasesRef);

  const _onReceiveMessage: OnReceiveMessageFnType = (
    peerId: string,
    msg: PeerMessage
  ) => {
    if (isInterestedInMessage(peerType, msg.type)) {
      onReceiveMessage(peerId, msg);
    } else if (msg.type === "FILES_TRANSFER_END") {
      onFileTransferEnd(peerId);
    }
    addActivityLog({ type: msg.type, peerId, data: msg.data });
  };

  const _updatePeers = (
    action: "add" | "remove",
    peerId: string,
    conn: DataConnection
  ) => {
    if (action === "add") {
      peersRef.current = ImmutableRecord.add(peersRef.current, peerId, conn);
      if (peerIsSender) {
        const alias = genAlias();
        setPeersAliasesRef(
          ImmutableRecord.add(peersAliasesRef.current, peerId, alias)
        );
        sendMessageToPeer(peerId, {
          type: "SET_PEER_ALIAS",
          data: { alias } as PeerAliasReq,
        });
      }
    } else {
      peersRef.current = ImmutableRecord.remove(peersRef.current, peerId);
      conn.close();
      if (peerIsSender) {
        setPeersAliasesRef(
          ImmutableRecord.remove(peersAliasesRef.current, peerId)
        );
      }
    }
  };

  const _listenToPeerEvents = (
    peerId: string,
    conn: DataConnection,
    resultCallback?: (err?: Error) => any,
    onEveryMessage?: (event: MessageEvent) => any
  ) => {
    addActivityLog({ peerId, type: "LISTEN_CONNECTION_REQUESTED" });
    const _onClose = () => {
      if (peersRef.current[peerId]) {
        toast.info(`Disconnected from ${peersAliasesRef.current[peerId]}`);
        addActivityLog({ peerId, type: "CONNECTION_CLOSE" }); // before _updatePeers
        _updatePeers("remove", peerId, conn);
      }
    };
    conn
      .on("open", () => {
        _updatePeers("add", peerId, conn);
        if (resultCallback) resultCallback();
        if (onEveryMessage) {
          conn.dataChannel.addEventListener("message", onEveryMessage);
        }
        addActivityLog({ peerId, type: "LISTEN_CONNECTION_OK" });
      })
      .on("data", (receivedData: any) => {
        _onReceiveMessage(peerId, receivedData as PeerMessage);
      })
      .on("close", _onClose)
      .on("iceStateChanged", (state) => {
        if (state === "disconnected") _onClose();
      })
      .on("error", (err: PeerError<string>) => {
        addActivityLog({ peerId, type: "LISTEN_CONNECTION_ERROR", data: err });
        toast.error(err);
        if (resultCallback) resultCallback(err);
      });
  };

  const startSession = (): Promise<string> =>
    new Promise<string>((resolve, reject) => {
      myPeerRef.current = new Peer(genPeerId(), {
        host: "127.0.0.1",
        port: 8081,
        path: "/sockets",
        debug: 3,
        secure: false,
      });
      addActivityLog({ type: "CREATE_SESSION_REQUESTED" });
      myPeerRef.current
        .on("open", (id: string) => {
          addActivityLog({ type: "CREATE_SESSION_OK" });
          resolve(id);
        })
        .on("connection", (conn: DataConnection) => {
          const peerId = conn.peer;
          _updatePeers("add", peerId, conn);
          if (peerIsSender) _listenToPeerEvents(peerId, conn);
        })
        .on("error", (err: PeerError<string>) => {
          // TODO https://peerjs.com/docs/#peeron-error
          toast.error(err);
          if (err.type === PeerErrorType.Network) {
            addActivityLog({ type: "DISCONNECTED_FROM_SERVER", data: err });
          } else {
            addActivityLog({ type: "CREATE_SESSION_ERROR", data: err });
            reject(err);
          }
        });
    });

  const connectToNewPeer = (
    peerId: string,
    onEveryMessage?: (event: MessageEvent) => any
  ) =>
    new Promise<void>((resolve, reject) => {
      addActivityLog({ type: "NEW_CONNECTION_OK", peerId });
      if (peersRef.current[peerId]) {
        peersRef.current[peerId].close();
      }
      const conn = myPeerRef.current?.connect(peerId, { reliable: true });
      if (!conn) {
        const errMsg = "Connection can't be established";
        addActivityLog({ peerId, type: "NEW_CONNECTION_ERROR", data: errMsg });
        toast.error(new Error(errMsg));
        return reject(new Error(errMsg));
      }
      addActivityLog({ peerId, type: "NEW_CONNECTION_OK" });
      _listenToPeerEvents(
        peerId,
        conn,
        (err?: Error) => (err ? reject(err) : resolve()),
        onEveryMessage
      );
    });

  const sendMessageToPeer = (peerId: string, msg: PeerMessage) => {
    addActivityLog({ peerId, type: msg.type, data: msg.data });
    const conn = peersRef.current[peerId];
    if (!conn) {
      toast.error(
        new Error(`Connection ${peersAliasesRef.current[peerId]} disconnected`)
      );
      return;
    }
    try {
      conn.send(msg);
      addActivityLog({
        peerId,
        type: toActivityLogType(msg.type, "OK"),
      });
    } catch (err) {
      addActivityLog({
        peerId,
        type: toActivityLogType(msg.type, "ERROR"),
        data: err,
      });
      toast.error(err as Error, "error sending message to room");
    }
  };

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
      listenToServerEvents(payload.type, onServerEvent);
      myPeerRef.current?.socket.send({ type: "PEER_DROP", payload });
      addActivityLog({ type: toActivityLogType(messageType, "OK") });
    } catch (err) {
      toast.error(err as Error, "error sending message to server");
      addActivityLog({
        type: toActivityLogType(messageType, "ERROR"),
        data: err,
      });
    }
  };

  const listenToServerEvents = <T extends ISeverMessageDataRes>(
    messageType: ServerMessageType,
    onServerEvent: (d: ServerMessage<T>) => any
  ) => {
    myPeerRef.current?.socket?.once(
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
    myId: myPeerRef.current?.id || "",
    peers: Object.keys(peersRef.current).map((p) => peersRef.current[p].peer),
    peersAliasesRef,
    activityLogs,
    startSession,
    connectToNewPeer,
    sendMessageToPeer,
    sendMessageToServer,
    listenToServerEvents,
  };
};
