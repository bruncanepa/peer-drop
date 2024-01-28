import { FC } from "react";
import { Peers } from "./Peers";
import { usePeerSender } from "hooks/usePeerSender";
import { ActivityLog } from "./ActivityLog";
import { Files } from "./Files";
import { Box } from "./common/Box";
import { DataFileListItem } from "libs/peer";
import { Progress } from "./Progress";

interface SenderProps {}

const Sender: FC<SenderProps> = () => {
  const {
    myId,
    files,
    peers,
    sendingFiles,
    activityLogs,
    sendingFileProgress,
    onSelectFiles,
    copyShareLink,
    onRemoveFile,
  } = usePeerSender();

  const _onRemoveFile = (file: DataFileListItem | File) =>
    onRemoveFile(file as DataFileListItem);

  const _files = files as unknown as DataFileListItem[];

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Progress progress={sendingFileProgress} />

      <Box
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "center",
          marginLeft: "2%",
        }}
      >
        <input type="file" onChange={onSelectFiles} />

        <Files files={_files} onRemoveFile={_onRemoveFile} />

        {files?.length && (
          <button onClick={copyShareLink}>Copy room's link to share</button>
        )}

        {!!peers.length && <Peers items={peers} />}

        {sendingFiles && <span>Sending files...</span>}
      </Box>

      <ActivityLog items={activityLogs} myId={myId} />
    </div>
  );
};

export default Sender;
