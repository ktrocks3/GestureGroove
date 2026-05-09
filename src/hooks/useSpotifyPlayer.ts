import {useCallback, useEffect, useRef, useState} from "react";

export type Track = {
    name: string;
    artist: string;
    album: string;
    durationMs: number;
    image: string;
    progressMs: number;
    lastFetchedAt: number;
};

const emptyTrack: Track = {
    name: "",
    artist: "",
    album: "",
    durationMs: 0,
    image: "",
    progressMs: 0,
    lastFetchedAt: Date.now(),
};

function getAccessToken() {
    const accessToken = localStorage.getItem("access_token");

    if (!accessToken) {
        throw new Error("No Spotify access token found");
    }

    return accessToken;
}

function clampVolume(volume: number) {
    return Math.max(0, Math.min(100, Math.round(volume)));
}

function sleep(ms: number) {
    return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

export function useSpotifyPlayer() {
    const [track, setTrack] = useState<Track>(emptyTrack);
    const [playing, setPlaying] = useState(false);
    const [volume, setVolumeState] = useState(70);
    const [, setTick] = useState(0);

    const playingRef = useRef(false);
    const playingTimeout = useRef<number | undefined>(undefined);
    const volumeTimeout = useRef<number | null | undefined>(undefined);

    useEffect(() => {
        playingRef.current = playing;
    }, [playing]);

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

            const response = await fetch("https://api.spotify.com/v1/me/player", {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (response.status === 204) return;

            if (response.status === 401) {
                throw new Error("Spotify token expired or invalid");
            }

            if (!response.ok) {
                throw new Error(`Failed to fetch Spotify player: ${response.status}`);
            }

            const data = await response.json();

            const isPlaying = Boolean(data.is_playing);
            const durationMs = data.item?.duration_ms ?? 0;
            const progressMs = data.progress_ms ?? 0;

            setPlaying(isPlaying);

            setTrack({
                name: data.item?.name ?? "",
                artist: data.item?.artists?.[0]?.name ?? "",
                album: data.item?.album?.name ?? "",
                durationMs,
                image: data.item?.album?.images?.[0]?.url ?? "",
                progressMs,
                lastFetchedAt: Date.now(),
            });

            if (typeof data.device?.volume_percent === "number") {
                setVolumeState(data.device.volume_percent);
            }

            const remainingMs = Math.max(
                1000,
                Math.min(durationMs - progressMs + 1000, 5000)
            );

            playingTimeout.current = window.setTimeout(
                fetchPlaying,
                isPlaying ? remainingMs : 5000
            );
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        getPlaying();

        return () => {
            if (volumeTimeout.current !== null) {
                window.clearTimeout(volumeTimeout.current);
                volumeTimeout.current = null;
            }
            window.clearTimeout(playingTimeout.current);
        };
    }, [getPlaying]);

    const pause = useCallback(async () => {
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

        setTrack((current) => ({
            ...current,
            progressMs: playingRef.current
                ? Math.min(
                    current.durationMs,
                    current.progressMs + Date.now() - current.lastFetchedAt
                )
                : current.progressMs,
            lastFetchedAt: Date.now(),
        }));

        window.setTimeout(getPlaying, 300);
    }, [getPlaying]);

    const play = useCallback(async () => {
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

        setTrack((current) => ({
            ...current,
            lastFetchedAt: Date.now(),
        }));

        window.setTimeout(getPlaying, 300);
    }, [getPlaying]);

    const pauseOrPlay = useCallback(async () => {
        if (playingRef.current) {
            await pause();
        } else {
            await play();
        }
    }, [pause, play]);

    const nextTrack = useCallback(async () => {
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

        await sleep(300);
        await getPlaying();
    }, [getPlaying]);

    const previousTrack = useCallback(async () => {
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

        await sleep(300);
        await getPlaying();
    }, [getPlaying]);

    const sendVolumeToSpotify = useCallback(async (nextVolume: number) => {
        const accessToken = getAccessToken();

        const response = await fetch(
            `https://api.spotify.com/v1/me/player/volume?volume_percent=${nextVolume}`,
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
    }, []);

    const lastVolumeSentAt = useRef(0);
    const latestVolumeRef = useRef(0);
    const lastSentVolumeRef = useRef<number | null>(null);

    const setVolume = useCallback((nextVolume: number) => {
        const clampedVolume = clampVolume(nextVolume);

        // Update UI immediately.
        setVolumeState(clampedVolume);

        // Always remember the latest requested volume.
        latestVolumeRef.current = clampedVolume;

        const sendLatestVolume = () => {
            volumeTimeout.current = null;

            const volumeToSend = latestVolumeRef.current;

            // Optional: avoid sending duplicate volume values.
            if (lastSentVolumeRef.current === volumeToSend) {
                return;
            }

            lastVolumeSentAt.current = Date.now();
            lastSentVolumeRef.current = volumeToSend;

            sendVolumeToSpotify(volumeToSend).catch(console.error);
        };

        const now = Date.now();
        const elapsed = now - lastVolumeSentAt.current;

        if (elapsed >= 120) {
            if (volumeTimeout.current !== null) {
                window.clearTimeout(volumeTimeout.current);
                volumeTimeout.current = null;
            }

            sendLatestVolume();
        } else if (volumeTimeout.current === null) {
            volumeTimeout.current = window.setTimeout(
                sendLatestVolume,
                120 - elapsed
            );
        }
    }, [sendVolumeToSpotify]);
    const displayedProgressMs = playing
        ? Math.min(track.durationMs, track.progressMs + Date.now() - track.lastFetchedAt)
        : track.progressMs;

    const progress =
        track.durationMs > 0
            ? Math.min((displayedProgressMs / track.durationMs) * 100, 100)
            : 0;

    return {
        track,
        playing,
        volume,
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