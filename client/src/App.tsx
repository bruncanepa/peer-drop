import React, { FC, useEffect, useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import { DataType, PeerConnection } from "libs/peer";
import { log } from "utils/logger";
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
  const [peerList, setPeerList] = useState("");

  const startSession = async () => {
    try {
      const peerConn = new PeerConnection();
      await peerConn.startPeerSession();
      setPeerConn(peerConn);
      peerConn.onIncomingConnection((conn) => {
        const otherPeerId = conn.peer;
        log("Incoming connection: " + otherPeerId);
        peerConn.onConnectionDisconnected(otherPeerId, () => {
          log("Connection closed: " + otherPeerId);
        });
        peerConn.onConnectionReceiveData(otherPeerId, (file) => {
          log("Receiving file " + file.fileName + " from " + otherPeerId);
          if (file.dataType === DataType.FILE) {
            downloadFile(
              file.file as Blob,
              file.fileName || "fileName",
              file.fileType
            );
          }
        });
      });
    } catch (err) {
      log("Error starting session:", err);
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
    if (!peerList.length) {
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
      console.log(err);
      message.error("Error when sending file");
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
          alert("Copied: " + peerConn?.getId());
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

      {loading && <span>Loading...</span>}
    </div>
  );
};

export default App;
