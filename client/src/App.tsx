import { FC, useEffect, useState } from "react";
import "./App.css";
import { DataType, PeerConnection } from "libs/peer";
import { downloadFile } from "utils/file";
import { FileSession, FileSessionShared } from "dto/fileSession";

class Message {
  warning = (...args: any[]) => console.warn(...args);
  info = (...args: any[]) => console.info(...args);
  error = (...args: any[]) => console.error(...args);
}

const App: FC = () => {
  const [peerConn, setPeerConn] = useState<PeerConnection>();
  const [message] = useState(() => new Message());
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>();
  const [peers, setPeers] = useState<string[]>([]);
  const [fileSession, setFilSession] = useState<FileSession | undefined>();
  const [sharedFileSession, setSharedFilSession] = useState<
    FileSessionShared | undefined
  >();
  const sharedSessionIdParam = window.location.pathname.replace("/", "");

  useEffect(() => {
    // RECEIVER
    (async () => {
      if (sharedSessionIdParam) {
        await startSession(sharedSessionIdParam);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // RECEIVER
    // Executed when received shared link
    (async () => {
      if (sharedSessionIdParam && peerConn && !sharedFileSession) {
        const fileSessionRes: FileSessionShared = await fetch(
          `http://localhost:8081/files/sessions/${sharedSessionIdParam}`,
          {
            headers: { "Content-Type": "application/json" },
          }
        ).then((p) => p.json());
        if (!fileSessionRes) return console.log("session not found");

        onConnectNewPeer(fileSessionRes.ownerId);
        setSharedFilSession(fileSessionRes);
        return;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedSessionIdParam, peerConn, sharedFileSession]);

  const startSession = async (sharedSessionId: string) => {
    // BOTH
    try {
      const peerConn = new PeerConnection((peers: string[]) => setPeers(peers));
      await peerConn.startPeerSession();
      setPeerConn(peerConn);
      peerConn.onIncomingConnection((conn) => {
        const connectingPeerId = conn.peer;
        message.info("Incoming connection: " + connectingPeerId);
        listenToNewConnection(peerConn, connectingPeerId);
      });
      if (sharedSessionId) return; // will use useEffect when received shared link

      // SENDER

      const fileSessionRes = await fetch(
        "http://localhost:8081/files/sessions",
        {
          method: "POST",
          body: JSON.stringify({ userId: peerConn.getId() }),
          headers: { "Content-Type": "application/json" },
        }
      ).then((p) => p.json());
      setFilSession(fileSessionRes);
    } catch (err) {
      message.error("Error starting session:", err);
    }
  };

  const onEndedFileSelection = () => {
    // ask a hash to the server that identifies files
  };

  const handleUpload = async () => {
    // SENDER
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

  const onConnectNewPeer = async (id: string) => {
    // BOTH

    if (peerConn) {
      message.info(`connecting with new peer ${id}`);
      await peerConn.connectPeer(id);
      listenToNewConnection(peerConn, id);
      message.info(`connected with new peer ${id}`);
    } else {
      // message.error("start session first");
      throw Error("start session first");
    }
  };

  const listenToNewConnection = (newConn: PeerConnection, id: string) => {
    // BOTH
    newConn.onConnectionDisconnected(id, () => {
      message.info(`connection closed with ${id}`);
    });

    newConn.onConnectionReceiveData(id, (file) => {
      message.info(`receiving file ${file.fileName} from ${id}`);
      if (file.dataType === DataType.FILE) {
        downloadFile(
          file.file as Blob,
          file.fileName || "fileName",
          file.fileType
        );
      } else {
        console.log(`Received message: ${JSON.stringify(file)}`);
      }
    });
  };

  const getShareURL = () => `${window.location.origin}/${fileSession?.id}`;

  const hasStartedSession = Boolean(sharedFileSession || fileSession);

  return (
    <div className="App" style={{ display: "flex", flexDirection: "column" }}>
      {!hasStartedSession && (
        <>
          <h2>Start session to share files</h2>
          <button onClick={() => startSession("")}>Start session</button>
        </>
      )}

      {Boolean(fileSession) && (
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
      )}

      {Boolean(hasStartedSession) && (
        <>
          <h3>Peers</h3>
          <ol>
            {peers.map((peer) => (
              <li key={peer}>{peer}</li>
            ))}
          </ol>
        </>
      )}

      {Boolean(fileSession) && (
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
      )}

      {Boolean(sharedFileSession) && (
        <>
          <h3>Files to download</h3>
          <ol>
            {files?.map((file) => (
              <li key={file.name}>{file.name}</li>
            ))}
          </ol>
          <button onClick={() => {}}>Download</button>
        </>
      )}
      {loading && <span>Loading...</span>}
    </div>
  );
};

export default App;
