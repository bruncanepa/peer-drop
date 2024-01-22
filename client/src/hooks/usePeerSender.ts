import { ChangeEvent, useState } from "react";
import { usePeer } from "./usePeer";
import { FileSession } from "dto/fileSession";
import {
  DataFile,
  DataFileList,
  PeerMessage,
  PeerMessageType,
} from "libs/peer";
import { Logger } from "utils/logger";

export const usePeerSender = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [fileSession, setFilSession] = useState<FileSession>();
  const [sendingFiles, setSendingFiles] = useState(false);

  const onReceiveMessage = (peerId: string, msg: PeerMessage) => {
    switch (msg.type) {
      case PeerMessageType.REQ_FILES_DOWNLOAD: {
        setSendingFiles(true);
        const file = files[0];
        return sendMessageToPeer(peerId, {
          type: PeerMessageType.RES_FILES_DOWNLOAD,
          data: {
            blob: new Blob([file], { type: file.type }),
            name: file.name,
            type: file.type,
            size: file.size,
          } as DataFile,
        })
          .then(() => Logger.info(`Send file ${file.name} successfully`))
          .catch((err) => Logger.error(`Error sending file ${file.name}:`, err))
          .finally(() => setSendingFiles(false));
      }
      case PeerMessageType.REQ_FILES_LIST: {
        return sendMessageToPeer(peerId, {
          type: PeerMessageType.RES_FILES_LIST,
          data: {
            items: files.map((f) => ({
              name: f.name,
              size: f.size,
              type: f.type,
            })),
          } as DataFileList,
        })
          .then(() => Logger.info("Send file list successfully"))
          .catch((err) => Logger.error(`Error sending file list:`, err));
      }
    }
  };

  const { myPeer, peers, sendMessageToPeer, startSession } = usePeer({
    peerType: "SENDER",
    onReceiveMessage,
  });

  const createFileSession = async () => {
    try {
      await startSession();

      const fileSessionRes: FileSession = await fetch(
        "http://localhost:8081/files/sessions",
        {
          method: "POST",
          body: JSON.stringify({ userId: myPeer.id }),
          headers: { "Content-Type": "application/json" },
        }
      ).then((p) => p.json());

      setFilSession(fileSessionRes);
    } catch (err) {
      Logger.error("couldn't create file session", err);
    }
  };

  const onSelectFiles = (event: ChangeEvent<HTMLInputElement>) => {
    setFiles(Array.from(event.target.files || []));
    createFileSession();
  };

  const copyShareLink = () =>
    fileSession &&
    navigator.clipboard
      .writeText(`${window.location.origin}/${fileSession.id}`)
      .then(() => Logger.info("Copied URL:", fileSession.id));

  const onRemoveFile = (file: File) => {
    setFiles((fs) => fs.filter((f) => f.name !== file.name));
  };

  return {
    peerId: myPeer.id,
    peers,
    files,
    fileSession,
    sendingFiles,
    startSession,
    onSelectFiles,
    copyShareLink,
    onRemoveFile,
  };
};
