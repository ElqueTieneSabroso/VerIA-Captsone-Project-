import {
  MAX_CAPTURE_SIDE,
  parsePictureSize,
  pickPictureSize,
} from "../utils/camera";

describe("camera resolution utilities", () => {
  test("parses a valid camera size", () => {
    expect(parsePictureSize("1280x720")).toEqual({
      size: "1280x720",
      width: 1280,
      height: 720,
      longestSide: 1280,
    });
  });

  test.each([undefined, null, "", "abc", "100x", "0x720", "-1x720"])(
    "rejects invalid size %p",
    (size) => {
      expect(parsePictureSize(size)).toBeNull();
    },
  );

  test("picks the largest size that fits the limit", () => {
    expect(
      pickPictureSize(["1920x1080", "640x480", "720x720", "320x240"]),
    ).toBe("720x720");
  });

  test("falls back to the smallest available size", () => {
    expect(pickPictureSize(["1920x1080", "1280x720"], 500)).toBe("1280x720");
  });

  test("handles missing inputs safely", () => {
    expect(pickPictureSize(undefined)).toBeUndefined();
    expect(pickPictureSize([], MAX_CAPTURE_SIDE)).toBeUndefined();
    expect(pickPictureSize(["invalid"])).toBeUndefined();
  });
});
