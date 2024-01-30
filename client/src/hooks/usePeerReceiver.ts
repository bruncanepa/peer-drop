import { useEffect, useState } from "react";
import { usePeer } from "./usePeer";
import { Room } from "dto/server";
import {
  DataFile,
  DataFileList,
  DataFileListItem,
  FilesDownloadReq,
  PeerMessage,
} from "dto/peer";
import { downloadFile } from "utils/file/download";
import { useToast } from "./useToast";
import {
  ServerMessage,
  SeverMessageDataGetRoomReq,
  SeverMessageDataGetRoomRes,
} from "dto/server";

interface usePeerReceiverProps {
  roomId: string;
}

export const usePeerReceiver = ({ roomId }: usePeerReceiverProps) => {
  const [files, setFiles] = useState<DataFileListItem[]>([]);
  const [room, setRoom] = useState<Room>();
  const [downloaded, setDownloaded] = useState(false);
  const toast = useToast();

  const onReceiveMessage = (peerId: string, msg: PeerMessage) => {
    switch (msg.type) {
      case "FILES_LIST_RES": {
        const data = msg.data as DataFileList;
        setFiles(data.items);
        return;
      }

      case "FILES_TRANSFER_RES": {
        setDownloaded(true);
        const data = msg.data as DataFile;
        return downloadFile(
          data.blob as Blob,
          data.name || "fileName",
          data.type
        );
      }
    }
  };

  const onFileTransferEnd = () => {
    const msg: PeerMessage = { type: "FILES_TRANSFER_END" };
    if (room) sendMessageToPeer(room.ownerId, msg);
    toast.success(`Transfer success`);
  };

  const {
    myId,
    peers,
    activityLogs,
    fileProgressMap,
    sendMessageToPeer,
    startSession,
    connectToNewPeer,
    sendMessageToServer,
  } = usePeer({
    peerType: "RECEIVER",
    filesCount: files.length,
    onReceiveMessage,
    onFileTransferEnd,
  });

  useEffect(() => {
    // load on first render only
    (async () => {
      if (roomId) {
        try {
          await startSession();
          await getRoom();
        } catch (err) {
          toast.error(err as Error, "error getting room");
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getRoom = () =>
    sendMessageToServer<SeverMessageDataGetRoomReq, SeverMessageDataGetRoomRes>(
      "GET_ROOM_REQUESTED",
      { type: "GET_ROOM", data: { roomId } },
      async (message: ServerMessage<SeverMessageDataGetRoomRes>) => {
        if (message.error) return toast.error(new Error(message.error));
        const room = message.data;
        setRoom(room);
        await connectToNewPeer(room.ownerId);
        await sendMessageToPeer(room.ownerId, { type: "FILES_LIST_REQ" });
      }
    );

  const downloadFiles = () => {
    if (room) {
      sendMessageToPeer(room.ownerId, {
        type: "FILES_TRANSFER_REQ",
        data: { files: files.map((f) => f.name) },
      } as FilesDownloadReq);
    }
  };

  const onRemoveFile = (file: DataFileListItem) =>
    setFiles((fs) =>
      fs
        .filter((f) => f.name !== file.name)
        .map((f, id) => ({ ...f, id: `${id + 1}` }))
    );

  return {
    myId,
    room,
    files,
    peers,
    activityLogs,
    downloadFileProgressMap: fileProgressMap,
    downloaded,
    downloadFiles,
    onRemoveFile,
  };
};
