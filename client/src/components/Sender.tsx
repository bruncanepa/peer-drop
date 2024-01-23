import { FC } from "react";
import { Peers } from "./Peers";
import { usePeerSender } from "hooks/usePeerSender";
import { ActivityLog } from "./ActivityLog";
import { Files } from "./Files";
import { Box } from "./common/Box";

interface SenderProps {}

const Sender: FC<SenderProps> = () => {
  const {
    myId,
    files,
    peers,
    sendingFiles,
    activityLogs,
    onSelectFiles,
    copyShareLink,
    onRemoveFile,
  } = usePeerSender();

  return (
    <>
      <ActivityLog items={activityLogs} myId={myId} />

      <Box
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "center",
          marginLeft: "2%",
        }}
      >
        <input type="file" multiple onChange={onSelectFiles} />

        <Files files={files} onRemoveFile={onRemoveFile} />

        {files?.length && (
          <button onClick={copyShareLink}>Copy link to share</button>
        )}

        <Peers items={peers} />

        {sendingFiles && <span>Sending files...</span>}
      </Box>
    </>
  );
};

export default Sender;
