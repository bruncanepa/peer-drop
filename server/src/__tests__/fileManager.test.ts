import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";
import { ErrorMessage, FileIntentManager } from "../fileManager";

describe("fileManager", () => {
  let manager = new FileIntentManager();
  afterEach(() => {
    manager = new FileIntentManager();
  });

  test("add + get", () => {
    const expected = manager.add("1");

    const result = manager.get(expected.id, expected.publicReceipt);

    expect(expected.privateReceipt).toBeDefined();
    expect(result["privateReceipt"]).toBeUndefined();
    Object.keys(result).forEach((key) => {
      expect(result[key]).toEqual(expected[key]);
    });
    expect(() => manager.get("invalid", "invalid")).toThrowError(
      ErrorMessage.NOT_FOUND
    );
    expect(() => manager.get(expected.id, "invalid")).toThrowError(
      ErrorMessage.NOT_FOUND
    );
  });

  test("downloaded", () => {
    const intent = manager.add("1");

    const result = manager.downloaded(intent.id, intent.privateReceipt);

    expect(result).toBe(intent);
    expect(result?.pendingDownloads).toEqual(0);
    expect(() => manager.downloaded("invalid", "invalid")).toThrowError(
      ErrorMessage.NOT_FOUND
    );
    expect(() => manager.downloaded(intent.id, "invalid")).toThrowError(
      ErrorMessage.NOT_FOUND
    );
    expect(() =>
      manager.downloaded(intent.id, intent.publicReceipt)
    ).toThrowError(ErrorMessage.NOT_FOUND);
    expect(() =>
      manager.downloaded(intent.id, intent.privateReceipt)
    ).toThrowError(ErrorMessage.NOT_FOUND);
  });
});
