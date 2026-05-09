# GestureGroove

> Control Spotify with hand gestures using your webcam.

GestureGroove is a web app that uses real-time hand tracking to control Spotify playback. It combines webcam input, MediaPipe hand landmarks, custom gesture detection, and the Spotify Web API into a polished browser-based music control demo.

## Live Demo

Live site:

```text
https://gesture.kishant.nl
````

Demo video coming soon.

> Note: Spotify login is restricted to allowlisted test users while the app is in Spotify Development Mode. The deployed app is public, but Spotify playback control only works for approved users with Spotify Premium. Also volume control only works on devices that allow volume control (for example iPhones do not, but windows PC does)

## Features

* Spotify login with Authorization Code + PKCE
* Current track display with album art, artist, album, progress, and playback state
* Manual playback controls for play/pause, next, previous, and volume
* Webcam preview with hand landmark overlay
* Real-time gesture detection
* Gesture-controlled Spotify playback

## Gesture Controls

| Gesture                 | Action         |
| ----------------------- | -------------- |
| Closed fist → open palm | Play / pause   |
| Swipe left              | Next track     |
| Swipe right             | Previous track |
| Pinch distance          | Volume control |
| Fully pinched fingers   | Lower volume   |
| Wide pinch distance     | Higher volume  |

## Tech Stack

* React
* Vite
* TypeScript
* Tailwind CSS
* MediaPipe Tasks Vision
* Spotify Web API
* Vercel

## How It Works

GestureGroove runs entirely in the browser.

```text
Webcam feed
  ↓
MediaPipe hand landmark detection
  ↓
Custom gesture detection
  ↓
Spotify Web API playback commands
```

The app uses MediaPipe to detect hand landmarks from the webcam stream. Those landmarks are analyzed with simple heuristic gesture detection rather than a custom machine learning model. Detected gestures are then mapped to Spotify playback actions.

## Local Development

### Prerequisites

* Node.js
* npm
* Spotify Developer account
* Spotify Premium account
* An active Spotify playback device

### Spotify App Setup

Create a Spotify app in the Spotify Developer Dashboard and add this local redirect URI:

```text
http://127.0.0.1:5173/callback
```

Do not use `localhost` for the Spotify redirect URI. Use the explicit loopback address.

Required Spotify scopes:

```text
user-read-currently-playing
user-read-playback-state
user-modify-playback-state
```

### Project Setup

Clone the repository and install dependencies:

```bash
npm install
```

Create a `.env.local` file in the project root:

```env
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_REDIRECT_URI=http://127.0.0.1:5173/callback
```

Start the development server:

```bash
npm run dev
```

The app should run at:

```text
http://127.0.0.1:5173
```

## Project Structure

```text
src/
  hooks/
    useCamera.ts
    useGestureDetection.ts
    useHandLandmarker.ts
    useSpotifyPlayer.ts
  App.tsx
  cameraPreview.tsx
  spotifyLogin.tsx
  spotifyPlayer.tsx

public/
  models/
    hand_landmarker.task
```

## Limitations
* Spotify playback control requires Spotify Premium.
* Spotify must be open and active on at least one device.
* Spotify Development Mode restricts access to allowlisted users.

## Future Improvements
* Add a short demo video or GIF
* Add calibration controls for gesture sensitivity
* Improve mobile layout

## Status
MVP complete.
