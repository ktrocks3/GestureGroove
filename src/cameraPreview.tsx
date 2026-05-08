import { useEffect, useRef, useState } from "react";

type CameraPreviewProps = {
    mirrored?: boolean;
};

export function CameraPreview({ mirrored = true }: CameraPreviewProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
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
                setError("Could not access camera");
            }
        }

        void startCamera();

        return () => {
            cancelled = true;
            stream?.getTracks().forEach((track) => track.stop());
        };
    }, []);

    return (
        <div className="w-full overflow-hidden rounded-2xl bg-emerald-950">
            {error ? (
                <div className="flex min-h-64 w-full items-center justify-center px-4 text-sm text-emerald-100">
                    {error}
                </div>
            ) : (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={[
                        "h-auto w-full bg-zinc-950 object-contain",
                        mirrored ? "scale-x-[-1]" : "",
                    ].join(" ")}
                />
            )}
        </div>
    );
}