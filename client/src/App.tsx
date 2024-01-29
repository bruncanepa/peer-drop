import { FC, lazy, Suspense } from "react";
import { ChakraProvider, Flex } from "@chakra-ui/react";
const Receiver = lazy(() => import("components/Receiver"));
const Sender = lazy(() => import("components/Sender"));

const App: FC = () => {
  const shareIdParam = window.location.pathname.replace("/", "");

  return (
    <ChakraProvider>
      <Flex width="90vw" height="90vh" overflow="hidden" margin="5vh 5vw">
        <Suspense fallback={<div>Loading...</div>}>
          {Boolean(shareIdParam) ? (
            <Receiver sharedId={shareIdParam} />
          ) : (
            <Sender />
          )}
        </Suspense>
      </Flex>
    </ChakraProvider>
  );
};

export default App;
