import { DataFileListItem } from "libs/peer";
import { FC } from "react";
import { formatBytes } from "utils/file/formatBytes";

interface FilesProps {
  files: DataFileListItem[];
  onRemoveFile: (file: DataFileListItem | File) => void;
}

export const Files: FC<FilesProps> = ({ files, onRemoveFile }) => {
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
            padding: "2% 0",
          }}
        >
          <div>
            <span>{file.name}</span>
            <span style={{ fontSize: "8px" }}>{formatBytes(file.size)}</span>
          </div>
          <span onClick={() => onRemoveFile(file)}>x</span>
        </li>
      ))}
    </ol>
  );
};
