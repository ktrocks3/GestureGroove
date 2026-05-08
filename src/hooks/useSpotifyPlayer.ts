import { useCallback, useEffect, useRef, useState } from "react";

export type Track = {
    name: string;
    artist: string;
    album: string;
    durationMs: number;
    image: string;
    progressMs: number;
    isPlaying: boolean;
    lastFetchedAt: number;
};

const emptyTrack: Track = {
    name: "",
    artist: "",
    album: "",
    durationMs: 0,
    image: "",
    progressMs: 0,
    isPlaying: false,
    lastFetchedAt: Date.now(),
};

function getAccessToken() {
    const accessToken = localStorage.getItem("access_token");

    if (!accessToken) {
        throw new Error("No Spotify access token found");
    }

    return accessToken;
}

export function useSpotifyPlayer() {
    const [track, setTrack] = useState<Track>(emptyTrack);
    const [playing, setPlaying] = useState(false);
    const [, setTick] = useState(0);

    const playingTimeout = useRef<number | undefined>(undefined);

    useEffect(() => {
        if (!playing) return;

        const interval = window.setInterval(() => {
            setTick((tick) => tick + 1);
        }, 500);

        return () => window.clearInterval(interval);
    }, [playing]);

    const getPlaying = useCallback(async function fetchPlaying(): Promise<void> {
        window.clearTimeout(playingTimeout.current);

        try {
            const accessToken = getAccessToken();

            const response = await fetch(
                "https://api.spotify.com/v1/me/player/currently-playing",
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            if (response.status === 204) return;

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

    async function nextTrack() {
        const accessToken = getAccessToken();

        const response = await fetch("https://api.spotify.com/v1/me/player/next", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Spotify next request failed: ${response.status} ${errorText}`);
        }

        setTimeout(getPlaying, 500);
    }

    async function previousTrack() {
        const accessToken = getAccessToken();

        const response = await fetch("https://api.spotify.com/v1/me/player/previous", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Spotify previous request failed: ${response.status} ${errorText}`);
        }

        setTimeout(getPlaying, 500);
    }

    async function pause() {
        const accessToken = getAccessToken();

        const response = await fetch("https://api.spotify.com/v1/me/player/pause", {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Spotify pause request failed: ${response.status} ${errorText}`);
        }

        setPlaying(false);
        setTimeout(getPlaying, 500);
    }

    async function play() {
        const accessToken = getAccessToken();

        const response = await fetch("https://api.spotify.com/v1/me/player/play", {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Spotify play request failed: ${response.status} ${errorText}`);
        }

        setPlaying(true);
        setTimeout(getPlaying, 500);
    }

    async function pauseOrPlay() {
        if (playing) {
            await pause();
        } else {
            await play();
        }
    }

    async function setVolume(volume: number) {
        const accessToken = getAccessToken();

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
    }

    const displayedProgressMs = playing
        ? Math.min(track.durationMs, track.progressMs + (Date.now() - track.lastFetchedAt))
        : track.progressMs;

    const progress =
        track.durationMs > 0
            ? Math.min((displayedProgressMs / track.durationMs) * 100, 100)
            : 0;

    return {
        track,
        playing,
        displayedProgressMs,
        progress,
        getPlaying,
        nextTrack,
        previousTrack,
        pause,
        play,
        pauseOrPlay,
        setVolume,
    };
}