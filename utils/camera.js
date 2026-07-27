export const MAX_CAPTURE_SIDE = 720;

export function parsePictureSize(size) {
  if (typeof size !== "string") {
    return null;
  }

  const [width, height] = size.split("x").map(Number);

  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return null;
  }

  return {
    size,
    width,
    height,
    longestSide: Math.max(width, height),
  };
}

export function pickPictureSize(sizes, maxSide = MAX_CAPTURE_SIDE) {
  if (!Array.isArray(sizes) || !Number.isFinite(maxSide) || maxSide <= 0) {
    return undefined;
  }

  const parsedSizes = sizes
    .map(parsePictureSize)
    .filter(Boolean)
    .sort((a, b) => b.longestSide - a.longestSide);

  if (!parsedSizes.length) {
    return undefined;
  }

  return (
    parsedSizes.find((item) => item.longestSide <= maxSide) ??
    parsedSizes[parsedSizes.length - 1]
  ).size;
}
