import { FC } from "react";

interface ProgressProps {
  progress?: number;
}

export const Progress: FC<ProgressProps> = ({ progress = 0 }) => {
  return (
    <progress style={{ width: "100%" }} value={progress} max="100">
      {progress}%
    </progress>
  );
};
