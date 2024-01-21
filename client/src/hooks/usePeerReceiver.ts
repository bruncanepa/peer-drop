import { useEffect, useState } from "react";
import { usePeer } from "./usePeer";
import { FileSessionShared } from "dto/fileSession";
import {
  DataFile,
  DataFileList,
  DataFileListeItem,
  PeerMessage,
  PeerMessageType,
} from "libs/peer";
import { Message } from "utils/message";
import { downloadFile } from "utils/file";

interface usePeerReceiverProps {
  sharedId: string;
}

export const usePeerReceiver = ({ sharedId }: usePeerReceiverProps) => {
  const [message] = useState(() => new Message());
  const [files, setFiles] = useState<DataFileListeItem[]>([]);
  const [fileSession, setFilSession] = useState<FileSessionShared>();
  const [error, setError] = useState<Error>();

  const onReceiveMessage = (peerId: string, msg: PeerMessage) => {
    switch (msg.type) {
      case PeerMessageType.RES_FILES_LIST: {
        const data = msg.data as DataFileList;
        setFiles(data.items);
        return message.info(`Received file list from ${peerId} successfully`);
      }

      case PeerMessageType.RES_FILES_DOWNLOAD: {
        const data = msg.data as DataFile;
        return downloadFile(
          data.blob as Blob,
          data.name || "fileName",
          data.type
        );
      }
    }
  };

  const {
    connectToNewPeer,
    peerConn,
    peers,
    sendToConnection,
    startPeerSession,
  } = usePeer({ peerType: "RECEIVER", onReceiveMessage });

  useEffect(() => {
    // load on first render only
    (async () => {
      if (sharedId) {
        await startPeerSession();
        const fs = await getFileSession();
        if (fs) {
          sendToConnection(fs.ownerId, PeerMessageType.REQ_FILES_LIST)?.catch(
            (e) => message.error(e)
          );
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // useEffect(() => {
  //   // load when new peer connection set
  //   if (peerConn.current && !fileSession) {
  //     (async () => {
  //       const fs = await getFileSession();
  //       if (fs) {
  //         sendToConnection(fs.ownerId, PeerMessageType.REQ_FILES_LIST)?.catch(
  //           (e) => console.log(e)
  //         );
  //       }
  //     })();
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [peerConn.current, fileSession]);

  // useEffect(() => {
  //   // ask for file list from sender
  //   if (fileSession) {
  //     sendToConnection(
  //       fileSession.ownerId,
  //       PeerMessageType.REQ_FILES_LIST
  //     )?.catch((e) => console.log(e));
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [fileSession]);

  const getFileSession = async () => {
    try {
      const fileSessionRes: FileSessionShared = await fetch(
        `http://localhost:8081/files/sessions/${sharedId}`,
        {
          headers: { "Content-Type": "application/json" },
        }
      ).then((p) => p.json());

      await connectToNewPeer(fileSessionRes.ownerId);
      setFilSession(fileSessionRes);
      return fileSessionRes;
    } catch (err) {
      const error = err as Error;
      setError(error);
      message.error("session not found", err);
    }
  };

  const downloadFiles = () =>
    fileSession &&
    sendToConnection(fileSession.ownerId, PeerMessageType.REQ_FILES_DOWNLOAD);

  return {
    fileSession,
    files,
    peers,
    error,
    downloadFiles,
    peerId: peerConn.current?.getId() || "",
  };
};
