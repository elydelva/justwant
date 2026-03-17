import { describe, expect, test } from "bun:test";
import { createBezierCurve } from "./createBezierCurve.js";
import { BezierError, InvalidBezierParamsError } from "./errors.js";

describe("BezierError", () => {
  test("BezierError is Error subclass", () => {
    const err = new BezierError("test");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(BezierError);
    expect(err.name).toBe("BezierError");
    expect(err.message).toBe("test");
  });
});

describe("InvalidBezierParamsError", () => {
  test("InvalidBezierParamsError extends BezierError and has params", () => {
    const params = { p1x: -1, p1y: 0, p2x: 1, p2y: 1 };
    const err = new InvalidBezierParamsError("invalid", params);
    expect(err).toBeInstanceOf(BezierError);
    expect(err).toBeInstanceOf(InvalidBezierParamsError);
    expect(err.name).toBe("InvalidBezierParamsError");
    expect(err.params).toEqual(params);
  });

  test("createBezierCurve throws when p1x < 0", () => {
    expect(() => createBezierCurve({ p1x: -0.1, p1y: 0, p2x: 0.58, p2y: 1 })).toThrow(
      InvalidBezierParamsError
    );
  });

  test("createBezierCurve throws when p1y > 1", () => {
    expect(() => createBezierCurve({ p1x: 0.42, p1y: 1.1, p2x: 0.58, p2y: 1 })).toThrow(
      InvalidBezierParamsError
    );
  });

  test("createBezierCurve throws when p2x outside [0,1]", () => {
    expect(() => createBezierCurve({ p1x: 0.42, p1y: 0, p2x: 1.5, p2y: 1 })).toThrow(
      InvalidBezierParamsError
    );
  });

  test("createBezierCurve throws when p2y < 0", () => {
    expect(() => createBezierCurve({ p1x: 0.42, p1y: 0, p2x: 0.58, p2y: -0.01 })).toThrow(
      InvalidBezierParamsError
    );
  });

  test("createBezierCurve accepts params at boundaries 0 and 1", () => {
    const curve = createBezierCurve({ p1x: 0, p1y: 0, p2x: 1, p2y: 1 });
    expect(curve.at(0)).toBe(0);
    expect(curve.at(1)).toBe(1);
  });
});
