import { useEffect, useState } from "react";
import { usePeer } from "./usePeer";
import { Room } from "dto/room";
import {
  DataFile,
  DataFileList,
  DataFileListItem,
  PeerMessage,
  PeerMessageType,
  ServerMessage,
  SeverMessageDataGetRoomReq,
  SeverMessageDataGetRoomRes,
} from "libs/peer";
import { downloadFile } from "utils/file";

interface usePeerReceiverProps {
  roomId: string;
}

export const usePeerReceiver = ({ roomId }: usePeerReceiverProps) => {
  const [files, setFiles] = useState<DataFileListItem[]>([]);
  const [room, setRoom] = useState<Room>();
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
    sendMessageToServer,
  } = usePeer({
    peerType: "RECEIVER",
    onReceiveMessage,
  });

  useEffect(() => {
    // load on first render only
    (async () => {
      if (roomId) {
        try {
          await startSession();
          const room = await getRoom();
          sendMessageToPeer(room.ownerId, {
            type: PeerMessageType.FILES_LIST_REQ,
          });
        } catch (err) {
          setError(err as Error);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getRoom = (): Promise<Room> => {
    return new Promise((resolve, reject) => {
      sendMessageToServer<
        SeverMessageDataGetRoomReq,
        SeverMessageDataGetRoomRes
      >(
        "CREATE_ROOM_REQUESTED",
        { type: "GET_ROOM", data: { roomId } },
        (message: ServerMessage<SeverMessageDataGetRoomRes>) => {
          if (message.error) return reject(new Error(message.error));
          const room = message.data;
          setRoom(room);
          connectToNewPeer(room.ownerId)
            .then(() => resolve(room))
            .catch((err) => {
              const error = err as Error;
              setError(error);
              reject(err);
            });
        }
      );
    });
  };

  const downloadFiles = () =>
    room &&
    sendMessageToPeer(room.ownerId, {
      type: PeerMessageType.FILES_DOWNLOAD_REQ,
    });

  const onRemoveFile = (file: DataFileListItem) => {
    setFiles((fs) => fs.filter((f) => f.name !== file.name));
  };

  return {
    myId,
    room,
    files,
    peers,
    error,
    activityLogs,
    downloadFiles,
    onRemoveFile,
  };
};
