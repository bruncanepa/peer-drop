// https://github.com/peers/peerjs-server

import * as express from "express";
import helmet from "helmet";
import * as compression from "compression";
import * as cors from "cors";
import { ExpressPeerServer, IClient, IMessage, PeerServerEvents } from "peer";
import { Room, RoomManager } from "./src/roomManager";
import { errorHandler } from "./src/middlewares/errorHandler";

const app = express();
const port = process.env.NODE_PORT || 9000;
const server = require("http").createServer(app);
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} | ${req.ip}`);
  next();
});

// Created ad "MessageType" from "peer" lib is undefined
enum PeerMessageType {
  ANSWER = "ANSWER",
  CANDIDATE = "CANDIDATE",
  ERROR = "ERROR",
  HEARTBEAT = "HEARTBEAT",
  ID_TAKEN = "ID_TAKEN",
  LEAVE = "LEAVE",
  OFFER = "OFFER",
  OPEN = "OPEN",
  PEER_DROP = "PEER_DROP",
}

/**  BEGIN SHARE WITH WEB  */
type ServerMessageType = "CREATE_ROOM" | "GET_ROOM";

interface ISeverMessageDataReq {}
interface ISeverMessageDataRes {}

interface SeverMessageGeneric extends ISeverMessageDataReq {}

interface SeverMessageDataCreateRoomReq extends ISeverMessageDataReq {
  userId: string;
}

interface SeverMessageDataCreateRoomRes extends ISeverMessageDataRes, Room {}

interface SeverMessageDataGetRoomReq extends ISeverMessageDataReq {
  roomId: string;
}

interface SeverMessageDataGetRoomRes extends ISeverMessageDataRes, Room {}

interface ServerMessage<T extends ISeverMessageDataReq> {
  type: ServerMessageType;
  data: T;
  error?: string;
}
/**  END SHARE WITH WEB  */

const peerServer: express.Express & PeerServerEvents =
  ExpressPeerServer(server);
peerServer.on("connection", (client: IClient) => {
  console.log("connection", client.getId());
});
peerServer.on("disconnect", (client: IClient) => {
  console.log("disconnect", client.getId());
});
peerServer.on("message", (client: IClient, message: IMessage) => {
  switch (message.type.toString()) {
    case PeerMessageType.HEARTBEAT:
      // do nothing
      return;

    case PeerMessageType.PEER_DROP: {
      const payload =
        message.payload as unknown as ServerMessage<SeverMessageGeneric>;

      switch (payload.type) {
        case "CREATE_ROOM": {
          const { userId } = payload.data as SeverMessageDataCreateRoomReq;
          const room = roomManager.add(userId);
          client.send({
            data: room,
            type: payload.type,
          } as ServerMessage<SeverMessageDataCreateRoomRes>);
          return;
        }

        case "GET_ROOM": {
          const { roomId } = payload.data as SeverMessageDataGetRoomReq;
          const room = roomManager.get(roomId);
          client.send({
            data: room,
            type: payload.type,
            error: room ? "" : `room not found`,
          } as ServerMessage<SeverMessageDataGetRoomRes>);
          return;
        }

        default:
          return console.log("invalid PEER_DROP type", client.getId(), message);
      }
    }

    default:
      console.log(client.getId(), message);
      return;
  }
});
app.use("/sockets", peerServer);

const roomManager = new RoomManager();
app.use(cors("*"), helmet(), compression());
app.use(errorHandler);

server.listen(port, () => console.log(`listening on ${port}`));
