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

    expect(result).toMatchObject(expected);
    expect(manager.get("invalid")).toBeUndefined();
  });

  test("delete", () => {
    const room1A = manager.add("1");
    const room1B = manager.add("1");
    const room1C = manager.add("1");
    const room2A = manager.add("2");
    const room2B = manager.add("2");
    const room3 = manager.add("3");

    let count = manager.delete(room1A.ownerId);

    expect(count).toEqual(3);
    expect(manager.get(room1A.id)).toBeUndefined();
    expect(manager.get(room1B.id)).toBeUndefined();
    expect(manager.get(room1C.id)).toBeUndefined();
    expect(manager.get(room2A.id)).toMatchObject(room2A);
    expect(manager.get(room2B.id)).toMatchObject(room2B);
    expect(manager.get(room3.id)).toMatchObject(room3);

    count = manager.delete(room2A.ownerId);
    expect(count).toEqual(2);
    expect(manager.get(room2A.id)).toBeUndefined();
    expect(manager.get(room2B.id)).toBeUndefined();
    expect(manager.get(room3.id)).toMatchObject(room3);

    count = manager.delete(room3.ownerId);
    expect(count).toEqual(1);
    expect(manager.get(room3.id)).toBeUndefined();
  });
});
