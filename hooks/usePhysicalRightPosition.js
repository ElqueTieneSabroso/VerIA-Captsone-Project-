import { useEffect, useState } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';

const BUTTON_SIZE = 88;
const EDGE_OFFSET = 20;

function styleForOrientation(orientation) {
  const half = BUTTON_SIZE / 2;

  switch (orientation) {
    case ScreenOrientation.Orientation.PORTRAIT_UP:
      return {
        position: 'absolute',
        right: EDGE_OFFSET,
        top: '50%',
        marginTop: -half,
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
      };
    case ScreenOrientation.Orientation.PORTRAIT_DOWN:
      return {
        position: 'absolute',
        left: EDGE_OFFSET,
        top: '50%',
        marginTop: -half,
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
      };
    case ScreenOrientation.Orientation.LANDSCAPE_LEFT:
      return {
        position: 'absolute',
        top: EDGE_OFFSET,
        left: '50%',
        marginLeft: -half,
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
      };
    case ScreenOrientation.Orientation.LANDSCAPE_RIGHT:
      return {
        position: 'absolute',
        bottom: EDGE_OFFSET,
        left: '50%',
        marginLeft: -half,
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
      };
    default:
      return {
        position: 'absolute',
        right: EDGE_OFFSET,
        top: '50%',
        marginTop: -half,
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
      };
  }
}

export function usePhysicalRightPosition() {
  const [orientation, setOrientation] = useState(
    ScreenOrientation.Orientation.PORTRAIT_UP,
  );

  useEffect(() => {
    ScreenOrientation.getOrientationAsync().then(setOrientation);

    const subscription = ScreenOrientation.addOrientationChangeListener(
      (event) => {
        setOrientation(event.orientationInfo.orientation);
      },
    );

    return () => subscription.remove();
  }, []);

  return styleForOrientation(orientation);
}
