import { FC } from "react";
import {
  CircularProgress,
  CircularProgressLabel,
  CircularProgressProps,
} from "@chakra-ui/react";

interface ProgressProps extends CircularProgressProps {
  progress?: number;
}

export const Progress: FC<ProgressProps> = ({ progress = 0, ...rest }) => {
  return (
    <CircularProgress
      display="flex"
      justifyContent="center"
      alignItems="center"
      width="35px"
      value={progress}
      color="green.400"
      {...rest}
    >
      <CircularProgressLabel fontSize="9px">
        {progress}%
      </CircularProgressLabel>
    </CircularProgress>
  );
};
