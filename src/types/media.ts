import type { images } from "@/config/images";
export type ImageKey = keyof typeof images;
export type AspectRatio = "square" | "portrait" | "tall" | "video" | "panorama";
export type ImageProvenance = "placeholder" | "generated" | "licensed" | "upload";
export interface FocalPoint {
  x: number;
  y: number;
}
export interface CampusMedia {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  blurDataURL?: string;
  focalPoint?: FocalPoint;
  provenance: ImageProvenance;
  sourceNote?: string;
}
export interface CropSettings {
  x: number;
  y: number;
  zoom: number;
  aspect: number;
}
export interface CropRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface ProcessedImage {
  file: File;
  width: number;
  height: number;
  originalBytes: number;
}
