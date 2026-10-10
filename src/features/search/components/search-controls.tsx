import type { KeyboardEventHandler, RefObject } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { searchScopes } from "@/config/search";
import type { SearchScope } from "@/types/search";
export function SearchControls({
  id,
  query,
  scope,
  inputRef,
  listId,
  open,
  activeOption,
  onQuery,
  onScope,
  onKeyDown,
}: {
  id: string;
  query: string;
  scope: SearchScope;
  inputRef: RefObject<HTMLInputElement | null>;
  listId: string;
  open: boolean;
  activeOption?: string;
  onQuery: (value: string) => void;
  onScope: (value: SearchScope) => void;
  onKeyDown: KeyboardEventHandler<HTMLInputElement>;
}) {
  return (
    <>
      <label htmlFor={`${id}-query`} className="sr-only">
        Search campus content
      </label>
      <div className="relative mb-3">
        <Search
          className="pointer-events-none absolute top-3.5 left-3 size-5 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          ref={inputRef}
          id={`${id}-query`}
          type="search"
          role="combobox"
          autoComplete="off"
          maxLength={100}
          value={query}
          placeholder="Search your campus"
          className="pr-12 pl-11"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={activeOption}
          onChange={(event) => onQuery(event.target.value)}
          onKeyDown={onKeyDown}
        />
        {query ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Clear search"
            className="absolute top-0 right-0"
            onClick={() => {
              onQuery("");
              inputRef.current?.focus();
            }}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        ) : null}
      </div>
      <div className="mb-4 flex items-center gap-3">
        <label
          htmlFor={`${id}-scope`}
          className="shrink-0 text-xs font-semibold text-muted-foreground"
        >
          Look in
        </label>
        <Select
          id={`${id}-scope`}
          value={scope}
          onChange={(event) => {
            const value = searchScopes.find((item) => item.value === event.target.value)?.value;
            if (value) onScope(value);
          }}
          className="max-w-52"
        >
          {searchScopes.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
      </div>
    </>
  );
}
