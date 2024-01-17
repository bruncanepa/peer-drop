import * as crypto from "crypto";

export class CryptoLib {
  static random = (byteLength = 20) => {
    const buf = new Uint8Array(byteLength);
    crypto.getRandomValues(buf);
    return Buffer.from(buf)
      .toString("base64")
      .replace(/[^a-zA-Z0-9]/g, ""); // remove non alphanumeric chars
  };

  static uuid = (replaceDash = false) =>
    replaceDash ? crypto.randomUUID().replace(/-/g, "") : crypto.randomUUID();
}
