import { FC } from "react";
import { Button, Text } from "@chakra-ui/react";
import { Peers } from "./Peers";
import { usePeerReceiver } from "hooks/usePeerReceiver";
import { ActivityLog } from "./ActivityLog";
import { Box } from "./common/Box";
import { Files } from "./Files";
import { Shell } from "./common/Shell";

interface ReceiverProps {
  sharedId: string;
}

const Receiver: FC<ReceiverProps> = ({ sharedId: roomId }) => {
  const {
    files,
    room,
    peers,
    myId,
    activityLogs,
    downloadFileProgressMap,
    downloaded,
    downloadFiles,
    onRemoveFile,
  } = usePeerReceiver({ roomId });

  return (
    <Shell columnGap="2%">
      {Boolean(room) ? (
        <Box flex={1} flexDirection="column">
          <h3>Files to download</h3>

          {files.length ? (
            <>
              <Files
                files={files}
                onRemoveFile={onRemoveFile}
                filesProgressMap={downloadFileProgressMap}
                isDisabled={downloaded}
              />
              <Button isDisabled={downloaded} onClick={downloadFiles}>
                Download
              </Button>
            </>
          ) : (
            <Text>No files</Text>
          )}

          <Peers items={peers} />
        </Box>
      ) : (
        <Text>Loading...</Text>
      )}

      <ActivityLog width="100%" items={activityLogs} myId={myId} flex={1} />
    </Shell>
  );
};

export default Receiver;
