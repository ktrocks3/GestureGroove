import type {useSpotifyPlayer} from "./hooks/useSpotifyPlayer.ts";

export function SpotifyPlayer({spotify}: { spotify: ReturnType<typeof useSpotifyPlayer> }) {

    const {
        track,
        playing,
        displayedProgressMs,
        progress,
        getPlaying,
        nextTrack,
        previousTrack,
        pauseOrPlay,
        setVolume,
    } = spotify;

    function formatTime(ms: number) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }

    return (
        <section
            className="w-full max-w-xl rounded-3xl border border-white/10 bg-zinc-950/90 p-4 text-white shadow-2xl shadow-black/40 backdrop-blur">
            <div className="flex items-center gap-4">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-zinc-800 shadow-lg">
                    <img
                        src={track.image}
                        alt={`${track.album} album cover`}
                        className="size-full object-cover"
                    />

                    {track.isPlaying && (
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-emerald-400"/>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div
                        className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-emerald-400">
                        <svg className="size-4">
                            <use href="/icons.svg#spotify-icon"/>
                        </svg>
                        Now Playing
                    </div>

                    <h2 className="truncate text-lg font-semibold text-white">
                        {track.name}
                    </h2>

                    <p className="truncate text-sm text-zinc-400">
                        {track.artist} · {track.album}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => getPlaying()}
                    aria-label={"Refresh"}
                    className={`grid size-10 place-items-center rounded-full border transition`}
                >
                    <svg className="size-5">
                        <use href="/icons.svg#refresh-icon"/>
                    </svg>
                </button>
            </div>

            <div className="mt-5">
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                        className="h-full rounded-full bg-emerald-400 transition-all"
                        style={{width: `${progress}%`}}
                    />
                </div>

                <div className="mt-2 flex justify-between text-xs text-zinc-500">
                    <span>{formatTime(displayedProgressMs)}</span>
                    <span>{formatTime(track.durationMs)}</span>
                </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={previousTrack}
                        aria-label="Previous track"
                        className="grid size-11 place-items-center rounded-full bg-white/5 text-zinc-300 transition hover:bg-white/10 hover:text-white"
                    >
                        <svg className="size-6">
                            <use href="/icons.svg#previous-icon"/>
                        </svg>
                    </button>

                    <button
                        type="button"
                        onClick={pauseOrPlay}
                        aria-label={playing ? "Pause track" : "Play track"}
                        className="grid size-14 place-items-center rounded-full bg-white text-zinc-950 shadow-lg shadow-white/10 transition hover:scale-105 active:scale-95"
                    >
                        <svg className="size-7">
                            <use href={playing ? "/icons.svg#pause-icon" : "/icons.svg#play-icon"}/>
                        </svg>
                    </button>

                    <button
                        type="button"
                        onClick={nextTrack}
                        aria-label="Next track"
                        className="grid size-11 place-items-center rounded-full bg-white/5 text-zinc-300 transition hover:bg-white/10 hover:text-white"
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
                        defaultValue={70}
                        aria-label="Volume"
                        onPointerUp={(event) => {
                            setVolume(Number(event.currentTarget.value));
                        }}
                        className="h-1.5 w-24 cursor-pointer accent-emerald-400"
                    />
                </div>
            </div>
        </section>
    );

}