import './App.css'
import {SpotifyLogin} from "./spotifyLogin.tsx";
import {SpotifyPlayer} from "./spotifyPlayer.tsx";
import {CameraPreview} from "./cameraPreview.tsx";
import {useRef, useState} from "react";
import {useCamera} from "./hooks/useCamera.ts";
import {useHandLandmarker} from "./hooks/useHandLandmarker.ts";
import {useSpotifyPlayer} from "./hooks/useSpotifyPlayer.ts";
import {createGestureDetector, detectPinchVolume} from "./hooks/useGestureDetection.ts";

function App() {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const gestureDetectorRef = useRef(createGestureDetector());

    const error: string | null = useCamera(videoRef)
    const spotify = useSpotifyPlayer();


    const tokenExpired = () => {
        const token = localStorage.getItem('spotify_token_expires_at');
        if (token == null) return true;
        const expiresAt = Number(token);
        // eslint-disable-next-line react-hooks/purity
        return !expiresAt || Date.now() >= expiresAt - 60_000;
    }

    const [loggedIn, setLoggedIn] = useState(localStorage.getItem('access_token') !== null && !tokenExpired());


    useHandLandmarker(videoRef, canvasRef, (hands) => {
        const hand = hands[0];
        const gesture = gestureDetectorRef.current.update(hand);

        if (gesture) {
            console.log("Gesture:", gesture);
            switch (gesture) {
                case "open_close_open":
                    spotify.pauseOrPlay().then(() => "Paused/Played");
                    break;
                case "swipe_right":
                    spotify.nextTrack().then(() => "Next");
                    break;
                case "swipe_left":
                    spotify.previousTrack().then(() => "Previous");
                    break;
            }
        }


        const pinchVolume = detectPinchVolume(hand);

        if (pinchVolume?.active) {
            spotify.setVolume(pinchVolume.volume);
        }
    });


    return (
        <>
            <section id="center">
                <h1>Gesture Groove</h1>

                <div className="flex w-9/10 justify-between items-stretch gap-10 flex-1">
                    <div className="w-full flex items-center justify-center">
                        <CameraPreview videoRef={videoRef} error={error} canvasRef={canvasRef}/>
                    </div>
                    <div className="w-full flex items-center justify-center">
                        <SpotifyPlayer spotify={spotify} loggedIn={loggedIn}/>
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
                    <SpotifyLogin
                        loggedIn={loggedIn}
                        setLoggedIn={setLoggedIn}
                        spotify={spotify}
                    />
                </div>
                <div id="social">
                    <div className="flex items-center justify-start gap-2">
                        <svg className="h-5 w-5 shrink-0 translate-y-px-1" role="presentation" aria-hidden="true">
                            <use href="/icons.svg#social-icon"/>
                        </svg>

                        <h2 className="m-0 leading-none">Connect</h2>
                    </div>

                    <div className="contact-links">
                        <a href="https://github.com/ktrocks3" target="_blank" rel="noreferrer">
                            <span>GitHub</span>
                            <strong>@ktrocks3</strong>
                        </a>

                        <a href="https://kishant.nl/" target="_blank" rel="noreferrer">
                            <span>Website</span>
                            <strong>kishant.nl</strong>
                        </a>

                        <a href="mailto:kishan@kishant.nl">
                            <span>Email</span>
                            <strong>kishan@kishant.nl</strong>
                        </a>

                        <a href="mailto:kishanthakurani2003@gmail.com">
                            <span>Backup Email</span>
                            <strong>Gmail</strong>
                        </a>

                        <a href="https://discord.com/users/251107491952197632" target="_blank" rel="noreferrer">
                            <span>Discord</span>
                            <strong>ktrocks2</strong>
                        </a>
                    </div>
                </div>
            </section>

            <div className="ticks"></div>
            <section id="spacer"></section>
        </>
    )
}

export default App
