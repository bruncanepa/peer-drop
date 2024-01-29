import { FC } from "react";
import { Button, Flex } from "@chakra-ui/react";
import { Peers } from "./Peers";
import { usePeerSender } from "hooks/usePeerSender";
import { ActivityLog } from "./ActivityLog";
import { Files } from "./Files";
import { Box } from "./common/Box";
import { DataFileListItem } from "libs/peer";
import { FileInput } from "./common/FileInput";

interface SenderProps {}

const Sender: FC<SenderProps> = () => {
  const {
    myId,
    files,
    peers,
    activityLogs,
    onSelectFiles,
    copyShareLink,
    onRemoveFile,
  } = usePeerSender();

  const _files: DataFileListItem[] = files.map((f, i) => ({
    id: `${i + 1}`,
    name: f.name,
    size: f.size,
    type: f.type,
  }));

  return (
    <Flex direction="column">
      <Box
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <FileInput onSelectFiles={onSelectFiles} />

        <Files files={_files} onRemoveFile={onRemoveFile} />

        {files?.length && (
          <Button onClick={copyShareLink}>Copy room's link to share</Button>
        )}

        {!!peers.length && <Peers items={peers} />}
      </Box>

      <ActivityLog items={activityLogs} myId={myId} />
    </Flex>
  );
};

export default Sender;
