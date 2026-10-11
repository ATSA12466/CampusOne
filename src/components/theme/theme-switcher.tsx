"use client";

import { Laptop, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { isThemePreference } from "@/config/theme";
import { useTheme } from "./theme-provider";

const options = [
  { value: "light", label: "Light", icon: <Sun className="size-4" aria-hidden="true" /> },
  { value: "dark", label: "Dark", icon: <Moon className="size-4" aria-hidden="true" /> },
  { value: "system", label: "System", icon: <Laptop className="size-4" aria-hidden="true" /> },
];
export function ThemeSwitcher({
  compact = false,
  defaultOpen,
}: {
  compact?: boolean;
  defaultOpen?: boolean;
}) {
  const { preference, setTheme, resolved } = useTheme();
  if (compact)
    return (
      <Dropdown
        label="Appearance"
        defaultOpen={defaultOpen}
        trigger={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Change appearance; ${preference} theme selected`}
          >
            {resolved === "dark" ? (
              <Moon className="size-5" aria-hidden="true" />
            ) : (
              <Sun className="size-5" aria-hidden="true" />
            )}
          </Button>
        }
        items={options.map((option) => ({
          label: option.label,
          icon: option.icon,
          selected: option.value === preference,
          onSelect: () => {
            if (isThemePreference(option.value)) setTheme(option.value);
          },
        }))}
      />
    );
  return (
    <SegmentedControl
      label="Appearance"
      options={options}
      value={preference}
      onValueChange={(value) => {
        if (isThemePreference(value)) setTheme(value);
      }}
    />
  );
}
