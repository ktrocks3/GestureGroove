import {useCallback, useEffect, useRef, useState} from "react";

export function SpotifyPlayer() {
    const [track, setTrack] = useState<Track>({
        name: "",
        artist: "",
        album: "",
        durationMs: 0,
        image: "",
        progressMs: 0,
        isPlaying: false,
        lastFetchedAt: Date.now(),
    });

    const [playing, setPlaying] = useState<boolean>(false);
    const [, setTick] = useState(0);
    useEffect(() => {
        if (!playing) return;

        const interval = window.setInterval(() => {
            setTick((tick) => tick + 1);
        }, 500);

        return () => window.clearInterval(interval);
    }, [playing]);

    type Track = {
        name: string;
        artist: string;
        album: string;
        durationMs: number;
        image: string;
        progressMs: number;
        isPlaying: boolean;
        lastFetchedAt: number;
    };

    async function nextTrack() {
        const accessToken = localStorage.getItem("access_token");

        if (!accessToken) {
            throw new Error("No Spotify access token found");
        }


        const response = await fetch(
            `https://api.spotify.com/v1/me/player/next`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Spotify next request failed: ${response.status} ${errorText}`);
        }

        setTimeout(getPlaying, 500);

    }

    async function previousTrack() {
        const accessToken = localStorage.getItem("access_token");

        if (!accessToken) {
            throw new Error("No Spotify access token found");
        }

        const response = await fetch(
            "https://api.spotify.com/v1/me/player/previous",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Spotify previous request failed: ${response.status} ${errorText}`);
        }

        setTimeout(getPlaying, 500);
    }

    async function pauseOrPlay() {
        const accessToken = localStorage.getItem("access_token");

        if (playing) {
            const response = await fetch(
                `https://api.spotify.com/v1/me/player/pause`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Spotify pause request failed: ${response.status} ${errorText}`);
            }
            setPlaying(false);
        } else {
            const response = await fetch(
                `https://api.spotify.com/v1/me/player/play`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Spotify play request failed: ${response.status} ${errorText}`);
            }
            setPlaying(true);

        }
        setTimeout(getPlaying, 500);

    }

    async function setVolume(volume: number) {
        const accessToken = localStorage.getItem("access_token");

        if (!accessToken) {
            throw new Error("No Spotify access token found");
        }

        const clampedVolume = Math.max(0, Math.min(100, volume));

        const response = await fetch(
            `https://api.spotify.com/v1/me/player/volume?volume_percent=${clampedVolume}`,
            {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Spotify volume request failed: ${response.status} ${errorText}`);
        }

        console.log("Volume changed to " + volume);
    }


    function formatTime(ms: number) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }

    const playingTimeout = useRef<number | undefined>(undefined);

    const getPlaying = useCallback(async function fetchPlaying(): Promise<void> {
        window.clearTimeout(playingTimeout.current);

        try {
            const accessToken = localStorage.getItem("access_token");

            if (!accessToken) {
                throw new Error("No Spotify access token found");
            }

            const response = await fetch(
                "https://api.spotify.com/v1/me/player/currently-playing",
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            if (response.status === 204) {
                return;
            }

            if (response.status === 401) {
                throw new Error("Spotify token expired or invalid");
            }

            if (!response.ok) {
                throw new Error(
                    `Failed to fetch currently playing track: ${response.status}`
                );
            }

            const data = await response.json();

            setPlaying(data.is_playing);

            const durationMs = data.item?.duration_ms ?? 0;
            const progressMs = data.progress_ms ?? 0;

            setTrack({
                name: data.item?.name ?? "",
                artist: data.item?.artists?.[0]?.name ?? "",
                album: data.item?.album?.name ?? "",
                durationMs,
                image: data.item?.album?.images?.[0]?.url ?? "",
                progressMs,
                isPlaying: data.is_playing ?? false,
                lastFetchedAt: Date.now(),
            });

            const remainingMs = Math.max(
                1000,
                Math.min(durationMs - progressMs + 1000, 5000)
            );

            playingTimeout.current = window.setTimeout(
                fetchPlaying,
                data.is_playing ? remainingMs : 5000
            );
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        getPlaying();

        return () => {
            window.clearTimeout(playingTimeout.current);
        };
    }, [getPlaying]);

    const displayedProgressMs =
        playing
            ? Math.min(
                track.durationMs,
                track.progressMs + (Date.now() - track.lastFetchedAt)
            )
            : track.progressMs;

    const progress =
        track.durationMs > 0
            ? Math.min((displayedProgressMs / track.durationMs) * 100, 100)
            : 0;

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