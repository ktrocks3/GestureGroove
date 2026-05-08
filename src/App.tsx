import './App.css'
import {Spotify} from "./spotify.tsx";

function App() {
    return (
        <>
            <section id="center">
                <h1>Gesture Groove</h1>
                {/*Outline is just so I see where the flexbox stuff is*/}
                <div className="flex w-9/10 justify-between items-stretch gap-10 flex-1">
                    <div className="outline-4 w-full">
                        This is where my camera is going to go
                    </div>
                    <div className="outline-4 w-full">
                        This is where the current spotify playback stuff is going to go
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
                    <Spotify/>
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
