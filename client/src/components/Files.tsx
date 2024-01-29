import { FC } from "react";
import { Text, CloseButton } from "@chakra-ui/react";
import { DataFileListItem } from "libs/peer";
import { formatBytes } from "utils/file/formatBytes";
import { Progress } from "./Progress";

interface FilesProps {
  files: DataFileListItem[];
  onRemoveFile: (file: DataFileListItem) => void;
  filesProgressMap?: Record<string, number>;
}

export const Files: FC<FilesProps> = ({
  files,
  onRemoveFile,
  filesProgressMap,
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
          <div>
            <Text>{file.name}</Text>
            <Text fontSize="8px">{formatBytes(file.size)}</Text>
          </div>
          {!!filesProgressMap && !!filesProgressMap[file.id] && (
            <Progress progress={filesProgressMap[file.id]} />
          )}
          <CloseButton onClick={() => onRemoveFile(file)}>X</CloseButton>
        </li>
      ))}
    </ol>
  );
};
