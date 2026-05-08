import {useEffect, type RefObject, useState} from "react";

export function useCamera(videoRef: RefObject<HTMLVideoElement | null>) {
    const [error, setError] = useState<string | null>(null);
    useEffect(() => {
        let stream: MediaStream | null = null;
        let cancelled = false;

        async function startCamera() {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: "user",
                    },
                    audio: false,
                });

                if (!cancelled && videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (error) {
                console.error("Could not access camera", error);
                setError("Could not access camera: " + error);
            }
        }

        void startCamera();

        return () => {
            cancelled = true;
            stream?.getTracks().forEach((track) => track.stop());
        };
    }, []);

    return error;
}