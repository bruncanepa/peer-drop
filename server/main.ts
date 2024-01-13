// https://github.com/peers/peerjs-server

import crypto from "crypto";
import express from "express";
import { ExpressPeerServer } from "peer";

const app = express();
const port = process.env.NODE_PORT || 9000;
const server = require("http").createServer(app);

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

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} | ${req.ip}`);
  next();
});
app.get("/", (req, res, next) => res.send("Hello world!"));
app.use("/sockets", peerServer);
app.use(express.json());
app.post("/files/intent", (req, res) => {
  const {} = req.body as { userId };
});

server.listen(port, () => console.log(`listening on ${port}`));
