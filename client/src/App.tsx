import { FC, useState } from "react";
import "./App.css";
import { DataType, PeerConnection } from "libs/peer";
import { downloadFile } from "utils/file";

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
  const [newPeerId, setNewPeerId] = useState("");

  const startSession = async () => {
    try {
      const peerConn = new PeerConnection(
        (peers: string[], newPeerId?: string) => {
          setPeers(peers);
          if (newPeerId) listenToNewConnection(newPeerId);
        }
      );
      await peerConn.startPeerSession();
      setPeerConn(peerConn);
      peerConn.onIncomingConnection((conn) => {
        const connectingPeerId = conn.peer;
        message.info("Incoming connection: " + connectingPeerId);
      });
    } catch (err) {
      message.error("Error starting session:", err);
    }
  };

  const onEndedFileSelection = () => {
    // ask a hash to the server that identifies files
  };

  const handleUpload = async () => {
    if (!files) {
      message.warning("Please select file");
      return;
    }
    if (!peers.length) {
      message.warning("Please select a connection");
      return;
    }
    try {
      setLoading(true);
      // const blob = new Blob([files], { type: files.type });

      // await peerConn.sendConnection(otherPeerId, {
      //   dataType: DataType.FILE,
      //   file: blob,
      //   fileName: file.name,
      //   fileType: file.type,
      // });
      setLoading(false);
      message.info("Send file successfully");
    } catch (err) {
      setLoading(false);
      message.error("Error when sending file");
    }
  };

  const onConnectNewPeer = async (id: string) => {
    if (peerConn) {
      message.info(`connecting with new peer ${id}`);
      await peerConn.connectPeer(id);
      message.info(`connected with new peer ${id}`);
    } else {
      message.error("start session first");
    }
  };

  const listenToNewConnection = (id: string) => {
    if (peerConn) {
      peerConn.onConnectionDisconnected(id, () => {
        message.info(`connection closed with ${id}`);
      });

      peerConn.onConnectionReceiveData(id, (file) => {
        message.info(`receiving file ${file.fileName} from ${id}`);
        if (file.dataType === DataType.FILE) {
          // download(file.file || "", file.fileName || "fileName", file.fileType);
        }
      });
    }
  };

  return (
    <div className="App" style={{ display: "flex", flexDirection: "column" }}>
      <h3>
        {peerConn
          ? `Your id: ${peerConn?.getId()}`
          : "Start session to get your id"}
      </h3>
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(peerConn?.getId() || "");
          message.info("Copied: " + peerConn?.getId());
        }}
      >
        Copy
      </button>
      <button onClick={startSession}>Start session</button>

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

      <h3>Peers</h3>
      <input
        placeholder={"New Peer ID"}
        onChange={(e) => setNewPeerId(e.target.value)}
        required
      />
      <button onClick={() => onConnectNewPeer(newPeerId)}>Connect</button>
      <ol>
        {peers.map((peer) => (
          <li key={peer}>{peer}</li>
        ))}
      </ol>

      {loading && <span>Loading...</span>}
    </div>
  );
};

export default App;
