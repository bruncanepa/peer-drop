import { FC } from "react";
import { Peers } from "./Peers";
import { usePeerSender } from "hooks/usePeerSender";

interface SenderProps {}

const Sender: FC<SenderProps> = () => {
  const {
    onSelectFiles,
    copyShareLink,
    files,
    onRemoveFile,
    peers,
    sendingFiles,
    peerId,
  } = usePeerSender();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        width: "90%",
        margin: "5%",
      }}
    >
      {!!peerId && <span>Your id: {peerId}</span>}
      <input type="file" multiple onChange={onSelectFiles} />
      <ol
        style={{ width: "100%", paddingRight: "40px", margin: 0, padding: 0 }}
      >
        {files.map((file) => (
          <li
            key={file.name}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid lightgrey",
              padding: "2% 0",
            }}
          >
            <span>{file.name}</span>
            <span onClick={() => onRemoveFile(file)}>x</span>
          </li>
        ))}
      </ol>
      {files?.length && (
        <button onClick={copyShareLink}>Copy link to share</button>
      )}

      <Peers items={peers} />

      {sendingFiles && <span>Sending files...</span>}
    </div>
  );
};

export default Sender;
