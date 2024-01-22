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
import { FetchLogger, Logger } from "utils/logger";
import { downloadFile } from "utils/file";

interface usePeerReceiverProps {
  sharedId: string;
}

export const usePeerReceiver = ({ sharedId }: usePeerReceiverProps) => {
  const [files, setFiles] = useState<DataFileListeItem[]>([]);
  const [fileSession, setFilSession] = useState<FileSessionShared>();
  const [error, setError] = useState<Error>();

  const onReceiveMessage = (peerId: string, msg: PeerMessage) => {
    switch (msg.type) {
      case PeerMessageType.RES_FILES_LIST: {
        const data = msg.data as DataFileList;
        setFiles(data.items);
        return Logger.info(`Received file list from ${peerId} successfully`);
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

  const { myPeer, peers, sendMessageToPeer, startSession, connectToNewPeer } =
    usePeer({
      peerType: "RECEIVER",
      onReceiveMessage,
    });

  useEffect(() => {
    // load on first render only
    (async () => {
      if (sharedId) {
        await startSession();
        const fs = await getFileSession();
        if (fs) {
          const log = new FetchLogger(
            `Send message ${PeerMessageType.REQ_FILES_LIST} to ${fs.ownerId}`
          );
          log.start();
          sendMessageToPeer(fs.ownerId, {
            type: PeerMessageType.REQ_FILES_LIST,
          })
            .then(log.success)
            .catch(log.error);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      Logger.error("session not found", err);
    }
  };

  const downloadFiles = () =>
    fileSession &&
    sendMessageToPeer(fileSession.ownerId, {
      type: PeerMessageType.REQ_FILES_DOWNLOAD,
    });

  return {
    fileSession,
    files,
    peers,
    error,
    downloadFiles,
    peerId: myPeer.id,
  };
};
