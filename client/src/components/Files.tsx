import { FC } from "react";
import { Text, CloseButton, Flex, Checkbox } from "@chakra-ui/react";
import { DataFileListItem } from "dto/peer";
import { formatBytes } from "utils/file/formatBytes";
import { Progress } from "./Progress";

interface FilesProps {
  files: DataFileListItem[];
  onClickItem: (file: DataFileListItem) => void;
  filesProgressMap?: Record<string, number>;
  isDisabled?: boolean;
  itemType: "checkbox" | "removable";
}

export const Files: FC<FilesProps> = ({
  files,
  onClickItem,
  filesProgressMap,
  isDisabled,
  itemType,
}) => {
  const isRemovable = itemType === "removable";
  const isCheckbox = itemType === "checkbox";
  return (
    <Flex direction="column" width="100%">
      {files.map((file) => (
        <Flex
          key={file.id}
          justifyContent="space-between"
          alignItems="center"
          borderBottom="1px solid lightgrey"
          padding="1% 0"
        >
          <Flex columnGap="0.5em">
            {isCheckbox && (
              <Checkbox
                onChange={() => onClickItem(file)}
                isChecked={file.selected}
                isDisabled={isDisabled}
              />
            )}
            <Flex direction="column" justifyContent="center">
              <Text>{file.name}</Text>
              <Text fontSize="8px">{formatBytes(file.size)}</Text>
            </Flex>
          </Flex>
          <Flex justifyContent="center" alignItems="center">
            {file.selected &&
              !!filesProgressMap &&
              !!filesProgressMap[file.id] && (
                <Progress progress={filesProgressMap[file.id]} />
              )}
            {isRemovable && (
              <CloseButton
                isDisabled={isDisabled}
                onClick={() => onClickItem(file)}
              >
                X
              </CloseButton>
            )}
          </Flex>
        </Flex>
      ))}
    </Flex>
  );
};
