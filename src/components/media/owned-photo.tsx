"use client";
import { useEffect, useState } from "react";
import { CampusImage } from "./campus-image";
export function OwnedPhoto({ data, alt }: { data: string; alt: string }) {
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
      });
    return () => {
      active = false;
      if (current) URL.revokeObjectURL(current);
    };
  }, [data]);
  return (
    <CampusImage
      image={url ? { src: url, alt, provenance: "upload" } : null}
      alt={alt}
      className="rounded-media"
    />
  );
}
