import { type RefObject, useEffect } from "react";
import {
    DrawingUtils,
    FilesetResolver,
    HandLandmarker,
} from "@mediapipe/tasks-vision";

export function useHandLandmarker(
    videoRef: RefObject<HTMLVideoElement | null>,
    canvasRef: RefObject<HTMLCanvasElement | null>
) {
    useEffect(() => {
        let handLandmarker: HandLandmarker | null = null;
        let animationFrameId: number | null = null;
        let cancelled = false;

        async function setupHandLandmarker() {
            try {
                const video = videoRef.current;
                const canvas = canvasRef.current;

                if (!video || !canvas) return;

                const context = canvas.getContext("2d");
                if (!context) {
                    return;
                }

                const drawingUtils = new DrawingUtils(context);

                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
                );

                if (cancelled) return;

                handLandmarker = await HandLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: "/models/hand_landmarker.task",
                        delegate: "CPU",
                    },
                    runningMode: "VIDEO",
                    numHands: 1,
                    minHandDetectionConfidence: 0.5,
                    minHandPresenceConfidence: 0.5,
                    minTrackingConfidence: 0.5,
                });


                const renderLoop = () => {
                    if (cancelled || !handLandmarker) return;


                    if (
                        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
                        video.videoWidth > 0 &&
                        video.videoHeight > 0
                    ) {
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;

                        context.clearRect(0, 0, canvas.width, canvas.height);

                        const results = handLandmarker.detectForVideo(
                            video,
                            performance.now()
                        );


                        for (const hand of results.landmarks) {
                            drawingUtils.drawConnectors(
                                hand,
                                HandLandmarker.HAND_CONNECTIONS,
                                {
                                    color: "#00ff00",
                                    lineWidth: 5,
                                }
                            );

                            drawingUtils.drawLandmarks(hand, {
                                color: "#ff0000",
                                lineWidth: 2,
                                radius: 5,
                            });
                        }
                    }

                    animationFrameId = requestAnimationFrame(renderLoop);
                };

                renderLoop();
            } catch (error) {
                console.error("HandLandmarker setup failed:", error);
            }
        }

        void setupHandLandmarker();

        return () => {
            cancelled = true;

            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
            }

            handLandmarker?.close();
        };
    }, [videoRef, canvasRef]);
}