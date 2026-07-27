import { resolveCompletedRecordingUri } from "../utils/audio";

test("uses the completed recording URL reported by expo-audio", () => {
  expect(
    resolveCompletedRecordingUri(
      { url: "file:///document/completed.m4a" },
      "file:///cache/temporary.m4a",
    ),
  ).toBe("file:///document/completed.m4a");
});

test("falls back to the recorder URI when status has no URL", () => {
  expect(
    resolveCompletedRecordingUri(
      { url: null },
      "file:///document/recording.m4a",
    ),
  ).toBe("file:///document/recording.m4a");
});

test("rejects a recording without a completed URL", () => {
  expect(() => resolveCompletedRecordingUri({ url: null }, null)).toThrow(
    "No se generó el archivo de audio",
  );
});
