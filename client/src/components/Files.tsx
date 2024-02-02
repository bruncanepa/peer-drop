import { FC } from "react";
import { Text, CloseButton, Flex, Checkbox, Button } from "@chakra-ui/react";
import { DataFileListItem } from "dto/peer";
import { formatBytes } from "utils/file/formatBytes";
import { Progress } from "./Progress";

interface FilesProps {
  files: DataFileListItem[];
  filesProgressMap?: Record<string, number>;
  isDisabled?: boolean;
  itemType: "checkbox" | "removable";
  onDownload?: () => void;
  onClickItem: (file: DataFileListItem[], selectAllValue?: boolean) => void;
}

export const Files: FC<FilesProps> = ({
  files,
  filesProgressMap,
  isDisabled,
  itemType,
  onDownload,
  onClickItem,
}) => {
  const isRemovable = itemType === "removable";
  const isCheckbox = itemType === "checkbox";

  if (!files.length) return <Text>No files</Text>;

  return (
    <Flex width="100%" direction="column" overflow="scroll">
      {!!onDownload && (
        <>
          <Button
            minHeight="40px"
            isDisabled={isDisabled || !files.some((f) => f.selected)}
            onClick={onDownload}
          >
            Download
          </Button>
          <Flex columnGap="0.5em" margin="3% 0 3% 0">
            <Checkbox
              onChange={(event) => onClickItem(files, event.target.checked)}
              isDisabled={isDisabled}
            />
            <Text fontWeight="bold">Select all</Text>
          </Flex>
        </>
      )}

      {files.length ? (
        <Flex direction="column" overflow="scroll">
          {files.map((file) => (
            <Flex
              key={file.id}
              justifyContent="space-between"
              alignItems="center"
              borderTop="1px solid lightgrey"
              padding="1% 0"
            >
              <Flex columnGap="0.5em">
                {isCheckbox && (
                  <Checkbox
                    onChange={() => onClickItem([file])}
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
                    onClick={() => onClickItem([file])}
                  >
                    X
                  </CloseButton>
                )}
              </Flex>
            </Flex>
          ))}
        </Flex>
      ) : (
        <Text>No files</Text>
      )}
    </Flex>
  );
};
