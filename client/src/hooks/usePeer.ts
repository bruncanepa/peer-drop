import { useState } from "react";
import { DataType, PeerConnection } from "libs/peer";
import { Message } from "utils/message";
import { downloadFile } from "utils/file";

export const usePeer = () => {
  const [message] = useState(() => new Message());
  const [peerConn, setPeerConn] = useState<PeerConnection>();
  const [peers, setPeers] = useState<string[]>([]);

  const listenToNewConnection = (newConn: PeerConnection, id: string) => {
    newConn.onConnectionDisconnected(id, () => {
      message.info(`connection closed with ${id}`);
    });

    newConn.onConnectionReceiveData(id, (file) => {
      message.info(`receiving file ${file.fileName} from ${id}`);
      if (file.dataType === DataType.FILE) {
        downloadFile(
          file.file as Blob,
          file.fileName || "fileName",
          file.fileType
        );
      } else {
        message.info(`Received message: ${JSON.stringify(file)}`);
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
  };
};
