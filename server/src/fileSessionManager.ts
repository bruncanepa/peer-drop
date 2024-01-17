import { ErrorMessage } from "./error";
import { CryptoLib } from "./lib/crypto";

export type FileSession = {
  id: string;
  ownerId: string;
  date: Date;
  expires: Date;
  pendingDownloads: number;
  receipt: string;
};

export type FileSessionShared = Omit<
  FileSession,
  "receipt" | "pendingDownloads"
>;

export class FileSessionManager {
  private sessions: Map<string, FileSession>;
  constructor() {
    this.sessions = new Map();
  }

  add = (ownerId: string, downloadTimes = 1): FileSession => {
    const date = new Date();
    const expires = new Date(date);
    expires.setDate(date.getDate() + 1); // expires in 1 day

    const session: FileSession = {
      id: CryptoLib.random(24),
      ownerId,
      date,
      expires,
      pendingDownloads: downloadTimes,
      receipt: CryptoLib.random(50),
    };

    this.sessions.set(session.id, session);

    return session;
  };

  get = (sessionId: string): FileSessionShared => {
    const session = this.getThrow(sessionId);
    return this.sessionToSessionShared(session);
  };

  downloaded = (sessionId: string, receipt: string): FileSession => {
    const session = this.getThrow(sessionId);
    if (session.receipt === receipt) {
      session.pendingDownloads -= 1;
      if (session.pendingDownloads === 0) this.sessions.delete(sessionId);
      return session;
    }
    console.log(
      `file ${sessionId} found but invalid receipt. is ${session.receipt}, got ${receipt}`
    );
    throw Error(ErrorMessage.NOT_FOUND.key);
  };

  private getThrow = (sessionId: string): FileSession => {
    const session = this.sessions.get(sessionId);
    if (session) return session;
    throw Error(ErrorMessage.NOT_FOUND.key);
  };

  private sessionToSessionShared = (
    session: FileSession
  ): FileSessionShared => {
    const shared: FileSessionShared = {
      date: new Date(session.date),
      expires: new Date(session.expires),
      id: session.id,
      ownerId: session.ownerId,
    };
    return shared;
  };
}
