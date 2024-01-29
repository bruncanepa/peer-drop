import { FC } from "react";
import { Button, Flex } from "@chakra-ui/react";
import { Peers } from "./Peers";
import { usePeerSender } from "hooks/usePeerSender";
import { ActivityLog } from "./ActivityLog";
import { Files } from "./Files";
import { Box } from "./common/Box";
import { DataFileListItem } from "libs/peer";
import { FileInput } from "./common/FileInput";
import { Shell } from "./common/Shell";

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
    <Shell columnGap="2%">
      <Box flex={1} flexDirection="column">
        <Flex width="100%" justifyContent="space-between">
          <FileInput onSelectFiles={onSelectFiles} />

          <Button isDisabled={!Boolean(files?.length)} onClick={copyShareLink}>
            Copy room's link to share
          </Button>
        </Flex>

        <Files files={_files} onRemoveFile={onRemoveFile} />

        {!!peers.length && <Peers items={peers} />}
      </Box>

      <ActivityLog width="100%" items={activityLogs} myId={myId} flex={1} />
    </Shell>
  );
};

export default Sender;
