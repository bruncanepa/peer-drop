import { FC } from "react";
import {
  Button,
  Text,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Heading,
} from "@chakra-ui/react";
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
    myAlias,
    activityLogs,
    downloadFileProgressMap,
    downloadButtonClicked,
    roomOnwerPeer,
    isLoadingRoom,
    onDownload,
    onSelectFile,
  } = usePeerReceiver({ roomId });

  if (!isLoadingRoom && !roomOnwerPeer) {
    return (
      <Modal isOpen onClose={() => {}}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Room not found</ModalHeader>
          <ModalBody>
            <Text>
              Please ask your peer to share with you the room's link again.
            </Text>
          </ModalBody>

          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={() => window.location.replace("/")}
            >
              Create Room
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Shell columnGap="2%">
      {Boolean(room) ? (
        <Box flex={1} flexDirection="column">
          <Heading as="h3">Files</Heading>
          <Files
            files={files}
            onClickItem={onSelectFile}
            filesProgressMap={downloadFileProgressMap}
            isDisabled={downloadButtonClicked}
            itemType="checkbox"
            onDownload={onDownload}
          />
        </Box>
      ) : (
        <Text>Loading...</Text>
      )}

      <ActivityLog
        width="100%"
        items={activityLogs}
        myAlias={myAlias}
        flex={1}
      />
    </Shell>
  );
};

export default Receiver;
