import { FC, lazy, Suspense } from "react";
import { ChakraProvider, Flex } from "@chakra-ui/react";
const Receiver = lazy(() => import("components/Receiver"));
const Sender = lazy(() => import("components/Sender"));

const App: FC = () => {
  const sharedSessionIdParam = window.location.pathname.replace("/", "");

  return (
    <ChakraProvider>
      <Flex
        direction="column"
        maxWidth="100%"
        maxHeight="100vh"
        overflow="hidden"
      >
        <Flex
          alignItems="center"
          justifyContent="space-evenly"
          width="90%"
          margin="5%"
        >
          <Suspense fallback={<div>Loading...</div>}>
            {Boolean(sharedSessionIdParam) ? (
              <Receiver sharedId={sharedSessionIdParam} />
            ) : (
              <Sender />
            )}
          </Suspense>
        </Flex>
      </Flex>
    </ChakraProvider>
  );
};

export default App;
