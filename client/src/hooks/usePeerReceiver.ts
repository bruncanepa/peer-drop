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
    activityLogs,
    sendMessageToPeer,
    startSession,
    connectToNewPeer,
    addActivityLog,
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
      addActivityLog({ type: "CREATE_FILE_SESSION_REQUESTED" });
      const fileSessionRes: FileSessionShared = await fetch(
        `http://localhost:8081/files/sessions/${sharedId}`,
        {
          headers: { "Content-Type": "application/json" },
        }
      ).then((p) => p.json());
      addActivityLog({ type: "CREATE_FILE_SESSION_OK" });

      setFilSession(fileSessionRes);
      await connectToNewPeer(fileSessionRes.ownerId);
      return fileSessionRes;
    } catch (err) {
      const error = err as Error;
      setError(error);
      addActivityLog({ type: "CREATE_FILE_SESSION_ERROR" });
    }
  };

  const downloadFiles = () =>
    fileSession &&
    sendMessageToPeer(fileSession.ownerId, {
      type: PeerMessageType.FILES_DOWNLOAD_REQ,
    });

  const onRemoveFile = (file: DataFileListItem) => {
    setFiles((fs) => fs.filter((f) => f.name !== file.name));
  };

  return {
    myId,
    fileSession,
    files,
    peers,
    error,
    activityLogs,
    downloadFiles,
    onRemoveFile,
  };
};
