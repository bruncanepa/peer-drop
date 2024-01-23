import { PeerMessageType } from "libs/peer";
import { useState } from "react";
import { ImmutableArray } from "utils/array";

export type ActivityLogType =
  | PeerMessageType
  | "CREATE_SESSION_REQUESTED"
  | "CREATE_SESSION_OK"
  | "CREATE_SESSION_ERROR"
  | "NEW_CONNECTION_REQUESTED"
  | "NEW_CONNECTION_OK"
  | "NEW_CONNECTION_ERROR"
  | "CONNECTION_CLOSE"
  | "CREATE_FILE_SESSION_REQUESTED"
  | "CREATE_FILE_SESSION_OK"
  | "CREATE_FILE_SESSION_ERROR";

export interface ActivityLog {
  date?: Date;
  type: ActivityLogType;
  data?: any;
  peerId?: string;
}

export const useActivityLogs = () => {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  const add = (log: ActivityLog) =>
    setActivityLogs((l) =>
      ImmutableArray.push(l, { ...log, date: new Date() })
    );

  return { activityLogs, addActivityLog: add };
};
