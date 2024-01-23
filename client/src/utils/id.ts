import { CryptoLib } from "libs/crypto";

export const genId = () => `${CryptoLib.uuid(true)}-${CryptoLib.random(8)}`;

export const idToShortId = (id?: string) => (id ? id.split("-")[1].substring(0, 8) : "");
