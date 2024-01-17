import { FC } from "react";
import "./App.css";
import Receiver from "components/Receiver";
import Sender from "components/Sender";

const App: FC = () => {
  const sharedSessionIdParam = window.location.pathname.replace("/", "");

  return (
    <div className="App" style={{ display: "flex", flexDirection: "column" }}>
      {Boolean(sharedSessionIdParam) ? (
        <Receiver sharedId={sharedSessionIdParam} />
      ) : (
        <Sender />
      )}
    </div>
  );
};

export default App;
