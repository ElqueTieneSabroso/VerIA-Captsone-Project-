import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AccessibilityInfo,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ScreenOrientation from "expo-screen-orientation";
import * as Speech from "expo-speech";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { analyzeImageWithBackend } from "../services/ollama";

const MAX_CAPTURE_SIDE = 1024;

function parsePictureSize(size) {
  const [width, height] = size.split("x").map(Number);

  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return null;
  }

  return {
    size,
    width,
    height,
    longestSide: Math.max(width, height),
  };
}

function pickPictureSize(sizes) {
  const parsedSizes = sizes
    .map(parsePictureSize)
    .filter(Boolean)
    .sort((a, b) => b.longestSide - a.longestSide);

  if (!parsedSizes.length) {
    return undefined;
  }

  return (
    parsedSizes.find((item) => item.longestSide <= MAX_CAPTURE_SIDE) ??
    parsedSizes[parsedSizes.length - 1]
  ).size;
}

export default function CameraScreen() {
  const cameraRef = useRef(null);
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [pictureSize, setPictureSize] = useState();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Listo para capturar.");
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    ScreenOrientation.unlockAsync();

    return () => {
      Speech.stop();
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      );
    };
  }, []);

  const announce = useCallback((message) => {
    setStatusMessage(message);
    AccessibilityInfo.announceForAccessibility(message);
  }, []);

  const handleCameraReady = useCallback(async () => {
    setCameraReady(false);

    try {
      const sizes = await cameraRef.current?.getAvailablePictureSizesAsync();
      const selectedSize = pickPictureSize(sizes ?? []);

      if (selectedSize) {
        setPictureSize(selectedSize);
      }
    } catch {
      setPictureSize(undefined);
    } finally {
      setCameraReady(true);
    }
  }, []);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || !cameraReady || isProcessing) {
      return;
    }

    setIsProcessing(true);
    setHasError(false);
    announce("Capturando imagen. Espera un momento.");

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.35,
        shutterSound: true,
      });

      if (!photo?.base64) {
        throw new Error("No se pudo capturar la imagen.");
      }

      announce("Analizando imagen con inteligencia artificial.");
      const description = await analyzeImageWithBackend(photo.base64);

      announce("Leyendo descripcion en voz alta.");
      await new Promise((resolve, reject) => {
        Speech.speak(description, {
          language: "es-MX",
          onDone: resolve,
          onStopped: resolve,
          onError: (error) => reject(error),
        });
      });

      setStatusMessage(description);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Algo salio mal al analizar la imagen.";
      setHasError(true);
      announce(`Error. ${message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [announce, cameraReady, isProcessing]);

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permissionText} accessibilityRole="text">
          Camera access is required to describe your surroundings.
        </Text>
        <Pressable
          style={styles.permissionButton}
          onPress={requestPermission}
          accessibilityRole="button"
          accessibilityLabel="Grant camera permission"
        >
          <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        pictureSize={pictureSize}
        onCameraReady={handleCameraReady}
      />

      {isProcessing && (
        <View style={styles.processingOverlay} accessibilityLiveRegion="polite">
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.processingText}>{statusMessage}</Text>
        </View>
      )}

      {!isProcessing && statusMessage ? (
        <View
          style={[styles.statusPanel, hasError && styles.statusPanelError]}
          accessibilityLiveRegion="polite"
        >
          <Text style={styles.statusText}>{statusMessage}</Text>
        </View>
      ) : null}

      <Pressable
        style={({ pressed }) => [
          styles.captureButton,
          { bottom: Math.max(insets.bottom + 12, 16) },
          pressed && styles.captureButtonPressed,
          isProcessing && styles.captureButtonDisabled,
        ]}
        onPress={handleCapture}
        disabled={isProcessing || !cameraReady}
        accessibilityRole="button"
        accessibilityLabel="Capture and describe scene"
        accessibilityHint="Takes a photo and reads an AI description aloud."
        accessibilityState={{
          disabled: isProcessing || !cameraReady,
          busy: isProcessing,
        }}
      >
        <View style={styles.captureButtonInner} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#ffffff",
  },
  permissionText: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 26,
  },
  permissionButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    minHeight: 56,
    justifyContent: "center",
  },
  permissionButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  captureButton: {
    position: "absolute",
    alignSelf: "center",
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 4,
    borderColor: "#ffffff",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  captureButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#ffffff",
  },
  captureButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    zIndex: 5,
  },
  processingText: {
    color: "#ffffff",
    fontSize: 18,
    marginTop: 16,
    textAlign: "center",
  },
  statusPanel: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 56,
    backgroundColor: "rgba(0, 0, 0, 0.68)",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    zIndex: 4,
  },
  statusPanelError: {
    backgroundColor: "rgba(145, 28, 28, 0.88)",
  },
  statusText: {
    color: "#ffffff",
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
  },
});
