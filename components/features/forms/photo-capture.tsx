"use client";

import * as React from "react";
import { Camera, ImagePlus, RefreshCcw, Trash2, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { ShipmentPhoto } from "@/lib/types";
import {
  MAX_PHOTO_BYTES,
  MAX_SHIPMENT_PHOTOS,
  PHOTO_MAX_EDGE_PX,
} from "@/lib/constants/produce-presets";

type CameraState = "idle" | "starting" | "live" | "denied" | "unsupported";

export interface PhotoCaptureProps {
  photos: ShipmentPhoto[];
  onChange: (photos: ShipmentPhoto[]) => void;
  maxPhotos?: number;
  /** Validation message coming from the form schema. */
  error?: string;
  disabled?: boolean;
}

const MAX_PHOTO_KB = Math.round(MAX_PHOTO_BYTES / 1000);

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the selected file"));
    reader.readAsDataURL(file);
  });
}

function decodeImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not decode the selected image"));
    image.src = dataUrl;
  });
}

/** Applies the shared long-edge cap so evidence never blows the payload budget. */
async function downscaleDataUrl(dataUrl: string): Promise<string> {
  const image = await decodeImage(dataUrl);
  const longestEdge = Math.max(image.naturalWidth, image.naturalHeight);
  const scale = Math.min(1, PHOTO_MAX_EDGE_PX / longestEdge);

  if (scale === 1 && dataUrl.length <= MAX_PHOTO_BYTES) {
    return dataUrl;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

  const context = canvas.getContext("2d");
  if (!context) return dataUrl;

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.7);
}

/**
 * Cold-chain evidence capture: live camera with a file-upload fallback, both
 * downscaled to the shared size caps before they reach form state.
 */
export function PhotoCapture({
  photos,
  onChange,
  maxPhotos = MAX_SHIPMENT_PHOTOS,
  error,
  disabled = false,
}: PhotoCaptureProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [cameraState, setCameraState] = React.useState<CameraState>("idle");
  const [localError, setLocalError] = React.useState<string | null>(null);

  const remaining = Math.max(0, maxPhotos - photos.length);

  const stopStream = React.useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  // Release the camera hardware whenever the component unmounts.
  React.useEffect(() => stopStream, [stopStream]);

  React.useEffect(() => {
    if (cameraState !== "live") return;
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;

    video.srcObject = stream;
    void video.play().catch(() => {
      setLocalError("Camera preview could not start — upload a photo instead.");
    });
  }, [cameraState]);

  const commitPhoto = (dataUrl: string, source: ShipmentPhoto["source"]) => {
    const sizeBytes = dataUrl.length;

    if (sizeBytes > MAX_PHOTO_BYTES) {
      setLocalError(
        `Image is ${Math.round(sizeBytes / 1000)} KB after downscaling (limit ${MAX_PHOTO_KB} KB). Step back and retake.`
      );
      return;
    }

    const photo: ShipmentPhoto = {
      id: `photo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      label:
        source === "camera"
          ? `Reefer capture ${photos.length + 1}`
          : `Uploaded evidence ${photos.length + 1}`,
      dataUrl,
      source,
      capturedAt: new Date().toISOString(),
      sizeBytes,
    };

    onChange([...photos, photo].slice(0, maxPhotos));
    setLocalError(null);
  };

  const startCamera = async () => {
    if (disabled || remaining === 0) return;
    setLocalError(null);

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraState("unsupported");
      setLocalError("This browser cannot access a camera — upload a photo instead.");
      return;
    }

    setCameraState("starting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraState("live");
    } catch {
      stopStream();
      setCameraState("denied");
      setLocalError(
        "Camera unavailable or permission denied (cameras need https or localhost) — upload a photo instead."
      );
    }
  };

  const stopCamera = () => {
    stopStream();
    setCameraState("idle");
  };

  const captureFrame = () => {
    const video = videoRef.current;

    if (!video || video.videoWidth === 0) {
      setLocalError("Camera is still warming up — try again in a second.");
      return;
    }

    const scale = Math.min(
      1,
      PHOTO_MAX_EDGE_PX / Math.max(video.videoWidth, video.videoHeight)
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);

    const context = canvas.getContext("2d");
    if (!context) {
      setLocalError("Captured frame could not be processed — upload a photo instead.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.7);

    stopCamera();
    commitPhoto(dataUrl, "camera");
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    setLocalError(null);

    if (!file.type.startsWith("image/")) {
      setLocalError("Only image files can be attached as evidence.");
      return;
    }

    try {
      const raw = await readFileAsDataUrl(file);
      const downscaled = await downscaleDataUrl(raw);
      commitPhoto(downscaled, "upload");
    } catch {
      setLocalError("That image could not be read — try a different file.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removePhoto = (id: string) => {
    onChange(photos.filter((photo) => photo.id !== id));
    setLocalError(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-slate-500" aria-hidden="true" />
          <span className="text-xs font-semibold text-slate-700">Cold-Chain Evidence</span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
            {photos.length}/{maxPhotos}
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          max {MAX_PHOTO_KB} KB each · auto-downscaled to {PHOTO_MAX_EDGE_PX}px
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {cameraState === "live" ? (
          <>
            <Button type="button" size="sm" onClick={captureFrame}>
              <Camera className="mr-1.5 h-3.5 w-3.5" /> Capture Frame
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={stopCamera}>
              <VideoOff className="mr-1.5 h-3.5 w-3.5" /> Stop Camera
            </Button>
          </>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void startCamera()}
            disabled={disabled || remaining === 0 || cameraState === "starting"}
          >
            <RefreshCcw
              className={cn(
                "mr-1.5 h-3.5 w-3.5",
                cameraState === "starting" && "animate-spin"
              )}
            />
            {cameraState === "starting" ? "Starting camera…" : "Start Camera"}
          </Button>
        )}

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || remaining === 0}
        >
          <ImagePlus className="mr-1.5 h-3.5 w-3.5" /> Upload Photo
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => void handleFiles(event.target.files)}
          disabled={disabled || remaining === 0}
        />
      </div>

      {(cameraState === "live" || cameraState === "starting") && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-900">
          <video
            ref={videoRef}
            playsInline
            muted
            className={cn("h-48 w-full object-cover", cameraState === "starting" && "opacity-60")}
          />
        </div>
      )}

      {(localError || error) && (
        <p className="text-xs font-medium text-rose-600" role="alert">
          {localError ?? error}
        </p>
      )}

      {photos.length > 0 ? (
        <ul className="grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <li
              key={photo.id}
              className="group relative overflow-hidden rounded-lg border border-slate-200"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.dataUrl} alt={photo.label} className="h-20 w-full object-cover" />
              <span className="absolute left-1 top-1 rounded bg-slate-900/70 px-1.5 py-0.5 text-[10px] font-semibold capitalize text-white">
                {photo.source}
              </span>
              <button
                type="button"
                onClick={() => removePhoto(photo.id)}
                aria-label={`Remove ${photo.label}`}
                className="absolute right-1 top-1 rounded bg-white/90 p-1 text-rose-600 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-3 text-[11px] text-slate-500">
          No evidence attached yet. Start the camera for a live reefer capture, or upload an
          existing photo. Cameras require a secure context (<code>https://</code> or{" "}
          <code>localhost</code>) — the upload path always works.
        </p>
      )}
    </div>
  );
}
