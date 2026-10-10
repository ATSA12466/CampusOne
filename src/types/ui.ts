import type { ReactNode } from "react";
export type SemanticTone = "neutral" | "primary" | "success" | "warning" | "danger" | "gold";
export interface ChoiceOption {
  value: string;
  label: string;
  description?: string;
  icon?: ReactNode;
}
export interface DropdownItem {
  label: string;
  onSelect: () => void;
  icon?: ReactNode;
  selected?: boolean;
  disabled?: boolean;
  danger?: boolean;
}
export interface ToastMessage {
  title: string;
  description?: string;
  tone?: "success" | "danger" | "info";
}
export interface TimelineEntry {
  id: string;
  title: string;
  description?: string;
  date?: string;
  status?: "complete" | "current" | "upcoming";
}
