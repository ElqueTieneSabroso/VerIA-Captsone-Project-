import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AccessibilityInfo,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as Speech from 'expo-speech';
import { usePhysicalRightPosition } from '../hooks/usePhysicalRightPosition';
import { describeImageWithOllama } from '../services/ollama';

export default function CameraScreen() {
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const captureButtonStyle = usePhysicalRightPosition();

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

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || !cameraReady || isProcessing) {
      return;
    }

    setIsProcessing(true);
    announce('Capturing image. Please wait.');

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,
        shutterSound: true,
      });

      if (!photo?.base64) {
        throw new Error('Could not capture image data.');
      }

      announce('Analyzing image with AI.');
      const description = await describeImageWithOllama(photo.base64);

      announce('Reading description aloud.');
      await new Promise((resolve, reject) => {
        Speech.speak(description, {
          language: 'en',
          onDone: resolve,
          onStopped: resolve,
          onError: (error) => reject(error),
        });
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Something went wrong while analyzing the image.';
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
        onCameraReady={() => setCameraReady(true)}
      />

      {isProcessing && (
        <View style={styles.processingOverlay} accessibilityLiveRegion="polite">
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.processingText}>{statusMessage}</Text>
        </View>
      )}

      <Pressable
        style={({ pressed }) => [
          styles.captureButton,
          captureButtonStyle,
          pressed && styles.captureButtonPressed,
          isProcessing && styles.captureButtonDisabled,
        ]}
        onPress={handleCapture}
        disabled={isProcessing || !cameraReady}
        accessibilityRole="button"
        accessibilityLabel="Capture and describe scene"
        accessibilityHint="Takes a photo and reads an AI description aloud. Button stays on the right side of the phone."
        accessibilityState={{ disabled: isProcessing || !cameraReady, busy: isProcessing }}
      >
        <View style={styles.captureButtonInner} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  permissionText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 26,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    minHeight: 56,
    justifyContent: 'center',
  },
  permissionButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  captureButton: {
    borderRadius: 44,
    borderWidth: 4,
    borderColor: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  captureButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
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
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 5,
  },
  processingText: {
    color: '#ffffff',
    fontSize: 18,
    marginTop: 16,
    textAlign: 'center',
  },
});
