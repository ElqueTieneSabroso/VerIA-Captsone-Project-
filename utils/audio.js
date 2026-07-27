export function resolveCompletedRecordingUri(status, recorderUri) {
  const statusUri =
    typeof status?.url === "string" && status.url.trim()
      ? status.url.trim()
      : null;
  const fallbackUri =
    typeof recorderUri === "string" && recorderUri.trim()
      ? recorderUri.trim()
      : null;

  if (statusUri) {
    return statusUri;
  }

  if (fallbackUri) {
    return fallbackUri;
  }

  throw new Error("No se generó el archivo de audio.");
}
