import { ChangeEvent, useState } from "react";
import { usePeer } from "./usePeer";
import { Room } from "dto/server";
import {
  DataFile,
  DataFileList,
  DataFileListItem,
  FilesDownloadReq,
  PeerMessage,
} from "dto/peer";
import { useUpdatableRef } from "./useUpdatableRef";
import { useToast } from "./useToast";
import {
  ServerMessage,
  SeverMessageDataCreateRoomReq,
  SeverMessageDataCreateRoomRes,
} from "dto/server";
import { ImmutableArray } from "utils/array";
import { genUUID } from "utils/id";

export const usePeerSender = () => {
  const toast = useToast();
  const [filesRef, updateFilesRef] = useUpdatableRef<
    { id: string; file: File }[]
  >([]);
  const [room, setRoom] = useState<Room>();

  const onFileTransferEnd = (peerId?: string) => {
    toast.success(
      `Transfer to '${peersAliasesRef.current[peerId || ""]}' success`
    );
  };

  const _sendFileListRes = (...peerIds: string[]) =>
    peerIds.map((peerId) =>
      sendMessageToPeer(peerId, {
        type: "FILES_LIST_RES",
        data: {
          items: filesRef.current.map(({ file, id }) => ({
            id,
            name: file.name,
            size: file.size,
            type: file.type,
          })),
        } as DataFileList,
      })
    );

  const onReceiveMessage = (peerId: string, msg: PeerMessage) => {
    switch (msg.type) {
      case "FILES_TRANSFER_REQ": {
        const { data } = msg as FilesDownloadReq;
        toast.info(
          `Transfer for ${data.files.length} file/s to ${peersAliasesRef.current[peerId]} started`
        );
        Object.values(filesRef.current)
          .filter(({ id }) => data.files.includes(id))
          .forEach(({ file, id }) => {
            sendMessageToPeer(peerId, {
              type: "FILES_TRANSFER_RES",
              data: {
                id,
                blob: new Blob([file], { type: file.type }),
                name: file.name,
                type: file.type,
                size: file.size,
              } as DataFile,
            });
          });
        return;
      }
      case "FILES_LIST_REQ": {
        return _sendFileListRes(peerId);
      }
    }
  };

  const {
    myId,
    peers,
    activityLogs,
    peersAliasesRef,
    sendMessageToPeer,
    startSession,
    sendMessageToServer,
  } = usePeer({ peerType: "SENDER", onReceiveMessage, onFileTransferEnd });

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
      toast.error(err as Error, "couldn't create room");
    }
  };

  const onSelectFiles = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      updateFilesRef(
        ImmutableArray.push(
          filesRef.current,
          ...Array.from(event.target.files).map((file) => ({
            id: genUUID(),
            file,
          }))
        )
      );
      if (room) {
        _sendFileListRes(...peers);
      } else {
        createRoom();
      }
    }
  };

  const onRemoveFile = (fileRemoved: DataFileListItem[]) => {
    updateFilesRef(
      ImmutableArray.remove(
        filesRef.current,
        (file) => file.id !== fileRemoved[0].id
      )
    );
    _sendFileListRes(...peers);
  };

  const copyShareLink = () => {
    if (room) {
      navigator.clipboard
        .writeText(`${window.location.origin}/${room.id}`)
        .then(() => toast.info("Room's link copied into clipboard!"))
        .catch((err) =>
          toast.error(err, "Couldn't copy link. Try again please!")
        );
    }
  };

  return {
    myId,
    peers,
    files: filesRef.current,
    room,
    activityLogs,
    peersAliases: peersAliasesRef.current,
    startSession,
    onSelectFiles,
    copyShareLink,
    onRemoveFile,
  };
};
