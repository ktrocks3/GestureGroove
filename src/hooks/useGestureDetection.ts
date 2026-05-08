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