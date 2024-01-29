import { FC, lazy, Suspense } from "react";
import { ChakraProvider } from "@chakra-ui/react";
import "./App.css";
const Receiver = lazy(() => import("components/Receiver"));
const Sender = lazy(() => import("components/Sender"));

const App: FC = () => {
  const sharedSessionIdParam = window.location.pathname.replace("/", "");

  return (
    <ChakraProvider>
      <div className="App" style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-evenly",
            width: "90%",
            margin: "5%",
          }}
        >
          <Suspense fallback={<div>Loading...</div>}>
            {Boolean(sharedSessionIdParam) ? (
              <Receiver sharedId={sharedSessionIdParam} />
            ) : (
              <Sender />
            )}
          </Suspense>
        </div>
      </div>
    </ChakraProvider>
  );
};

export default App;
