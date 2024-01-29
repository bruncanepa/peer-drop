import { ChangeEvent, useState } from "react";
import { usePeer } from "./usePeer";
import { Room } from "dto/room";
import {
  DataFile,
  DataFileList,
  DataFileListItem,
  FilesDownloadReq,
  PeerMessage,
  ServerMessage,
  SeverMessageDataCreateRoomReq,
  SeverMessageDataCreateRoomRes,
} from "libs/peer";
import { Logger } from "utils/logger";
import { useUpdatableRef } from "./useUpdatableRef";

export const usePeerSender = () => {
  const [filesRef, updateFilesRef] = useUpdatableRef<File[]>([]);
  const [room, setRoom] = useState<Room>();

  const onReceiveMessage = (peerId: string, msg: PeerMessage) => {
    switch (msg.type) {
      case "FILES_DOWNLOAD_REQ": {
        const { data } = msg as FilesDownloadReq;
        filesRef.current
          .filter((f) => data.files.includes(f.name))
          .forEach((file, id) => {
            sendMessageToPeer(peerId, {
              type: "FILES_DOWNLOAD_RES",
              data: {
                blob: new Blob([file], { type: file.type }),
                name: file.name,
                type: file.type,
                size: file.size,
                id: `${id + 1}`,
              } as DataFile,
            });
          });
        return;
      }
      case "FILES_LIST_REQ": {
        return sendMessageToPeer(peerId, {
          type: "FILES_LIST_RES",
          data: {
            items: filesRef.current.map((f, i) => ({
              name: f.name,
              size: f.size,
              type: f.type,
              id: `${i + 1}`,
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
    sendMessageToPeer,
    startSession,
    addActivityLog,
    sendMessageToServer,
  } = usePeer({ peerType: "SENDER", onReceiveMessage });

  const createRoom = async () => {
    try {
      const userId = await startSession();
      sendMessageToServer<
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
    updateFilesRef(Array.from(event.target.files || []));
    createRoom();
  };

  const copyShareLink = () =>
    room &&
    navigator.clipboard
      .writeText(`${window.location.origin}/${room.id}`)
      .then(() => addActivityLog({ type: "COPY_SHARE_URL" }));

  const onRemoveFile = (file: DataFileListItem) => {
    updateFilesRef(filesRef.current.filter((f) => f.name !== file.name));
  };

  return {
    myId,
    peers,
    files: filesRef.current,
    fileSession: room,
    activityLogs,
    startSession,
    onSelectFiles,
    copyShareLink,
    onRemoveFile,
  };
};
