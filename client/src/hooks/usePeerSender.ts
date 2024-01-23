import { ChangeEvent, useRef, useState } from "react";
import { usePeer } from "./usePeer";
import { FileSession } from "dto/fileSession";
import {
  DataFile,
  DataFileList,
  DataFileListItem,
  PeerMessage,
  PeerMessageType,
} from "libs/peer";
import { Logger } from "utils/logger";

export const usePeerSender = () => {
  const filesRef = useRef<File[]>([]);
  const [fileSession, setFilSession] = useState<FileSession>();
  const [sendingFiles, setSendingFiles] = useState(false);

  const onReceiveMessage = (peerId: string, msg: PeerMessage) => {
    switch (msg.type) {
      case PeerMessageType.FILES_DOWNLOAD_REQ: {
        setSendingFiles(true);
        const file = filesRef.current[0];
        return sendMessageToPeer(peerId, {
          type: PeerMessageType.FILES_DOWNLOAD_RES,
          data: {
            blob: new Blob([file], { type: file.type }),
            name: file.name,
            type: file.type,
            size: file.size,
          } as DataFile,
        }).finally(() => setSendingFiles(false));
      }
      case PeerMessageType.FILES_LIST_REQ: {
        return sendMessageToPeer(peerId, {
          type: PeerMessageType.FILES_LIST_RES,
          data: {
            items: filesRef.current.map((f) => ({
              name: f.name,
              size: f.size,
              type: f.type,
            })),
          } as DataFileList,
        });
      }
    }
  };

  const { myId, peers, sendMessageToPeer, startSession, activityLogs } =
    usePeer({ peerType: "SENDER", onReceiveMessage });

  const createFileSession = async () => {
    try {
      const userId = await startSession();

      const fileSessionRes: FileSession = await fetch(
        "http://localhost:8081/files/sessions",
        {
          method: "POST",
          body: JSON.stringify({ userId }),
          headers: { "Content-Type": "application/json" },
        }
      ).then((p) => p.json());

      setFilSession(fileSessionRes);
    } catch (err) {
      Logger.error("couldn't create file session", err);
    }
  };

  const onSelectFiles = (event: ChangeEvent<HTMLInputElement>) => {
    filesRef.current = Array.from(event.target.files || []);
    createFileSession();
  };

  const copyShareLink = () =>
    fileSession &&
    navigator.clipboard
      .writeText(`${window.location.origin}/${fileSession.id}`)
      .then(() => Logger.info("Copied URL:", fileSession.id));

  const onRemoveFile = (file: DataFileListItem) => {
    filesRef.current = filesRef.current.filter((f) => f.name !== file.name);
  };

  return {
    myId,
    peers,
    files: filesRef.current,
    fileSession,
    sendingFiles,
    activityLogs,
    startSession,
    onSelectFiles,
    copyShareLink,
    onRemoveFile,
  };
};
