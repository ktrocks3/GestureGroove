import type { HandLandmark } from "./useHandLandmarker";

export type HandPose = "open_palm" | "closed_fist" | "unknown";
function distance(a: HandLandmark, b: HandLandmark) {
    return Math.hypot(a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0));
}

const FINGERS = [
    { name: "index", tip: 8, pip: 6 },
    { name: "middle", tip: 12, pip: 10 },
    { name: "ring", tip: 16, pip: 14 },
    { name: "pinky", tip: 20, pip: 18 },
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

export type HandGesture = "open_close_open";

type GestureStep =
    | "waiting_for_first_open"
    | "waiting_for_fist"
    | "waiting_for_second_open";

export function createGestureDetector() {
    let step: GestureStep = "waiting_for_first_open";

    let firstOpenTime = 0;
    let lastGestureTime = 0;

    const maxGestureMs = 3000;
    const cooldownMs = 1000;

    function reset() {
        step = "waiting_for_first_open";
        firstOpenTime = 0;
    }

    function update(pose: HandPose): HandGesture | null {
        const now = performance.now();

        if (pose === "unknown") {
            return null;
        }

        if (now - lastGestureTime < cooldownMs) {
            return null;
        }

        if (
            step !== "waiting_for_first_open" &&
            now - firstOpenTime > maxGestureMs
        ) {
            reset();
        }

        console.log("gesture step:", step, "pose:", pose);

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
                lastGestureTime = now;
                reset();
                return "open_close_open";
            }

            return null;
        }

        return null;
    }

    return { update };
}