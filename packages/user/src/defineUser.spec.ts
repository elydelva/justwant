import { describe, expect, test } from "bun:test";
import { defineUser } from "./defineUser.js";

describe("defineUser", () => {
  test("returns UserDef with name and callable that produces UserRef", () => {
    const userDef = defineUser();

    expect(userDef.name).toBe("user");
    expect(userDef("usr_1")).toEqual({ type: "user", id: "usr_1" });
    expect(userDef("usr_2")).toEqual({ type: "user", id: "usr_2" });
  });

  test("takes no parameters", () => {
    const userDef = defineUser();

    expect(userDef.name).toBe("user");
    expect(userDef("usr_1").type).toBe("user");
    expect(userDef("usr_1").id).toBe("usr_1");
  });

  test("produces UserRef compatible with Member shape", () => {
    const userDef = defineUser();
    const ref = userDef("usr_1");

    expect(ref).toHaveProperty("type", "user");
    expect(ref).toHaveProperty("id", "usr_1");
    expect(Object.keys(ref)).toEqual(["type", "id"]);
  });
});
