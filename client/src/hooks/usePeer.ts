import { useMemo, useState } from "react";
import {
  DataFile,
  DataFileList,
  PeerMessageType,
  IData,
  PeerConnection,
  PeerMessage,
} from "libs/peer";
import { Message } from "utils/message";

type PeerType = "SENDER" | "RECEIVER";
interface UsePeerProps {
  peerType: PeerType;
  onReceiveMessage: (peerId: string, msg: PeerMessage) => void;
}

const isReceiver = (peerType: PeerType) => peerType === "RECEIVER";
const isSender = (peerType: PeerType) => peerType === "SENDER";
const isInterestedInMessage = (peerType: PeerType, msgType: PeerMessageType) =>
  (isSender(peerType)
    ? [PeerMessageType.REQ_FILES_DOWNLOAD, PeerMessageType.REQ_FILES_LIST]
    : [PeerMessageType.RES_FILES_LIST, PeerMessageType.RES_FILES_DOWNLOAD]
  ).includes(msgType);

export const usePeer = ({ peerType, onReceiveMessage }: UsePeerProps) => {
  const [message] = useState(() => new Message());
  const [peerConn, setPeerConn] = useState<PeerConnection>();
  const [peers, setPeers] = useState<string[]>([]);

  const sendToConnection = (
    peerId: string,
    dataType: PeerMessageType,
    data?: IData
  ) => {
    return peerConn?.sendConnection(peerId, { type: dataType, data });
  };

  const listenToNewConnection = (newConn: PeerConnection, peerId: string) => {
    newConn.onConnectionDisconnected(peerId, () => {
      message.info(`connection closed with ${peerId}`);
    });

    newConn.onConnectionReceiveData(peerId, (msg) => {
      message.info(`receiving file ${msg.type} from ${peerId}`);
      if (isInterestedInMessage(peerType, msg.type)) {
        onReceiveMessage(peerId, msg);
      }
    });
  };

  const startPeerSession = async () => {
    try {
      const peerConn = new PeerConnection((peers: string[]) => setPeers(peers));
      await peerConn.startPeerSession();
      setPeerConn(peerConn);
      peerConn.onIncomingConnection((conn) => {
        const connectingPeerId = conn.peer;
        message.info("Incoming connection: " + connectingPeerId);
        listenToNewConnection(peerConn, connectingPeerId);
      });
      return peerConn;
    } catch (err) {
      message.error("Error starting session:", err);
    }
  };

  const connectToNewPeer = async (id: string) => {
    if (peerConn) {
      message.info(`connecting with new peer ${id}`);
      await peerConn.connectPeer(id);
      listenToNewConnection(peerConn, id);
      message.info(`connected with new peer ${id}`);
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
