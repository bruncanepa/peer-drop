import { FC } from "react";
import { Text, CloseButton, Flex } from "@chakra-ui/react";
import { DataFileListItem } from "dto/peer";
import { formatBytes } from "utils/file/formatBytes";
import { Progress } from "./Progress";

interface FilesProps {
  files: DataFileListItem[];
  onRemoveFile: (file: DataFileListItem) => void;
  filesProgressMap?: Record<string, number>;
  isDisabled?: boolean;
}

export const Files: FC<FilesProps> = ({
  files,
  onRemoveFile,
  filesProgressMap,
  isDisabled,
}) => {
  return (
    <ol style={{ width: "100%", paddingRight: "40px", margin: 0, padding: 0 }}>
      {files.map((file) => (
        <li
          key={file.name}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid lightgrey",
            padding: "1% 0",
          }}
        >
          <Flex direction="column" justifyContent="center">
            <Text>{file.name}</Text>
            <Text fontSize="8px">{formatBytes(file.size)}</Text>
          </Flex>
          <Flex justifyContent="center" alignItems="center">
            {!!filesProgressMap && !!filesProgressMap[file.id] && (
              <Progress progress={filesProgressMap[file.id]} />
            )}
            <CloseButton
              isDisabled={isDisabled}
              onClick={() => onRemoveFile(file)}
            >
              X
            </CloseButton>
          </Flex>
        </li>
      ))}
    </ol>
  );
};
