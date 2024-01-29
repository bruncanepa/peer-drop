import { ChangeEventHandler, FC, LegacyRef, useRef } from "react";
import { Button, ButtonProps } from "@chakra-ui/react";

interface FileInputProps extends ButtonProps {
  onSelectFiles: ChangeEventHandler;
}

export const FileInput: FC<FileInputProps> = ({ onSelectFiles, ...rest }) => {
  const ref = useRef<HTMLInputElement>();
  const onClick = () => {
    // @ts-ignore
    ref.current?.click();
  };
  return (
    <>
      <input
        ref={ref as LegacyRef<HTMLInputElement>}
        hidden
        type="file"
        onChange={onSelectFiles}
        multiple
      />
      <Button {...rest} onClick={onClick}>
        Select files
      </Button>
    </>
  );
};
