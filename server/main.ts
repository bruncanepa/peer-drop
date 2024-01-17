// https://github.com/peers/peerjs-server

import * as express from "express";
import helmet from "helmet";
import * as compression from "compression";
import * as cors from "cors";
import { ExpressPeerServer } from "peer";
import { FileSessionManager } from "./src/fileSessionManager";
import { errorHandler } from "./src/middlewares/errorHandler";

const app = express();
const port = process.env.NODE_PORT || 9000;
const server = require("http").createServer(app);
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} | ${req.ip}`);
  next();
});

const peerServer = ExpressPeerServer(server);
peerServer.on("connection", (client) => {
  console.log("connection", client.getId());
});
peerServer.on("disconnect", (client) => {
  console.log("disconnect", client.getId());
});
peerServer.on("message", (client, message) => {
  if (message.type !== "HEARTBEAT") {
    console.log(client.getId(), message);
  }
});
app.use("/sockets", peerServer);

const fileSessionManager = new FileSessionManager();
app.use(cors("*"), helmet(), compression(), express.json());
app.get("/files/sessions/:id", (req, res, next) => {
  const fileSession = fileSessionManager.get(req.params.id);
  fileSession ? res.send(fileSession) : res.status(404);
});
app.post("/files/sessions", (req, res) => {
  const { userId, downloadTimes } = req.body as {
    userId: string;
    downloadTimes?: number;
  };
  const fileSession = fileSessionManager.add(userId, downloadTimes || 3);
  res.send(fileSession);
});
app.use(errorHandler);

server.listen(port, () => console.log(`listening on ${port}`));
