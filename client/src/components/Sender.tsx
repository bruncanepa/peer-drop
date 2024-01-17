import { FC, useEffect, useState } from "react";
import { DataType } from "libs/peer";
import { FileSession } from "dto/fileSession";
import { Message } from "utils/message";
import { usePeer } from "hooks/usePeer";
import { Peers } from "./Peers";

interface SenderProps {}

const Sender: FC<SenderProps> = () => {
  const [message] = useState(() => new Message());
  const { peerConn, peers, startPeerSession } = usePeer();
  const [files, setFiles] = useState<File[]>();
  const [fileSession, setFilSession] = useState<FileSession>();
  const [loading, setLoading] = useState(false);

  const createFileSession = async () => {
    try {
      const fileSessionRes = await fetch(
        "http://localhost:8081/files/sessions",
        {
          method: "POST",
          body: JSON.stringify({ userId: peerConn?.getId() }),
          headers: { "Content-Type": "application/json" },
        }
      ).then((p) => p.json());

      setFilSession(fileSessionRes);
    } catch (err) {
      message.error("couldn't create file session", err);
    }
  };

  const handleUpload = async () => {
    if (!files) {
      return message.warning("Please select file");
    }
    if (!peers.length) {
      return message.warning("Please select a connection");
    }
    if (!peerConn) {
      return message.warning("Please start a session");
    }
    try {
      setLoading(true);
      const blob = new Blob([files[0]], { type: files[0].type });

      await peerConn.sendConnection(peers[0], {
        dataType: DataType.FILE,
        file: blob,
        fileName: files[0].name,
        fileType: files[0].type,
      });
      setLoading(false);
      message.info("Send file successfully");
    } catch (err) {
      setLoading(false);
      message.error("Error when sending file");
    }
  };

  const getShareURL = () => `${window.location.origin}/${fileSession?.id}`;

  useEffect(() => {
    if (peerConn && !fileSession) {
      createFileSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileSession, peerConn]);

  if (!fileSession) {
    return (
      <>
        <h2>Start session to share files</h2>
        <button onClick={() => startPeerSession()}>Start session</button>
      </>
    );
  }

  return (
    <>
      <>
        <h3>Copy to share files: {getShareURL()}</h3>
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(getShareURL() || "");
            message.info("Copied: " + getShareURL());
          }}
        >
          Copy link
        </button>
      </>

      <>
        <h3>Select files</h3>
        <input
          type="file"
          multiple
          onChange={(event) => {
            setFiles(Array.from(event.target.files || []));
          }}
        />
        <ol>
          {files?.map((file) => (
            <li key={file.name}>{file.name}</li>
          ))}
        </ol>
        <button onClick={() => handleUpload()}>Send files</button>
      </>

      <Peers items={peers} />

      {loading && <span>Loading...</span>}
    </>
  );
};

export default Sender;
