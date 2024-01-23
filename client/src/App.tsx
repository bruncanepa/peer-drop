import { FC } from "react";
import "./App.css";
import Receiver from "components/Receiver";
import Sender from "components/Sender";

const App: FC = () => {
  const sharedSessionIdParam = window.location.pathname.replace("/", "");

  return (
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
        {Boolean(sharedSessionIdParam) ? (
          <Receiver sharedId={sharedSessionIdParam} />
        ) : (
          <Sender />
        )}
      </div>
    </div>
  );
};

export default App;
