import { FC } from "react";
import { Button, Flex } from "@chakra-ui/react";
import { Peers } from "./Peers";
import { usePeerSender } from "hooks/usePeerSender";
import { ActivityLog } from "./ActivityLog";
import { Files } from "./Files";
import { Box } from "./common/Box";
import { DataFileListItem } from "dto/peer";
import { FileInput } from "./common/FileInput";
import { Shell } from "./common/Shell";

interface SenderProps {}

const Sender: FC<SenderProps> = () => {
  const {
    files,
    peers,
    peersAliases,
    activityLogs,
    room,
    onSelectFiles,
    copyShareLink,
    onRemoveFile,
  } = usePeerSender();

  const _files: DataFileListItem[] = files.map(({ id, file }) => ({
    id,
    name: file.name,
    size: file.size,
    type: file.type,
  }));

  const peersItems = peers.map((peerId) => ({
    id: peerId,
    alias: peersAliases[peerId],
  }));

  return (
    <Shell columnGap="2%">
      <Box flex={1} flexDirection="column">
        <Flex width="100%" justifyContent="space-between">
          <FileInput onSelectFiles={onSelectFiles} />

          <Button isDisabled={!Boolean(room)} onClick={copyShareLink}>
            Copy room's link to share
          </Button>
        </Flex>

        <Files files={_files} onClickItem={onRemoveFile} itemType="removable" />

        {!!peersItems.length && <Peers items={peersItems} />}
      </Box>

      <ActivityLog width="100%" items={activityLogs} flex={1} />
    </Shell>
  );
};

export default Sender;
