import type {HandLandmark} from "./useHandLandmarker";

export type HandPose = "open_palm" | "closed_fist" | "unknown";

function distance(a: HandLandmark, b: HandLandmark) {
    return Math.hypot(a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0));
}

export function palmCenter(hand: HandLandmark[]) {
    const points = [
        hand[0],  // wrist
        hand[5],  // index MCP
        hand[9],  // middle MCP
        hand[13], // ring MCP
        hand[17], // pinky MCP
    ];

    const x = points.reduce((sum, point) => sum + point.x, 0) / points.length;
    const y = points.reduce((sum, point) => sum + point.y, 0) / points.length;


    return {x, y};
}

const FINGERS = [
    {name: "index", tip: 8, pip: 6},
    {name: "middle", tip: 12, pip: 10},
    {name: "ring", tip: 16, pip: 14},
    {name: "pinky", tip: 20, pip: 18},
];

export function classifyHandPose(hand: HandLandmark[]): HandPose {
    if (hand.length < 21) {
        return "unknown";
    }

    const wrist = hand[0];

    let extendedFingerCount = 0;

    for (const finger of FINGERS) {
        const tip = hand[finger.tip];
        const pip = hand[finger.pip];

        const tipDistance = distance(tip, wrist);
        const pipDistance = distance(pip, wrist);

        if (tipDistance > pipDistance) {
            extendedFingerCount++;
        }
    }

    if (extendedFingerCount >= 4) {
        return "open_palm";
    }

    if (extendedFingerCount <= 1) {
        return "closed_fist";
    }

    return "unknown";
}

export type HandGesture =
    | "open_close_open"
    | "swipe_left"
    | "swipe_right";

type GestureStep =
    | "waiting_for_first_open"
    | "waiting_for_fist"
    | "waiting_for_second_open";

type SwipeSample = {
    x: number;
    y: number;
    time: number;
};

export function createGestureDetector() {
    let step: GestureStep = "waiting_for_first_open";

    let firstOpenTime = 0;
    let lastGestureTime = 0;

    const maxOpenCloseOpenMs = 3000;
    const generalCooldownMs = 800;

    const swipeSamples: SwipeSample[] = [];

    const maxSwipeMs = 700;
    const minSwipeDistanceX = 0.25;
    const maxSwipeDistanceY = 0.18;

    function resetOpenCloseOpen() {
        step = "waiting_for_first_open";
        firstOpenTime = 0;
    }

    function detectOpenCloseOpen(pose: HandPose, now: number): HandGesture | null {
        if (pose === "unknown") {
            return null;
        }

        if (
            step !== "waiting_for_first_open" &&
            now - firstOpenTime > maxOpenCloseOpenMs
        ) {
            resetOpenCloseOpen();
        }

        if (step === "waiting_for_first_open") {
            if (pose === "open_palm") {
                step = "waiting_for_fist";
                firstOpenTime = now;
            }

            return null;
        }

        if (step === "waiting_for_fist") {
            if (pose === "closed_fist") {
                step = "waiting_for_second_open";
            }

            return null;
        }

        if (step === "waiting_for_second_open") {
            if (pose === "open_palm") {
                resetOpenCloseOpen();
                return "open_close_open";
            }

            return null;
        }

        return null;
    }

    function detectSwipe(hand: HandLandmark[], pose: HandPose, now: number): HandGesture | null {
        // Optional, but recommended: only swipe with an open palm.
        if (pose !== "open_palm") {
            swipeSamples.length = 0;
            return null;
        }

        const center = palmCenter(hand);

        swipeSamples.push({
            x: center.x,
            y: center.y,
            time: now,
        });

        while (
            swipeSamples.length > 0 &&
            now - swipeSamples[0].time > maxSwipeMs
            ) {
            swipeSamples.shift();
        }

        if (swipeSamples.length < 2) {
            return null;
        }

        const first = swipeSamples[0];
        const last = swipeSamples[swipeSamples.length - 1];

        const deltaX = last.x - first.x;
        const deltaY = Math.abs(last.y - first.y);
        const elapsed = last.time - first.time;

        if (elapsed > maxSwipeMs) {
            return null;
        }

        if (deltaY > maxSwipeDistanceY) {
            return null;
        }

        if (Math.abs(deltaX) < minSwipeDistanceX) {
            return null;
        }

        swipeSamples.length = 0;

        if (deltaX > 0) {
            return "swipe_right";
        }

        return "swipe_left";
    }

    function update(hand: HandLandmark[] | undefined): HandGesture | null {
        const now = performance.now();

        if (!hand || hand.length < 21) {
            swipeSamples.length = 0;
            return null;
        }

        if (now - lastGestureTime < generalCooldownMs) {
            return null;
        }


        const pose = classifyHandPose(hand);

        const swipeGesture = detectSwipe(hand, pose, now);

        if (swipeGesture) {
            lastGestureTime = now;
            resetOpenCloseOpen();
            return swipeGesture;
        }

        const openCloseGesture = detectOpenCloseOpen(pose, now);

        if (openCloseGesture) {
            lastGestureTime = now;
            swipeSamples.length = 0;
            return openCloseGesture;
        }

        return null;
    }

    return { update };
}