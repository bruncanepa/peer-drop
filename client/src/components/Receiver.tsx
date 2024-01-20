import { FC, useEffect, useState } from "react";
import { Peers } from "./Peers";
import { usePeerReceiver } from "hooks/usePeerReceiver";

interface ReceiverProps {
  sharedId: string;
}

const Receiver: FC<ReceiverProps> = ({ sharedId }) => {
  const { files, fileSession, peers, error, downloadFiles } = usePeerReceiver({
    sharedId,
  });

  if (error) return <span>Error {error.message}</span>;

  if (!Boolean(fileSession)) return <span>Loading...</span>;

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
          <button onClick={downloadFiles}>Download</button>
        </>
      ) : (
        <span>No files</span>
      )}

      <Peers items={peers} />
    </>
  );
};

export default Receiver;
