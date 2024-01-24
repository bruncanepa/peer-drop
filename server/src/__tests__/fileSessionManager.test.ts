import { afterEach, describe, expect, test } from "@jest/globals";
import { RoomManager } from "../fileSessionManager";
import { ErrorMessage } from "../error";

describe("fileSessionManager", () => {
  let manager = new RoomManager();
  afterEach(() => {
    manager = new RoomManager();
  });

  test("add + get", () => {
    const expected = manager.add("1");

    const result = manager.get(expected.id);

    expect(expected.receipt).toBeDefined();
    expect(result["receipt"]).toBeUndefined();
    Object.keys(result).forEach((key) => {
      expect(result[key]).toEqual(expected[key]);
    });
    expect(() => manager.get("invalid")).toThrowError(
      ErrorMessage.NOT_FOUND.key
    );
  });

  test("downloaded", () => {
    const session = manager.add("1");

    const result = manager.downloaded(session.id, session.receipt);

    expect(result).toBe(session);
    expect(result?.pendingDownloads).toEqual(0);
    expect(() => manager.downloaded("invalid", "invalid")).toThrowError(
      ErrorMessage.NOT_FOUND.key
    );
    expect(() => manager.downloaded(session.id, "invalid")).toThrowError(
      ErrorMessage.NOT_FOUND.key
    );
    expect(() => manager.downloaded(session.id, session.receipt)).toThrowError(
      ErrorMessage.NOT_FOUND.key
    );
  });
});
