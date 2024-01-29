// https://github.com/peers/peerjs-server

import * as express from "express";
import helmet from "helmet";
import * as compression from "compression";
import * as cors from "cors";
import { ExpressPeerServer, IClient, IMessage, PeerServerEvents } from "peer";
import rateLimit from "express-rate-limit";

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
  PEER_DROP = "PEER_DROP", // CUSTOM
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

interface ServerMessageWrapped<T extends ISeverMessageDataReq> {
  type: PeerMessageType;
  payload: ServerMessage<T>;
}

/**  END SHARE WITH WEB  */

const peerServer: express.Express & PeerServerEvents =
  ExpressPeerServer(server);
peerServer.on("connection", (client: IClient) => {
  console.log("connection", client.getId());
});
peerServer.on("disconnect", (client: IClient) => {
  const ownerId = client.getId();
  console.log(
    `disconnect ${ownerId}. deleted ${roomManager.delete(ownerId)} rooms`
  );
});
peerServer.on("message", (client: IClient, message: IMessage) => {
  switch (message.type.toString()) {
    case PeerMessageType.PEER_DROP: {
      const payload =
        message.payload as unknown as ServerMessage<SeverMessageGeneric>;

      switch (payload.type) {
        case "CREATE_ROOM": {
          const { userId } = payload.data as SeverMessageDataCreateRoomReq;
          const room = roomManager.add(userId);
          return client.send({
            type: PeerMessageType.PEER_DROP,
            payload: {
              data: room,
              type: payload.type,
            },
          } as ServerMessageWrapped<SeverMessageDataCreateRoomRes>);
        }

        case "GET_ROOM": {
          const { roomId } = payload.data as SeverMessageDataGetRoomReq;
          const room = roomManager.get(roomId);
          return client.send({
            type: PeerMessageType.PEER_DROP,
            payload: {
              data: room,
              type: payload.type,
              error: room ? "" : `room not found`,
            },
          } as ServerMessageWrapped<SeverMessageDataGetRoomRes>);
        }

        default:
          return console.log("invalid PEER_DROP type", client.getId(), message);
      }
    }

    default:
      // Do nothing
      return;
  }
});

const roomManager = new RoomManager();
app.use(
  cors("*"),
  helmet(),
  rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 100, // limit each IP to 100 requests per windowMs
  })
);
app.use("/sockets", peerServer);
app.use(errorHandler);

server.listen(port, () => console.log(`listening on ${port}`));
