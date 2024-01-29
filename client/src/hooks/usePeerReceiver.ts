import { useEffect, useState } from "react";
import { usePeer } from "./usePeer";
import { Room } from "dto/room";
import {
  DataFile,
  DataFileList,
  DataFileListItem,
  FilesDownloadReq,
  PeerMessage,
  ServerMessage,
  SeverMessageDataGetRoomReq,
  SeverMessageDataGetRoomRes,
} from "libs/peer";
import { downloadFile } from "utils/file/download";

interface usePeerReceiverProps {
  roomId: string;
}

export const usePeerReceiver = ({ roomId }: usePeerReceiverProps) => {
  const [files, setFiles] = useState<DataFileListItem[]>([]);
  const [room, setRoom] = useState<Room>();

  const onReceiveMessage = (peerId: string, msg: PeerMessage) => {
    switch (msg.type) {
      case "FILES_LIST_RES": {
        const data = msg.data as DataFileList;
        setFiles(data.items);
        return;
      }

      case "FILES_DOWNLOAD_RES": {
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
    fileProgressMap,
    sendMessageToPeer,
    startSession,
    connectToNewPeer,
    sendMessageToServer,
    toastError,
  } = usePeer({ peerType: "RECEIVER", onReceiveMessage });

  useEffect(() => {
    // load on first render only
    (async () => {
      if (roomId) {
        try {
          await startSession();
          await getRoom();
        } catch (err) {
          toastError(err as Error);
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
        if (message.error) return toastError(new Error(message.error));
        try {
          const room = message.data;
          setRoom(room);
          await connectToNewPeer(room.ownerId);
          await sendMessageToPeer(room.ownerId, { type: "FILES_LIST_REQ" });
        } catch (err) {
          toastError(err as Error);
        }
      }
    );

  const downloadFiles = () =>
    room &&
    sendMessageToPeer(room.ownerId, {
      type: "FILES_DOWNLOAD_REQ",
      data: { files: files.map((f) => f.name) },
    } as FilesDownloadReq);

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
    downloadFiles,
    onRemoveFile,
  };
};
