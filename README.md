# GestureGroove

> Control Spotify with hand gestures using your webcam.

GestureGroove is a web app that uses real-time hand tracking to control Spotify playback. It combines webcam input, MediaPipe hand landmarks, custom gesture detection, and the Spotify Web API into a polished browser-based music control demo.

## Demo

Demo video coming soon.

## Features

- Spotify login with Authorization Code + PKCE
- Current track display with album art, artist, album, progress, and playback state
- Manual playback controls for play/pause, next, previous, and volume
- Webcam preview with hand landmark overlay
- Real-time gesture detection
- Gesture-controlled Spotify playback

## Gesture Controls

| Gesture | Action |
|---|---|
| Closed fist → open palm | Play / pause |
| Swipe left | Next track |
| Swipe right | Previous track |
| Pinch distance | Volume control |
| Fully pinched fingers | Lower volume |
| Wide pinch distance | Higher volume |

## Tech Stack

- React
- Vite
- TypeScript
- Tailwind CSS
- MediaPipe Tasks Vision
- Spotify Web API

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