import { FC } from "react";
import { Peers } from "./Peers";
import { usePeerReceiver } from "hooks/usePeerReceiver";
import { ActivityLog } from "./ActivityLog";
import { Box } from "./common/Box";
import { Files } from "./Files";

interface ReceiverProps {
  sharedId: string;
}

const Receiver: FC<ReceiverProps> = ({ sharedId: roomId }) => {
  const {
    files,
    room,
    peers,
    error,
    myId,
    activityLogs,
    downloadFiles,
    onRemoveFile,
  } = usePeerReceiver({ roomId });

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {Boolean(room) ? (
        <Box style={{ marginLeft: "2%" }}>
          <h3>Files to download</h3>

          {files.length ? (
            <>
              <Files files={files} onRemoveFile={onRemoveFile} />

              <button onClick={downloadFiles}>Download</button>
            </>
          ) : (
            <span>No files</span>
          )}

          <Peers items={peers} />
        </Box>
      ) : (
        !Boolean(error) && <span>Loading...</span>
      )}

      {Boolean(error) && <span>Error {error?.message}</span>}

      <ActivityLog items={activityLogs} myId={myId} />
    </div>
  );
};

export default Receiver;
