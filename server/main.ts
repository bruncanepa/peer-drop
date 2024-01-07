// https://github.com/peers/peerjs-server

import express from "express";
import { ExpressPeerServer } from "peer";

const app = express();
const port = process.env.NODE_PORT || 9000;
const server = require("http").createServer(app);

const peerServer = ExpressPeerServer(server, {
  // path: "/sockets",
});

peerServer.on("connection", (client) => {
  console.log("connection", client.getId());
});

peerServer.on("disconnect", (client) => {
  console.log("disconnect", client.getId());
});

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} | ${req.ip}`);
  next();
});
app.get("/", (req, res, next) => res.send("Hello world!"));
app.use("/sockets", peerServer);

server.listen(port, () => console.log(`listening on ${port}`));
