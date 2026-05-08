import {type RefObject} from "react";

type CameraPreviewProps = {
    mirrored?: boolean;
    videoRef: RefObject<HTMLVideoElement | null>;
    canvasRef: RefObject<HTMLCanvasElement | null>;
    error?: string | null;
};

export function CameraPreview({mirrored = true, videoRef, canvasRef, error}: CameraPreviewProps) {

    return (
        <div className="w-full overflow-hidden rounded-2xl bg-emerald-950">
            {error ? (
                <div className="flex min-h-64 w-full items-center justify-center px-4 text-sm text-emerald-100">
                    {error}
                </div>
            ) : (
                <div className={["relative", mirrored ? "scale-x-[-1]" : ""].join(" ")}>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="h-auto w-full bg-zinc-950 object-contain"
                    />

                    <canvas
                        ref={canvasRef}
                        className="pointer-events-none absolute inset-0 h-full w-full z-10"
                    />
                </div>
            )}
        </div>
    );
}