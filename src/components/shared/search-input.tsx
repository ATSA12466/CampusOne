import { Search } from "lucide-react";
import { Input } from "@/components/ui";

export function SearchInput({ value, onChange, placeholder = "Search" }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
      <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="pl-9" />
    </label>
  );
}
