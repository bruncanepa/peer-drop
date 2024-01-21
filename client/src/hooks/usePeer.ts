import { useRef, useState } from "react";
import {
  PeerMessageType,
  IData,
  PeerConnection,
  PeerMessage,
  OnReceiveMessageFnType,
} from "libs/peer";
import { Message } from "utils/message";

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
  const [message] = useState(() => new Message());
  const peerConn = useRef<PeerConnection>();
  const [peers, setPeers] = useState<string[]>([]);

  const _onReceiveMessage: OnReceiveMessageFnType = (
    peerId: string,
    msg: PeerMessage
  ) => {
    message.info(`receiving file ${msg.type} from ${peerId}`);
    if (isInterestedInMessage(peerType, msg.type)) {
      onReceiveMessage(peerId, msg);
    }
  };

  const sendToConnection = (
    peerId: string,
    dataType: PeerMessageType,
    data?: IData
  ) => {
    message.debug(`START: sendToConnection to ${peerId} type ${dataType}`);
    return peerConn.current
      ?.sendMessageToConnection(peerId, { type: dataType, data })
      .finally(() =>
        message.debug(`END: sendToConnection to ${peerId} type ${dataType}`)
      );
  };

  const startPeerSession = async () => {
    try {
      const newConn = new PeerConnection((peers: string[]) => setPeers(peers));
      await newConn.startSession(_onReceiveMessage);
      peerConn.current = newConn;
    } catch (err) {
      message.error("Error starting session:", err);
    }
  };

  const connectToNewPeer = async (peerId: string) => {
    if (peerConn.current) {
      message.info(`connecting with new peer ${peerId}`);
      await peerConn.current.connectToNewPeer(peerId, _onReceiveMessage);
      message.info(`connected with new peer ${peerId}`);
    } else {
      message.error("start session first");
      throw Error("start session first");
    }
  };

  return {
    peerConn,
    peers,
    startPeerSession,
    connectToNewPeer,
    sendToConnection,
  };
};
