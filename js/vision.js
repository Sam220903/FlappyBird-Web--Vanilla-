import { GestureRecognizer, FilesetResolver, DrawingUtils } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3';
import { resetGame, jump } from './game.js';

let gestureRecognizer = null;
let lastVideoTime = -1;
let results = null;
let webcamRunning = true;

const videoRef = document.getElementById("webcam");
const canvasRef = document.getElementById("outputCanvas");

let canvasCtx = null;

const videoWidth = 320;
const videoHeight = 240;

let frameSkip = 0;

let lastGestures = [];
let previousGesture = '';

const constraints = { video: true };

navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
  videoRef.srcObject = stream;
  videoRef.addEventListener('loadeddata', () => {
    canvasCtx = canvasRef.getContext('2d');
    createGestureRecognizer().then(() => {
      predictWebcam();
      canvasRef.style.display = 'block';
    });
  });
});

const createGestureRecognizer = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  );
  gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
      delegate: 'GPU'
    },
    runningMode: 'VIDEO'
  });
};

const predictWebcam = async () => {
  if (!gestureRecognizer) return;

  const nowInMs = Date.now();

  if (videoRef.currentTime !== lastVideoTime) {
    frameSkip++;
    if (frameSkip % 3 === 0) {
      lastVideoTime = videoRef.currentTime;
      results = gestureRecognizer.recognizeForVideo(videoRef, nowInMs);
    }
  }

  if (results && results.gestures && results.gestures.length > 0) {
    const currentGesture = results.gestures[0][0].categoryName;

    if (currentGesture !== 'None' && detectGestureChange(currentGesture)) {
      lastGestures.push(currentGesture);
      if (lastGestures.length > 3) lastGestures.shift();

      if (lastGestures.length === 3 && detectPulse()) {
        // lastGestures = ["Open_Palm"]; // reset
        jump();
      }

    }

    if (currentGesture == ['Thumb_Up']) resetGame();
  }

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasRef.width, canvasRef.height);
  const drawingUtils = new DrawingUtils(canvasCtx);

  canvasRef.style.height = videoHeight + "px";
  videoRef.style.height = videoHeight + "px";
  canvasRef.style.width = videoWidth + "px";
  videoRef.style.width = videoWidth + "px";

  if (results && results.landmarks) {
    for (const landmarks of results.landmarks) {
      drawingUtils.drawConnectors(
        landmarks,
        GestureRecognizer.HAND_CONNECTIONS,
        { color: "#00FF00", lineWidth: 3 }
      );
      drawingUtils.drawLandmarks(landmarks, {
        color: "#FF0000",
        lineWidth: 2,
      });
    }
  }

  canvasCtx.restore();

  if (webcamRunning) {
    window.requestAnimationFrame(predictWebcam);
  }
};

const detectPulse = () => {
  return (
    lastGestures[0] === 'Open_Palm' &&
    lastGestures[1] === 'Closed_Fist' &&
    lastGestures[2] === 'Open_Palm'
  );
};

const detectGestureChange = (currentGesture) => {
  if (previousGesture !== currentGesture) {
    previousGesture = currentGesture;
    return true;
  }
  return false;
};

export { detectPulse };
