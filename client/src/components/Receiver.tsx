import { FC } from "react";
import { Button, Flex, Text } from "@chakra-ui/react";
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
    downloadFileProgressMap,
    downloadFiles,
    onRemoveFile,
  } = usePeerReceiver({ roomId });

  return (
    <Flex direction="column">
      {Boolean(room) ? (
        <Box style={{ marginLeft: "2%" }}>
          <h3>Files to download</h3>

          {files.length ? (
            <>
              <Files
                files={files}
                onRemoveFile={onRemoveFile}
                filesProgressMap={downloadFileProgressMap}
              />
              <Button onClick={downloadFiles}>Download</Button>
            </>
          ) : (
            <Text>No files</Text>
          )}

          <Peers items={peers} />
        </Box>
      ) : (
        !Boolean(error) && <Text>Loading...</Text>
      )}

      {Boolean(error) && <Text>Error {error?.message}</Text>}

      <ActivityLog items={activityLogs} myId={myId} />
    </Flex>
  );
};

export default Receiver;
