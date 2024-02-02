import { CryptoLib } from "libs/crypto";
import { random } from "./number";

export const genPeerId = () => `${CryptoLib.uuid(true)}-${CryptoLib.random(8)}`;
export const genUUID = () => CryptoLib.uuid(true);

export const idToShortId = (id?: string) =>
  id ? id.split("-")[1].substring(0, 8) : "";

let aliasCount = 0;
export const genAlias = () =>
  `${colors[random(0, colors.length - 1)].toLowerCase()}-${aliasCount++}`;

const colors = [
  "White",
  "Black",
  "Grey",
  "Yellow",
  "Red",
  "Blue",
  "Green",
  "Brown",
  "Pink",
  "Orange",
  "Purple",
  "Maroon",
  "Crimson",
  "Scarlet",
  "Burgundy",
  "Salmon",
  "Navy",
  "Turquoise",
  "Azure",
  "Teal",
  "Emerald",
  "Lime",
  "Olive",
  "Jade",
  "Gold",
  "Lemon",
  "Mustard",
  "Canary",
  "Straw",
  "Lavender",
  "Violet",
  "Coral",
  "Peach",
  "Amber",
  "Tangerine",
  "Rust",
  "Charcoal",
  "Slate",
  "Silver",
  "Ash",
  "Chestnut",
  "Beige",
  "Chocolate",
  "Hazel",
  "Umber",
];
