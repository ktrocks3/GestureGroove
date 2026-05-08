import './App.css'
import {SpotifyLogin} from "./spotifyLogin.tsx";
import {SpotifyPlayer} from "./spotifyPlayer.tsx";
import {CameraPreview} from "./cameraPreview.tsx";
import {useRef} from "react";
import {useCamera} from "./hooks/useCamera.ts";
import {useHandLandmarker} from "./hooks/useHandLandmarker.ts";
import {useSpotifyPlayer} from "./hooks/useSpotifyPlayer.ts";
import {classifyHandPose, createGestureDetector} from "./hooks/useGestureDetection.ts";

function App() {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const gestureDetectorRef = useRef(createGestureDetector());

    const error: string | null = useCamera(videoRef)

    useHandLandmarker(videoRef, canvasRef, (hands) => {
        const hand = hands[0];

        const pose = hand
            ? classifyHandPose(hand)
            : "unknown";

        console.log("hand", pose);
        const gesture = gestureDetectorRef.current.update(pose);

        if (gesture) {
            console.log("Gesture:", gesture);
        }
    });


    const spotify = useSpotifyPlayer();


    return (
        <>
            <section id="center">
                <h1>Gesture Groove</h1>
                {/*Outline is just so I see where the flexbox stuff is*/}
                <div className="flex w-9/10 justify-between items-stretch gap-10 flex-1">
                    <div className="w-full flex items-center justify-center">
                        <CameraPreview videoRef={videoRef} error={error} canvasRef={canvasRef}/>
                    </div>
                    <div className="w-full flex items-center justify-center">
                        <SpotifyPlayer spotify={spotify}/>
                    </div>
                </div>

            </section>

            <div className="ticks"></div>

            <section id="next-steps">
                <div id="docs">
                    <div className="flex items-center justify-start gap-2">
                        <svg
                            className="h-5 w-5 shrink-0 translate-y-px-1"
                            role="presentation"
                            aria-hidden="true"
                        >
                            <use href="/icons.svg#spotify-icon"/>
                        </svg>

                        <h2 className="m-0 leading-none">Login</h2>
                    </div>
                    <SpotifyLogin/>
                </div>
                <div id="social">
                    <div className="flex items-center justify-start gap-2">

                        <svg className="h-5 w-5 shrink-0 translate-y-px-1" role="presentation" aria-hidden="true">
                            <use href="/icons.svg#social-icon"></use>
                        </svg>

                        <h2 className="m-0 leading-none">Connect</h2>
                    </div>
                    <ul>
                        Gotta add the contact stuff here
                    </ul>
                </div>
            </section>

            <div className="ticks"></div>
            <section id="spacer"></section>
        </>
    )
}

export default App
