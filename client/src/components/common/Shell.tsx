import { Flex, FlexProps } from "@chakra-ui/react";
import { FC } from "react";

export const Shell: FC<FlexProps> = ({ children, ...props }) => {
  return (
    <Flex {...props} width="100%" height="100%">
      {children}
    </Flex>
  );
};
