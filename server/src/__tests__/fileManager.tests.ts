import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";
import { FileIntentManager } from "../fileManager";

describe("fileManager", () => {
  let manager = new FileIntentManager();
  afterEach(() => {
    manager = new FileIntentManager();
  });

  test("add", () => {
    const intent = manager.add("1");

    const publicIntent = manager.get(intent.id, intent.publicReceipt);

    console.log(JSON.stringify(intent));
    console.log(JSON.stringify(publicIntent));
    expect(intent.privateReceipt).toBeDefined();
    Object.keys(publicIntent).forEach((key) => {
      expect(publicIntent[key]).toEqual(intent[key]);
    });
  });
});
