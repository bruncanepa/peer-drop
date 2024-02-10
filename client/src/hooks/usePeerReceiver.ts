import { useEffect, useState } from "react";
import { unpack } from "peerjs-js-binarypack";
import { usePeer } from "./usePeer";
import { Room } from "dto/server";
import {
  DataFile,
  DataFileList,
  DataFileListItem,
  FilesDownloadReq,
  PeerAliasReq,
  PeerMessage,
} from "dto/peer";
import { downloadFile } from "utils/file/download";
import { useToast } from "./useToast";
import {
  ServerMessage,
  SeverMessageDataGetRoomReq,
  SeverMessageDataGetRoomRes,
} from "dto/server";
import { useUpdatableRef } from "./useUpdatableRef";
import { ImmutableArray } from "utils/array";
import { useMultipleProgress } from "./useMultipleProgess";
import { Chunk, PEERJS_CHUNK_SIZE } from "libs/peer";

interface usePeerReceiverProps {
  roomId: string;
}

export const usePeerReceiver = ({ roomId }: usePeerReceiverProps) => {
  const toast = useToast();
  const [myAlias, setMyAlias] = useState("");
  const [files, setFiles] = useState<DataFileListItem[]>([]);
  const [roomRef, setRoomRef] = useUpdatableRef<Room | null>(null);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [downloadClickedRef, setDownloadClickedRef] = useUpdatableRef(false);
  const { progressMap, onProgress } = useMultipleProgress(
    files.filter((f) => f.selected).length,
    () => {
      if (roomRef.current) {
        const msg: PeerMessage = { type: "FILES_TRANSFER_END" };
        sendMessageToPeer(roomRef.current.ownerId, msg);
        toast.success(`Transfer success`);
      }
    }
  );
  const [filesMapByTransferIdRef, updateFilesMapByTransferIdRef] =
    useUpdatableRef(getFilesMapByTransferId(files));

  useEffect(() => {
    updateFilesMapByTransferIdRef(getFilesMapByTransferId(files));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  const onReceiveMessage = (peerId: string, msg: PeerMessage) => {
    if (peerId === roomRef.current?.ownerId) {
      switch (msg.type) {
        case "FILES_LIST_RES": {
          if (!downloadClickedRef.current) {
            const data = msg.data as DataFileList;
            setFiles(data.items);
          }
          return;
        }

        case "FILES_TRANSFER_RES": {
          setDownloadClickedRef(true);
          const data = msg.data as DataFile;
          return downloadFile(
            data.blob as Blob,
            data.name || "fileName",
            data.type
          );
        }

        case "SET_PEER_ALIAS": {
          const data = msg.data as PeerAliasReq;
          return setMyAlias(data.alias);
        }
      }
    }
  };

  const onFileTransferEnd = () => {
    if (roomRef.current) {
      const msg: PeerMessage = { type: "FILES_TRANSFER_END" };
      sendMessageToPeer(roomRef.current.ownerId, msg);
      toast.success(`Transfer success`);
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
  } = usePeer({ peerType: "RECEIVER", onReceiveMessage, onFileTransferEnd });

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

  const onFileTransferProgress = (event: MessageEvent) => {
    const message = unpack<Chunk | PeerMessage>(event.data);
    if (message.__peerData && message.total) {
      const chunk = message as Chunk;
      const xPercentage = Math.trunc(chunk.total * 0.05);
      const isLastChunk = chunk.n === chunk.total - 1; // first chunk.n is value 0
      if (isLastChunk || chunk.n % xPercentage === 0) {
        // update every 5% progress or when completed
        onProgress(
          filesMapByTransferIdRef.current[chunk.__peerData],
          chunk.n + 1,
          chunk.total
        );
      }
    } else {
      const peerMsg = message as PeerMessage;
      if (peerMsg.type === "FILES_TRANSFER_RES") {
        // when files are smaller than minimum chunk size
        const data = peerMsg.data as DataFile;
        onProgress(data.id, 100, 100);
      }
    }
  };

  const getRoom = () =>
    sendMessageToServer<SeverMessageDataGetRoomReq, SeverMessageDataGetRoomRes>(
      "GET_ROOM_REQUESTED",
      { type: "GET_ROOM", data: { roomId } },
      async (message: ServerMessage<SeverMessageDataGetRoomRes>) => {
        if (message.error) return setLoadingRoom(false);
        const room = message.data;
        setRoomRef(room);
        await connectToNewPeer(room.ownerId, onFileTransferProgress);
        await sendMessageToPeer(room.ownerId, { type: "FILES_LIST_REQ" });
        setLoadingRoom(false);
      }
    );

  const onDownload = () => {
    if (roomRef.current) {
      sendMessageToPeer(roomRef.current.ownerId, {
        type: "FILES_TRANSFER_REQ",
        data: { files: files.filter((f) => f.selected).map((f) => f.id) },
      } as FilesDownloadReq);
    }
  };

  const onSelectFile = (files: DataFileListItem[], selectAllValue?: boolean) =>
    setFiles((fs) =>
      files.length === 1
        ? ImmutableArray.update(
            fs,
            { ...files[0], selected: !files[0].selected },
            "id"
          )
        : fs.map((f) => ({ ...f, selected: selectAllValue }))
    );

  const roomOnwerPeer = peers.length ? peers[0] : undefined;

  return {
    myId,
    myAlias,
    room: roomRef.current,
    files,
    roomOnwerPeer,
    activityLogs,
    downloadFileProgressMap: progressMap,
    downloadButtonClicked: downloadClickedRef.current,
    isLoadingRoom: loadingRoom,
    onDownload,
    onSelectFile,
  };
};

const getFilesMapByTransferId = (fs: DataFileListItem[]) => {
  const map: Record<string, string> = {};
  const selected = fs.filter((f) => f.selected);
  let transferId = 1;
  for (let i = 0; i < selected.length; i++) {
    const file = selected[i];
    if (file.size > PEERJS_CHUNK_SIZE) {
      map[transferId++] = file.id;
    }
  }
  return map;
};
