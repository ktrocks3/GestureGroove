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

export type PinchVolumeResult = {
    active: boolean;
    volume: number;
    rawDistance: number;
    normalizedDistance: number;
};

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

function mapRange(
    value: number,
    inputMin: number,
    inputMax: number,
    outputMin: number,
    outputMax: number
) {
    const normalized = (value - inputMin) / (inputMax - inputMin);
    return outputMin + normalized * (outputMax - outputMin);
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
let pinchModeCandidateStart = 0;
let pinchModeActive = false;
let smoothedVolume = 0;

export function detectPinchVolume(
    hand: HandLandmark[] | undefined,
    now = performance.now()
): PinchVolumeResult | null {
    if (!hand || hand.length < 21) {
        pinchModeActive = false;
        pinchModeCandidateStart = 0;
        return null;
    }

    const wrist = hand[0];

    const thumbTip = hand[4];
    const indexTip = hand[8];

    const indexMcp = hand[5];
    const middleMcp = hand[9];

    const middleTip = hand[12];
    const middlePip = hand[10];

    const ringTip = hand[16];
    const ringPip = hand[14];

    const pinkyTip = hand[20];
    const pinkyPip = hand[18];

    const handSize = distance(wrist, middleMcp);

    if (handSize === 0) {
        return null;
    }

    const normalized = (a: HandLandmark, b: HandLandmark) =>
        distance(a, b) / handSize;

    const middleCurled =
        distance(middleTip, wrist) < distance(middlePip, wrist);

    const ringCurled =
        distance(ringTip, wrist) < distance(ringPip, wrist);

    const pinkyCurled =
        distance(pinkyTip, wrist) < distance(pinkyPip, wrist);

    const backThreeFingersCurled =
        middleCurled && ringCurled && pinkyCurled;

    const indexAwayFromWrist =
        normalized(indexTip, wrist) > normalized(indexMcp, wrist) * 1.15;

    const thumbAwayFromWrist =
        normalized(thumbTip, wrist) > 0.75;

    const thumbIndexDistance = normalized(thumbTip, indexTip);

    const thumbIndexReasonable =
        thumbIndexDistance < 1.8;

    const pinchModeCandidate =
        backThreeFingersCurled &&
        indexAwayFromWrist &&
        thumbAwayFromWrist &&
        thumbIndexReasonable;

    if (!pinchModeCandidate) {
        pinchModeActive = false;
        pinchModeCandidateStart = 0;

        return {
            active: false,
            volume: 0,
            rawDistance: 0,
            normalizedDistance: 0,
        };
    }

    const activationDelayMs = 250;

    if (!pinchModeActive) {
        if (pinchModeCandidateStart === 0) {
            pinchModeCandidateStart = now;
            return {
                active: false,
                volume: 0,
                rawDistance: 0,
                normalizedDistance: thumbIndexDistance,
            };
        }

        if (now - pinchModeCandidateStart < activationDelayMs) {
            return {
                active: false,
                volume: 0,
                rawDistance: 0,
                normalizedDistance: thumbIndexDistance,
            };
        }

        pinchModeActive = true;
    }

    const closedDistance = 0.25;
    const openDistance = 1.25;

    const unclampedVolume = mapRange(
        thumbIndexDistance,
        closedDistance,
        openDistance,
        0,
        100
    );

    const rawVolume = clamp(unclampedVolume, 0, 100);

    const smoothing = 0.25;
    smoothedVolume =
        smoothedVolume * (1 - smoothing) +
        rawVolume * smoothing;

    return {
        active: true,
        volume: Math.round(smoothedVolume),
        rawDistance: distance(thumbTip, indexTip),
        normalizedDistance: thumbIndexDistance,
    };
}