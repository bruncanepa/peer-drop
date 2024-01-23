import { FC } from "react";
import { Peers } from "./Peers";
import { usePeerReceiver } from "hooks/usePeerReceiver";
import { ActivityLog } from "./ActivityLog";
import { Box } from "./common/Box";
import { Files } from "./Files";

interface ReceiverProps {
  sharedId: string;
}

const Receiver: FC<ReceiverProps> = ({ sharedId }) => {
  const {
    files,
    fileSession,
    peers,
    error,
    myId,
    activityLogs,
    downloadFiles,
    onRemoveFile,
  } = usePeerReceiver({ sharedId });

  if (error) return <span>Error {error.message}</span>;

  if (!Boolean(fileSession)) return <span>Loading...</span>;

  return (
    <>
      <ActivityLog items={activityLogs} myId={myId} />

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
    </>
  );
};

export default Receiver;
