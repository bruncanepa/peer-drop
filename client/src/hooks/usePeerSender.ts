import { ChangeEvent, useRef, useState } from "react";
import { usePeer } from "./usePeer";
import { Room } from "dto/room";
import {
  DataFile,
  DataFileList,
  DataFileListItem,
  PeerMessage,
  PeerMessageType,
  ServerMessage,
  SeverMessageDataCreateRoomReq,
  SeverMessageDataCreateRoomRes,
} from "libs/peer";
import { Logger } from "utils/logger";

export const usePeerSender = () => {
  const filesRef = useRef<File[]>([]);
  const [room, setRoom] = useState<Room>();
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

  const {
    myId,
    peers,
    activityLogs,
    fileProgress,
    sendMessageToPeer,
    startSession,
    addActivityLog,
    sendMessageToServer,
  } = usePeer({ peerType: "SENDER", onReceiveMessage });

  const createRoom = async () => {
    try {
      const userId = await startSession();

      await sendMessageToServer<
        SeverMessageDataCreateRoomReq,
        SeverMessageDataCreateRoomRes
      >(
        "CREATE_ROOM_REQUESTED",
        { type: "CREATE_ROOM", data: { userId } },
        (message: ServerMessage<SeverMessageDataCreateRoomRes>) =>
          setRoom(message.data)
      );
    } catch (err) {
      Logger.error("couldn't create file session", err);
    }
  };

  const onSelectFiles = (event: ChangeEvent<HTMLInputElement>) => {
    filesRef.current = Array.from(event.target.files || []);
    createRoom();
  };

  const copyShareLink = () =>
    room &&
    navigator.clipboard
      .writeText(`${window.location.origin}/${room.id}`)
      .then(() => addActivityLog({ type: "COPY_SHARE_URL" }));

  const onRemoveFile = (file: DataFileListItem) => {
    filesRef.current = filesRef.current.filter((f) => f.name !== file.name);
  };

  return {
    myId,
    peers,
    files: filesRef.current,
    fileSession: room,
    sendingFiles,
    activityLogs,
    sendingFileProgress: fileProgress,
    startSession,
    onSelectFiles,
    copyShareLink,
    onRemoveFile,
  };
};
