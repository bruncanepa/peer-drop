// https://github.com/peers/peerjs-server

import express from "express";
import { ExpressPeerServer } from "peer";

const app = express();
const port = 9000;
const server = app.listen(port, () => console.log(`listening on ${port}`));

const peerServer = ExpressPeerServer(server, {
  path: "/sockets",
});

app.get("/", (req, res, next) => res.send("Hello world!"));
app.use("/sockets", peerServer);

peerServer.on("connection", (client) => {
  console.log("connection", JSON.stringify(client), client);
});

peerServer.on("disconnect", (client) => {
  console.log("disconnect", JSON.stringify(client), client);
});
