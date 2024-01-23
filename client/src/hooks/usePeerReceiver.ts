import { useEffect, useState } from "react";
import { usePeer } from "./usePeer";
import { FileSessionShared } from "dto/fileSession";
import {
  DataFile,
  DataFileList,
  DataFileListItem,
  PeerMessage,
  PeerMessageType,
} from "libs/peer";
import { FetchLogger, Logger } from "utils/logger";
import { downloadFile } from "utils/file";

interface usePeerReceiverProps {
  sharedId: string;
}

export const usePeerReceiver = ({ sharedId }: usePeerReceiverProps) => {
  const [files, setFiles] = useState<DataFileListItem[]>([]);
  const [fileSession, setFilSession] = useState<FileSessionShared>();
  const [error, setError] = useState<Error>();

  const onReceiveMessage = (peerId: string, msg: PeerMessage) => {
    switch (msg.type) {
      case PeerMessageType.FILES_LIST_RES: {
        const data = msg.data as DataFileList;
        setFiles(data.items);
        return;
      }

      case PeerMessageType.FILES_DOWNLOAD_RES: {
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
    myId,
    peers,
    sendMessageToPeer,
    startSession,
    connectToNewPeer,
    activityLogs,
  } = usePeer({
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
          sendMessageToPeer(fs.ownerId, {
            type: PeerMessageType.FILES_LIST_REQ,
          });
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

      setFilSession(fileSessionRes);
      await connectToNewPeer(fileSessionRes.ownerId);
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
      type: PeerMessageType.FILES_DOWNLOAD_REQ,
    });

  return {
    myId,
    fileSession,
    files,
    peers,
    error,
    activityLogs,
    downloadFiles,
  };
};
