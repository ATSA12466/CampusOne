"use client";
import { useEffect, useState } from "react";
import type { AspectRatio } from "@/types/media";
import { CampusImage } from "./campus-image";
export function OwnedPhoto({
  data,
  alt,
  aspect = "video",
}: {
  data: string;
  alt: string;
  aspect?: AspectRatio;
}) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let active = true,
      current = "";
    void fetch(data)
      .then((r) => r.blob())
      .then((blob) => {
        if (!active) return;
        current = URL.createObjectURL(blob);
        setUrl(current);
      })
      .catch(() => {
        if (active) setUrl("");
      });
    return () => {
      active = false;
      if (current) URL.revokeObjectURL(current);
    };
  }, [data]);
  return (
    <CampusImage
      image={url ? { src: url, alt, provenance: "upload" } : null}
      aspect={aspect}
      alt={alt}
      className="rounded-media"
    />
  );
}
