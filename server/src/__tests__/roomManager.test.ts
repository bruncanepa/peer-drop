import { afterEach, describe, expect, test } from "@jest/globals";
import { RoomManager } from "../roomManager";
import { ErrorMessage } from "../error";

describe("fileSessionManager", () => {
  let manager = new RoomManager();
  afterEach(() => {
    manager = new RoomManager();
  });

  test("add + get", () => {
    const expected = manager.add("1");

    const result = manager.get(expected.id);

    Object.keys(result).forEach((key) => {
      expect(result[key]).toEqual(expected[key]);
    });
    expect(manager.get("invalid")).toBeUndefined();
  });
});
