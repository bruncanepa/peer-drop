import { FC } from "react";
import { Flex, FlexProps } from "@chakra-ui/react";

interface BoxProps extends FlexProps {}

export const Box: FC<BoxProps> = ({ children, ...props }) => {
  return (
    <Flex
      border="1px solid lightgrey"
      borderRadius="5px"
      padding="2%"
      {...props}
    >
      {children}
    </Flex>
  );
};
