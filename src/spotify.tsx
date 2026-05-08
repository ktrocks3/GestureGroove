import {useEffect, useRef, useState} from "react";

export function Spotify() {
    const tokenExpired = () => {
        const token = localStorage.getItem('spotify_token_expires_at');
        if (token == null) return true;
        const expiresAt = Number(token);
        return !expiresAt || Date.now() >= expiresAt - 60_000;
    }

    const logoutSpotify = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('spotify_token_expires_at');
        localStorage.removeItem('code_verifier');
        localStorage.removeItem('spotify_auth_state');

        setLoggedIn(false);
    };

    const generateRandomString = (length: number) => {
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const values = crypto.getRandomValues(new Uint8Array(length));
        return values.reduce((acc, x) => acc + possible[x % possible.length], "");
    }

    const sha256 = async (plain: string) => {
        const encoder = new TextEncoder()
        const data = encoder.encode(plain)
        return window.crypto.subtle.digest('SHA-256', data)
    }

    const base64encode = (input: ArrayBuffer) => {
        return btoa(String.fromCharCode(...new Uint8Array(input)))
            .replace(/=/g, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');
    }

    async function spotifyLogin() {
        const codeVerifier: string = generateRandomString(64);
        const hashed: ArrayBuffer = await sha256(codeVerifier)
        const codeChallenge: string = base64encode(hashed);
        const state = generateRandomString(32);


        const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
        const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;

        localStorage.setItem("code_verifier", codeVerifier);
        localStorage.setItem("spotify_auth_state", state);

        const scope = 'user-read-currently-playing user-read-playback-state user-modify-playback-state';
        const authUrl = new URL("https://accounts.spotify.com/authorize")

        const params = {
            response_type: 'code',
            client_id: clientId,
            scope,
            code_challenge_method: 'S256',
            code_challenge: codeChallenge,
            redirect_uri: redirectUri,
            state: state,
        }

        authUrl.search = new URLSearchParams(params).toString();
        window.location.href = authUrl.toString();

    }

    const getToken = async (code: string) => {

        // stored in the previous step
        const codeVerifier = localStorage.getItem('code_verifier');

        const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
        const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;


        const url = "https://accounts.spotify.com/api/token";
        if (codeVerifier == null) {
            setError(true);
            return;
        }

        const payload = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: clientId,
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
                code_verifier: codeVerifier,
            }),
        }

        const body = await fetch(url, payload);
        if (!body.ok) {
            setError(true);
            return;
        }

        const response = await body.json();
        if (!response.access_token) {
            setError(true);
            return;
        }

        localStorage.setItem('access_token', response.access_token);
        // eslint-disable-next-line react-hooks/purity
        const expiresAt = Date.now() + response.expires_in * 1000;
        window.setTimeout(() => {
            logoutSpotify();
        }, response.expires_in * 1000);

        localStorage.setItem("spotify_token_expires_at", String(expiresAt));
        localStorage.removeItem('code_verifier');
        localStorage.removeItem('spotify_auth_state');
        setLoggedIn(true);
        window.history.replaceState({}, document.title, window.location.pathname);
    }


    const hasRun = useRef(false);
    const [loggedIn, setLoggedIn] = useState(() =>
        localStorage.getItem('access_token') !== null && !tokenExpired()
    );
    const [error, setError] = useState(false);

    useEffect(() => {
        if (hasRun.current || loggedIn) return;
        hasRun.current = true;

        const params = new URLSearchParams(window.location.search);
        setError(false);

        const code: string = params.get('code') || "";
        const error: string = params.get('error') || "";
        const state: string = params.get('state') || "";

        if (error === "access_denied") {
            setError(true);
            return;
        }
        if (state !== localStorage.getItem("spotify_auth_state")) return;

        if (code === "") return;


        getToken(code);
    }, [getToken, loggedIn]);

    return !error ? (loggedIn ?
            <div className="flex flex-col gap-2">
                You've logged in!
                <button className="spotify-login" type="button" onClick={() => logoutSpotify()}>
                    Log out of Spotify
                </button>
            </div> :
            <div className="flex flex-col gap-2">
                You are not currently logged in
                <button className="spotify-login" type="button" onClick={() => spotifyLogin()}>
                    Login to Spotify
                </button>
            </div>) :
        <div className="flex flex-col gap-2">
            You are not currently logged in, there was an error.
            <button className="spotify-login" type="button" onClick={() => spotifyLogin()}>
                Login to Spotify
            </button>
        </div>
}