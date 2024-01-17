import { FC, useEffect, useState } from "react";
import { FileSessionShared } from "dto/fileSession";
import { usePeer } from "hooks/usePeer";
import { Peers } from "./Peers";
import { Message } from "utils/message";

interface ReceiverProps {
  sharedId: string;
}

const Receiver: FC<ReceiverProps> = ({ sharedId }) => {
  const [message] = useState(() => new Message());
  const { peerConn, peers, startPeerSession, connectToNewPeer } = usePeer();
  const [sharedFileSession, setSharedFilSession] =
    useState<FileSessionShared>();
  const [files, setFiles] = useState<File[]>([]);

  const createFileSession = async () => {
    try {
      const fileSessionRes: FileSessionShared = await fetch(
        `http://localhost:8081/files/sessions/${sharedId}`,
        {
          headers: { "Content-Type": "application/json" },
        }
      ).then((p) => p.json());

      connectToNewPeer(fileSessionRes.ownerId);
      setSharedFilSession(fileSessionRes);
    } catch (err) {
      message.error("session not found", err);
    }
  };

  useEffect(() => {
    // load on first render only
    if (sharedId) {
      startPeerSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // load when new peer connection set
    if (peerConn && !sharedFileSession) {
      createFileSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerConn, sharedFileSession]);

  if (!Boolean(sharedFileSession)) return null;

  return (
    <>
      <h3>Files to download</h3>

      {files.length ? (
        <>
          <ol>
            {files.map((file) => (
              <li key={file.name}>{file.name}</li>
            ))}
          </ol>
          <button onClick={() => {}}>Download</button>
        </>
      ) : (
        <span>No files</span>
      )}

      <Peers items={peers} />
    </>
  );
};

export default Receiver;
