import { PeerMessageType } from "libs/peer";
import { useCallback, useState } from "react";
import { ImmutableArray } from "utils/array";

type ActivityLogTypeStatus = "OK" | "REQUESTED" | "ERROR";
const validActivityLogTypeStatus: ActivityLogTypeStatus[] = [
  "OK",
  "REQUESTED",
  "ERROR",
];

export type ActivityLogType =
  | PeerMessageType
  | "CREATE_SESSION_REQUESTED" // Both
  | "CREATE_SESSION_OK" // Both
  | "CREATE_SESSION_ERROR" // Both
  | "LISTEN_CONNECTION_REQUESTED" // Both
  | "LISTEN_CONNECTION_OK" // Both
  | "LISTEN_CONNECTION_ERROR" // Both
  | "NEW_CONNECTION_REQUESTED" // Receiver
  | "NEW_CONNECTION_OK" // Receiver
  | "NEW_CONNECTION_ERROR" // Receiver
  | "CONNECTION_CLOSE" // Both
  | "CREATE_ROOM_REQUESTED" // Sender
  | "CREATE_ROOM_OK" // Sender
  | "CREATE_ROOM_ERROR" // Sender
  | "GET_ROOM_REQUESTED" // Receiver
  | "GET_ROOM_OK" // Receiver
  | "GET_ROOM_ERROR" // Receiver
  | "COPY_SHARE_URL" // Sender
  | "DISCONNECTED_FROM_SERVER"; // Both;

export const toActivityLogType = (
  logType: string,
  status: ActivityLogTypeStatus
): ActivityLogType =>
  validActivityLogTypeStatus.find((st) => logType.endsWith(st))
    ? (logType as ActivityLogType)
    : (`${logType}_${status}` as ActivityLogType);

export interface ActivityLog {
  date?: Date;
  type: ActivityLogType;
  data?: any;
  peerId?: string;
  id?: string;
}

export const useActivityLogs = () => {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  const add = useCallback(
    (log: ActivityLog) =>
      setActivityLogs((logs) =>
        log.type === "FILES_DOWNLOAD_PROGRESS"
          ? logs
          : ImmutableArray.pushUnique(
              logs,
              {
                ...log,
                date: new Date(),
                id: new Date().toISOString() + log.type,
                data: undefined, // TODO
              },
              "id"
            )
      ),
    []
  );

  return { activityLogs, addActivityLog: add };
};
