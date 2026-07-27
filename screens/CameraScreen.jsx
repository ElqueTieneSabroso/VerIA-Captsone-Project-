import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AccessibilityInfo,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
} from "expo-audio";
import * as Haptics from "expo-haptics";
import * as ScreenOrientation from "expo-screen-orientation";
import * as Speech from "expo-speech";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  analyzeImageWithBackend,
  analyzeVoiceCommandWithBackend,
} from "../services/ollama";
import { resolveCompletedRecordingUri } from "../utils/audio";
import { pickPictureSize } from "../utils/camera";

const DOUBLE_PRESS_DELAY_MS = 300;
const VOICE_RECORDING_OPTIONS = {
  ...RecordingPresets.HIGH_QUALITY,
  directory: "document",
};

export default function CameraScreen({ navigation }) {
  const cameraRef = useRef(null);
  const audioRecorder = useAudioRecorder(VOICE_RECORDING_OPTIONS);
  const voicePressHeldRef = useRef(false);
  const voiceRecordingRef = useRef(false);
  const activeRequestRef = useRef(null);
  const captureRunRef = useRef(0);
  const pressTimerRef = useRef(null);
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [pictureSize, setPictureSize] = useState();
  const [capturedPhotoUri, setCapturedPhotoUri] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Listo para capturar.");
  const [lastDescription, setLastDescription] = useState("");
  const [hasError, setHasError] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);

  useEffect(() => {
    ScreenOrientation.unlockAsync().catch(() => {});

    return () => {
      voicePressHeldRef.current = false;
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
      }
      if (voiceRecordingRef.current) {
        voiceRecordingRef.current = false;
        audioRecorder.stop().catch(() => {});
      }
      setAudioModeAsync({ allowsRecording: false }).catch(() => {});
      activeRequestRef.current?.abort();
      Speech.stop();
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      ).catch(() => {});
    };
  }, [audioRecorder]);

  const announce = useCallback((message) => {
    setStatusMessage(message);
    AccessibilityInfo.announceForAccessibility(message);
  }, []);

  const vibrate = useCallback((type = "selection") => {
    if (type === "cancel") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
        () => {},
      );
      return;
    }

    if (type === "success") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      return;
    }

    Haptics.selectionAsync().catch(() => {});
  }, []);

  //con esto cancelamos, da valores falsos y cancela wasaaa
  const cancelCurrentAction = useCallback(() => {
    captureRunRef.current += 1;
    activeRequestRef.current?.abort();
    activeRequestRef.current = null;
    Speech.stop();
    setIsProcessing(false);
    setHasError(false);
    setLastDescription("");
    setCapturedPhotoUri(null);
    vibrate("cancel");
    announce("Descripcion cancelada. Presiona una vez para tomar otra foto.");
  }, [announce, vibrate]);

  const rereadDescription = useCallback(() => {
    if (!lastDescription) {
      vibrate("selection");
      announce("No hay descripcion para repetir.");
      return;
    }

    Speech.stop();
    vibrate("selection");
    announce("Repitiendo descripcion.");
    Speech.speak(lastDescription, {
      language: "es-MX",
      rate: 0.8,
      onError: () => {},
    });
  }, [announce, lastDescription, vibrate]);

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
    if (!cameraReady || !cameraRef.current) {
      return;
    }

    activeRequestRef.current?.abort();
    Speech.stop();
    vibrate("selection");

    const runId = captureRunRef.current + 1;
    const requestController = new AbortController();

    captureRunRef.current = runId;
    activeRequestRef.current = requestController;
    setIsProcessing(true);
    setHasError(false);
    setLastDescription("");
    setCapturedPhotoUri(null);
    announce("Capturando imagen. Espera un momento.");

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.25,
        shutterSound: true,
      });

      if (!photo?.base64) {
        throw new Error("No se pudo capturar la imagen.");
      }

      if (captureRunRef.current !== runId) {
        return;
      }

      setCapturedPhotoUri(photo.uri ?? null);
      announce("Analizando imagen con inteligencia artificial.");
      const description = await analyzeImageWithBackend(
        photo.base64,
        requestController.signal,
      );

      if (captureRunRef.current !== runId) {
        return;
      }

      announce("Leyendo descripcion en voz alta.");
      setLastDescription(description);
      vibrate("success");
      await new Promise((resolve, reject) => {
        Speech.speak(description, {
          language: "es-MX",
          onDone: resolve,
          onStopped: resolve,
          onError: (error) => reject(error),
        });
      });

      if (captureRunRef.current !== runId) {
        return;
      }

      setStatusMessage(description);
    } catch (error) {
      if (requestController.signal.aborted || captureRunRef.current !== runId) {
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : "Algo salio mal al analizar la imagen.";
      setHasError(true);
      announce(`Error. ${message}`);
    } finally {
      if (captureRunRef.current === runId) {
        activeRequestRef.current = null;
        setIsProcessing(false);
      }
    }
  }, [announce, cameraReady, vibrate]);

  const startVoiceCommand = useCallback(async () => {
    if (!cameraReady || isProcessing || voiceRecordingRef.current) return;
    voicePressHeldRef.current = true;

    try {
      const permissionStatus =
        await AudioModule.requestRecordingPermissionsAsync();
      if (!permissionStatus.granted) {
        announce("Se necesita permiso para usar el microfono.");
        return;
      }

      Speech.stop();
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
      await audioRecorder.prepareToRecordAsync();
      if (!voicePressHeldRef.current) {
        await setAudioModeAsync({ allowsRecording: false });
        return;
      }
      audioRecorder.record();
      voiceRecordingRef.current = true;
      setIsVoiceRecording(true);
      vibrate("selection");
      announce("Escuchando. Suelta el boton al terminar.");
    } catch (error) {
      setHasError(true);
      announce(`Error. ${error.message || "No se pudo iniciar el microfono."}`);
    }
  }, [announce, audioRecorder, cameraReady, isProcessing, vibrate]);

  const finishVoiceCommand = useCallback(async () => {
    voicePressHeldRef.current = false;
    if (!voiceRecordingRef.current) return;

    voiceRecordingRef.current = false;
    setIsVoiceRecording(false);
    setIsProcessing(true);
    setHasError(false);
    announce("Procesando instruccion de voz.");

    const runId = captureRunRef.current + 1;
    const requestController = new AbortController();
    captureRunRef.current = runId;
    activeRequestRef.current = requestController;

    try {
      await audioRecorder.stop();
      const recorderStatus = audioRecorder.getStatus();
      const audioUri = resolveCompletedRecordingUri(
        recorderStatus,
        audioRecorder.uri,
      );

      const photo = await cameraRef.current?.takePictureAsync({
        base64: true,
        quality: 0.25,
        shutterSound: false,
      });
      if (!photo?.base64) throw new Error("No se pudo capturar la imagen.");

      setCapturedPhotoUri(photo.uri ?? null);
      const { transcription, result } = await analyzeVoiceCommandWithBackend(
        audioUri,
        photo.base64,
        requestController.signal,
      );

      if (captureRunRef.current !== runId) return;
      setLastDescription(result);
      vibrate("success");
      announce(`Instruccion: ${transcription}. ${result}`);
      Speech.speak(result, { language: "es-MX", rate: 0.8, onError: () => {} });
      setStatusMessage(result);
    } catch (error) {
      if (requestController.signal.aborted) return;
      setHasError(true);
      announce(`Error. ${error.message || "Fallo la instruccion de voz."}`);
    } finally {
      await setAudioModeAsync({ allowsRecording: false }).catch(() => {});
      if (captureRunRef.current === runId) {
        activeRequestRef.current = null;
        setIsProcessing(false);
      }
    }
  }, [announce, audioRecorder, vibrate]);

  const handleButtonPress = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
      cancelCurrentAction();
      return;
    }

    pressTimerRef.current = setTimeout(() => {
      pressTimerRef.current = null;

      if (isProcessing) {
        rereadDescription();
        return;
      }

      if (lastDescription) {
        rereadDescription();
        return;
      }

      handleCapture();
    }, DOUBLE_PRESS_DELAY_MS);
  }, [
    cancelCurrentAction,
    handleCapture,
    isProcessing,
    lastDescription,
    rereadDescription,
  ]);

  if (!permission) {
    return (
      <View style={styles.centered} testID="camera-permission-loading">
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered} testID="camera-permission-screen">
        <Text style={styles.permissionText} accessibilityRole="text">
          Camera access is required to describe your surroundings.
        </Text>
        <Pressable
          style={styles.permissionButton}
          onPress={requestPermission}
          accessibilityRole="button"
          accessibilityLabel="Grant camera permission"
          testID="camera-permission-button"
        >
          <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="camera-screen">
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        pictureSize={pictureSize}
        onCameraReady={handleCameraReady}
      />

      {capturedPhotoUri && isProcessing ? (
        <Image
          source={{ uri: capturedPhotoUri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ) : null}

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
          { bottom: Math.max(insets.bottom + 16, 20) },
          pressed && styles.captureButtonPressed,
        ]}
        onPress={handleButtonPress}
        disabled={!cameraReady}
        accessibilityRole="button"
        accessibilityLabel="Capture and describe scene"
        testID="camera-capture-button"
        accessibilityHint="Press once to re-read the latest description. Press twice to cancel the current analysis or speech."
        accessibilityState={{
          disabled: !cameraReady,
          busy: isProcessing,
        }}
      >
        <Image
          source={require("../assets/ICON_CAMERA.png")}
          style={styles.captureButtonIcon}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      </Pressable>
      <Pressable
        style={({ pressed }) => [
          styles.voiceButton,
          { bottom: Math.max(insets.bottom + 16, 20) },
          pressed && styles.captureButtonPressed,
          (pressed || isVoiceRecording) && styles.voiceButtonActive,
        ]}
        onPressIn={startVoiceCommand}
        onPressOut={finishVoiceCommand}
        disabled={!cameraReady || isProcessing}
        accessibilityRole="button"
        accessibilityLabel="Dar instruccion por voz"
        testID="camera-voice-button"
        accessibilityHint="Manten presionado mientras hablas y suelta para enviar la instruccion."
        accessibilityState={{
          disabled: !cameraReady || isProcessing,
          busy: isVoiceRecording,
        }}
      >
        <Image
          source={require("../assets/ICON_MICROPHONE.png")}
          style={[
            styles.voiceButtonIcon,
            isVoiceRecording && styles.voiceButtonIconActive,
          ]}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      </Pressable>
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => navigation.navigate("Settings")}
        testID="camera-settings-button"
        accessibilityRole="button"
        accessibilityLabel="Abrir configuración"
      >
        <Text style={styles.settingsIcon}>⚙</Text>
      </TouchableOpacity>
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
    left: 16,
    width: 116,
    height: 96,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  captureButtonIcon: {
    width: 108,
    height: 84,
  },
  captureButtonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.94 }],
  },
  voiceButton: {
    position: "absolute",
    right: 16,
    width: 116,
    height: 96,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  voiceButtonActive: {
    transform: [{ scale: 1.06 }],
  },
  voiceButtonIcon: {
    width: 108,
    height: 84,
  },
  voiceButtonIconActive: {
    opacity: 0.68,
  },
  processingOverlay: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 56,
    backgroundColor: "rgba(0, 0, 0, 0.68)",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
  },
  processingText: {
    color: "#ffffff",
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    textAlign: "left",
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
  settingsButton: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#1E88E5",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6, // Android
    shadowColor: "#000", // iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 100,
  },

  settingsIcon: {
    fontSize: 28,
    color: "#FFF",
  },
});
