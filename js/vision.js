import { GestureRecognizer, FilesetResolver, DrawingUtils } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3';

let gestureRecognizer = null;
let lastVideoTime = -1;
let results = null;
let webcamRunning = true;


const videoRef = document.getElementById("webcam");
const canvasRef = document.getElementById("outputCanvas");

let canvasCtx = null;

const videoWidth = 320;
const videoHeight = 240;



const constraints = { video: true };

navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    const video = videoRef;
    const canvas = canvasRef;
    video.srcObject = stream;
    video.addEventListener('loadeddata', () => {
        canvasCtx = canvas.getContext('2d');
        predictWebcam(); 
        // videoRef.style.display = 'block';
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
}

const predictWebcam = async () => {
    const video = videoRef;
    const canvas = canvasRef;
    const webcamElement = video;

    const nowInMs = Date.now();

    if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        results = gestureRecognizer.recognizeForVideo(video, nowInMs);
    }

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    const drawingUtils = new DrawingUtils(canvasCtx);

    canvas.style.height = videoHeight + 'px';
    webcamElement.style.height = videoHeight + 'px';
    canvas.style.width = videoWidth + 'px';
    webcamElement.style.width = videoWidth + 'px';

    if (results.landmarks) {
        for (const landmarks of results.landmarks) {
        drawingUtils.drawConnectors(
            landmarks,
            GestureRecognizer.HAND_CONNECTIONS,
            { color: '#00FF00', lineWidth: 5 }
        );
        drawingUtils.drawLandmarks(landmarks, {
            color: '#FF0000',
            lineWidth: 2
        });
        }
    }

    canvasCtx.restore();

    if (webcamRunning) {
        window.requestAnimationFrame(() => predictWebcam());
    }
}

createGestureRecognizer();

// ngOnDestroy() {
//     this.webcamRunning = false;
//     if (this.gestureRecognizer) {
//         this.gestureRecognizer.close();
//     }
//     const video = this.videoRef.nativeElement;
//     if (video.srcObject) {
//         const stream = video.srcObject as MediaStream;
//         stream.getTracks().forEach(track => track.stop());
//         video.srcObject = null;
//     }
// }