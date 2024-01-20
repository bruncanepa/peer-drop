import { ChangeEvent, useState } from "react";
import { usePeer } from "./usePeer";
import { FileSession } from "dto/fileSession";
import {
  DataFile,
  DataFileList,
  PeerMessage,
  PeerMessageType,
} from "libs/peer";
import { Message } from "utils/message";

export const usePeerSender = () => {
  const [message] = useState(() => new Message());
  const [files, setFiles] = useState<File[]>([]);
  const [fileSession, setFilSession] = useState<FileSession>();
  const [sendingFiles, setSendingFiles] = useState(false);

  const onReceiveMessage = (peerId: string, msg: PeerMessage) => {
    switch (msg.type) {
      case PeerMessageType.REQ_FILES_DOWNLOAD: {
        setSendingFiles(true);
        const data: DataFile = {
          blob: new Blob([files[0]], { type: files[0].type }),
          name: files[0].name,
          type: files[0].type,
          size: files[0].size,
        };
        return sendToConnection(
          peerId,
          PeerMessageType.RES_FILES_DOWNLOAD,
          data
        )
          ?.then(() => message.info(`Send file ${data.name} successfully`))
          .catch((err) =>
            message.error(`Error sending file ${data.name}:`, err)
          )
          .finally(() => setSendingFiles(false));
      }
      case PeerMessageType.REQ_FILES_LIST: {
        const data: DataFileList = {
          items: files.map((f) => ({
            name: f.name,
            size: f.size,
            type: f.type,
          })),
        };
        return sendToConnection(peerId, PeerMessageType.RES_FILES_LIST, data)
          ?.then(() => message.info("Send file list successfully"))
          .catch((err) => message.error(`Error sending file list:`, err));
      }
    }
  };

  const { peerConn, peers, sendToConnection, startPeerSession } = usePeer({
    peerType: "SENDER",
    onReceiveMessage,
  });

  const createFileSession = async () => {
    try {
      const peerConnCur = await startPeerSession();
      if (!peerConnCur) return;

      const fileSessionRes: FileSession = await fetch(
        "http://localhost:8081/files/sessions",
        {
          method: "POST",
          body: JSON.stringify({ userId: peerConnCur.getId() }),
          headers: { "Content-Type": "application/json" },
        }
      ).then((p) => p.json());

      setFilSession(fileSessionRes);
    } catch (err) {
      message.error("couldn't create file session", err);
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
      .then(() => console.log("Copied URL:", fileSession.id));

  const onRemoveFile = (file: File) => {
    setFiles((fs) => fs.filter((f) => f.name !== file.name));
  };

  return {
    createFileSession,
    fileSession,
    startPeerSession,
    onSelectFiles,
    files,
    peers,
    peerConn,
    sendingFiles,
    copyShareLink,
    onRemoveFile,
  };
};
