export type FileIntent = {
  id: string;
  ownerId: string;
  date: Date;
  expires: Date;
  pendingDownloads: number;
  privateReceipt: string;
  publicReceipt: string;
};

export type FileIntentShared = Omit<FileIntent, "privateReceipt">;

export class FileIntentManager {
  private intents: Map<string, FileIntent>;
  constructor() {
    this.intents = new Map();
  }

  add = (ownerId: string, downloadTimes = 1): FileIntent => {
    const date = new Date();
    const expires = new Date(date);
    expires.setDate(date.getDate() + 1); // expires in 1 day

    const intent: FileIntent = {
      id: crypto.randomUUID(),
      ownerId,
      date,
      expires,
      pendingDownloads: downloadTimes,
      privateReceipt: this.getRandomString(32),
      publicReceipt: this.getRandomString(),
    };

    this.intents.set(intent.id, intent);

    return intent;
  };

  get = (fileId: string, publicReceipt: string): FileIntentShared => {
    const intent = this.getThrow(fileId);
    if (intent.publicReceipt !== publicReceipt) {
      console.log(
        `file ${fileId} found but invalid publicReceipt. is ${intent.publicReceipt}, got ${publicReceipt}`
      );
      throw Error(ErrorMessage.NOT_FOUND);
    }
    return this.intentToIntentShared(intent);
  };

  downloaded = (fileId: string, privateReceipt: string): FileIntent => {
    const intent = this.getThrow(fileId);
    if (intent.privateReceipt === privateReceipt) {
      intent.pendingDownloads -= 1;
      if (intent.pendingDownloads === 0) this.intents.delete(fileId);
      return intent;
    }
    console.log(
      `file ${fileId} found but invalid privateReceipt. is ${intent.privateReceipt}, got ${privateReceipt}`
    );
    throw Error(ErrorMessage.NOT_FOUND);
  };

  private getThrow = (fileId: string): FileIntent => {
    const intent = this.intents.get(fileId);
    if (intent) return intent;
    throw Error(ErrorMessage.NOT_FOUND);
  };

  private getRandomString = (length = 20) => {
    const buffer = new Uint8Array(length);
    crypto.getRandomValues(buffer);
    return Buffer.from(buffer)
      .toString("base64")
      .replace(/[^a-zA-Z0-9]/g, ""); // remove non alphanumeric chars
  };

  private intentToIntentShared = (intent: FileIntent): FileIntentShared => {
    const shared: FileIntentShared = {
      date: new Date(intent.date),
      pendingDownloads: intent.pendingDownloads,
      expires: new Date(intent.expires),
      id: intent.id,
      ownerId: intent.ownerId,
      publicReceipt: intent.publicReceipt,
    };
    return shared;
  };
}

export enum ErrorMessage {
  NOT_FOUND = "not found",
}
