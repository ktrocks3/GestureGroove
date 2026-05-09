import type {useSpotifyPlayer} from "./hooks/useSpotifyPlayer.ts";

export function SpotifyPlayer({spotify,loggedIn}: {spotify: ReturnType<typeof useSpotifyPlayer>; loggedIn: boolean; }) {
    const {
        track,
        playing,
        volume,
        displayedProgressMs,
        progress,
        getPlaying,
        nextTrack,
        previousTrack,
        pauseOrPlay,
        setVolume,
    } = spotify;

    const authRequired = !loggedIn;

    const hasTrack =
        loggedIn &&
        Boolean(track?.name || track?.artist || track?.album || track?.image);

    function formatTime(ms: number) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }

    return (
        <section
            className={`spotify-player w-full max-w-xl rounded-3xl border border-white/10 bg-zinc-950/90 p-4 text-white shadow-2xl shadow-black/40 backdrop-blur ${
                authRequired ? "spotify-player-locked" : ""
            } ${!hasTrack ? "spotify-player-empty" : ""}`}
        >
            <div className="flex items-center gap-4">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-zinc-800 shadow-lg">
                    {hasTrack && track.image ? (
                        <img
                            src={track.image}
                            alt={`${track.album || "Current"} album cover`}
                            className="size-full object-cover"
                        />
                    ) : (
                        <div className="empty-album-art">
                            <svg className="size-8">
                                <use href="/icons.svg#spotify-icon"/>
                            </svg>
                        </div>
                    )}

                    {playing && hasTrack && (
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-emerald-400"/>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div
                        className={`mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] ${
                            hasTrack ? "text-emerald-400" : "text-zinc-500"
                        }`}
                    >
                        <svg className="size-4">
                            <use href="/icons.svg#spotify-icon"/>
                        </svg>
                        {authRequired ? "Spotify disconnected" : hasTrack ? "Now Playing" : "Idle"}
                    </div>

                    <h2 className="truncate text-lg font-semibold text-white">
                        {authRequired ? "Log in to Spotify" : hasTrack ? track.name : "No track playing"}
                    </h2>

                    <p className="truncate text-sm text-zinc-400">
                        {authRequired
                            ? "Connect your account below to enable playback controls and gestures"
                            : hasTrack
                                ? `${track.artist} · ${track.album}`
                                : "Start Spotify playback, then refresh"}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => getPlaying()}
                    disabled={authRequired}
                    aria-label="Refresh"
                    className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-35"
                >
                    <svg className="size-5">
                        <use href="/icons.svg#refresh-icon"/>
                    </svg>
                </button>
            </div>

            <div className="mt-5">
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                        className={`h-full rounded-full transition-all ${
                            hasTrack ? "bg-emerald-400" : "bg-zinc-700"
                        }`}
                        style={{width: `${hasTrack ? progress : 0}%`}}
                    />
                </div>

                <div className="mt-2 flex justify-between text-xs text-zinc-500">
                    <span>{formatTime(hasTrack ? displayedProgressMs : 0)}</span>
                    <span>{formatTime(hasTrack ? track.durationMs : 0)}</span>
                </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={previousTrack}
                        disabled={!hasTrack}
                        aria-label="Previous track"
                        className="player-control grid size-11 place-items-center rounded-full bg-white/5 text-zinc-300 transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-35"
                    >
                        <svg className="size-6">
                            <use href="/icons.svg#previous-icon"/>
                        </svg>
                    </button>

                    <button
                        type="button"
                        onClick={pauseOrPlay}
                        disabled={!hasTrack}
                        aria-label={playing ? "Pause track" : "Play track"}
                        className="player-main-control grid size-14 place-items-center rounded-full bg-white text-zinc-950 shadow-lg shadow-white/10 transition hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-35"
                    >
                        <svg className="size-7">
                            <use href={playing ? "/icons.svg#pause-icon" : "/icons.svg#play-icon"}/>
                        </svg>
                    </button>

                    <button
                        type="button"
                        onClick={nextTrack}
                        disabled={!hasTrack}
                        aria-label="Next track"
                        className="player-control grid size-11 place-items-center rounded-full bg-white/5 text-zinc-300 transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-35"
                    >
                        <svg className="size-6">
                            <use href="/icons.svg#next-icon"/>
                        </svg>
                    </button>
                </div>

                <div className="hidden items-center gap-3 sm:flex">
                    <svg className="size-5 text-zinc-400">
                        <use href="/icons.svg#volume-icon"/>
                    </svg>

                    <input
                        type="range"
                        min={0}
                        max={100}
                        value={volume}
                        aria-label="Volume"
                        onChange={(event) => {
                            setVolume(Number(event.currentTarget.value));
                        }}
                        className="h-1.5 w-24 cursor-pointer accent-emerald-400"
                    />
                </div>
            </div>
        </section>
    );
}