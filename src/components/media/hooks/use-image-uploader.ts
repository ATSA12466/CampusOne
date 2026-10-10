"use client";

import { useEffect, useRef, useState } from "react";
import { imageFileSchema } from "../validation/image.schema";
import { inspectPhoto, preparePhoto } from "@/lib/media/compress";
import type { CampusMedia, CropSettings, ProcessedImage } from "@/types/media";

export const defaultCrop: CropSettings = { x: 50, y: 50, zoom: 1, aspect: 1 };
export function useImageUploader(onComplete: (image: ProcessedImage) => Promise<void> | void) {
  const version = useRef(0);
  const [source, setSource] = useState<{ file: File; image: CampusMedia } | null>(null);
  const [crop, setCrop] = useState(defaultCrop);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  useEffect(() => {
    const url = source?.image.src;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [source]);
  useEffect(
    () => () => {
      version.current++;
    },
    [],
  );
  const choose = async (file?: File) => {
    if (!file || busy) return;
    const request = ++version.current;
    setError("");
    setReading(true);
    setComplete(false);
    try {
      const parsed = imageFileSchema.safeParse(file);
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      const dimensions = await inspectPhoto(file);
      if (request !== version.current) return;
      setSource({
        file,
        image: {
          src: URL.createObjectURL(file),
          alt: "Your selected photo, cropped preview",
          ...dimensions,
          provenance: "upload",
        },
      });
      setCrop(defaultCrop);
    } catch (cause) {
      if (request === version.current)
        setError(
          cause instanceof Error
            ? cause.message
            : "We couldn't open this photo. Please try another.",
        );
    } finally {
      if (request === version.current) setReading(false);
    }
  };
  const save = async () => {
    if (!source || busy || reading || complete) return;
    const request = ++version.current;
    setBusy(true);
    setProgress(5);
    setError("");
    try {
      const prepared = await preparePhoto(source.file, crop, setProgress);
      if (request !== version.current) return;
      await onComplete(prepared);
      if (request === version.current) {
        setProgress(100);
        setComplete(true);
      }
    } catch (cause) {
      if (request === version.current)
        setError(
          cause instanceof Error
            ? cause.message
            : "This photo couldn't be saved. Please try again.",
        );
    } finally {
      if (request === version.current) setBusy(false);
    }
  };
  const changeCrop = (next: CropSettings) => {
    setCrop(next);
    setComplete(false);
    setError("");
  };
  const remove = () => {
    version.current++;
    setSource(null);
    setError("");
    setComplete(false);
    setReading(false);
    setProgress(0);
  };
  return {
    source,
    crop,
    busy,
    reading,
    progress,
    error,
    complete,
    choose,
    save,
    changeCrop,
    remove,
  };
}
