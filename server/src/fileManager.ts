export type FileIntent = {
  id: string;
  ownerId: string;
  date: Date;
  expires: Date;
  downloadTimes: number;
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
    const intentId = this.getRandomString();
    const date = new Date();
    const expires = new Date(date);
    expires.setDate(date.getDate() + 1);

    const intent: FileIntent = {
      id: intentId,
      ownerId,
      date,
      expires,
      downloadTimes,
      privateReceipt: this.getRandomString(32),
      publicReceipt: this.getRandomString(),
    };

    this.intents.set(intentId, intent);

    return intent;
  };

  get = (fileId: string, publicReceipt: string): FileIntentShared => {
    const intent = this.getThrow(fileId);
    if (intent.publicReceipt !== publicReceipt) {
      console.log(
        `file ${fileId} found but invalid publicReceipt. is ${intent.publicReceipt}, got ${publicReceipt}`
      );
      throw Error("not found");
    }
    return this.intentToIntentShared(intent);
  };

  donwloaded = (fileId: string, privateReceipt: string) => {
    const intent = this.getThrow(fileId);
    if (intent.privateReceipt === privateReceipt) {
      intent.downloadTimes -= 1;
      if (intent.downloadTimes === 0) this.intents.delete(fileId);
      return;
    }
    console.log(
      `file ${fileId} found but invalid privateReceipt. is ${intent.privateReceipt}, got ${privateReceipt}`
    );
    throw Error("not found");
  };

  private getThrow = (fileId: string): FileIntent => {
    const intent = this.intents.get(fileId);
    if (intent) return intent;
    throw Error("not found");
  };

  private getRandomString = (length = 16) => {
    const random = new Uint8Array(length);
    crypto.getRandomValues(random);
    return Buffer.from(random).toString("base64");
  };

  private intentToIntentShared = (intent: FileIntent): FileIntentShared => {
    const shared: FileIntentShared = {
      date: new Date(intent.date),
      downloadTimes: intent.downloadTimes,
      expires: new Date(intent.expires),
      id: intent.id,
      ownerId: intent.ownerId,
      publicReceipt: intent.publicReceipt,
    };
    return shared;
  };
}
