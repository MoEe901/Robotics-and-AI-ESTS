"use client";

import { DayPicker } from "react-day-picker";
import { useMemo, useState } from "react";

import "react-day-picker/style.css";

type DateEntryMode = "calendar" | "custom";

function toYyyyMmDd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseIsoDateOnly(value: string): Date | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return undefined;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return undefined;
  return dt;
}

type Props = {
  value: string;
  onChange: (next: string) => void;
};

export function EventAdminDateField({ value, onChange }: Props) {
  const [mode, setMode] = useState<DateEntryMode>(() =>
    parseIsoDateOnly(value) ? "calendar" : "custom",
  );

  const selected = useMemo(() => parseIsoDateOnly(value), [value]);

  const setFromCalendar = (d: Date | undefined) => {
    if (!d) return;
    onChange(toYyyyMmDd(d));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4 text-xs font-medium text-white/70">
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="event-date-mode"
            className="size-3.5 border-white/30 bg-black/40"
            checked={mode === "calendar"}
            onChange={() => {
              setMode("calendar");
              if (selected) onChange(toYyyyMmDd(selected));
              else onChange(toYyyyMmDd(new Date()));
            }}
          />
          Calendar date
        </label>
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="event-date-mode"
            className="size-3.5 border-white/30 bg-black/40"
            checked={mode === "custom"}
            onChange={() => setMode("custom")}
          />
          Custom text (e.g. Coming soon)
        </label>
      </div>

      {mode === "calendar" ? (
        <div className="space-y-3">
          <div
            className="rdp-root max-w-[min(100%,20rem)] rounded-xl border border-white/12 bg-zinc-900/95 p-3 text-sm text-white shadow-lg [--rdp-accent-color:#7dd3fc] [--rdp-accent-background-color:rgba(56,189,248,0.2)] [--rdp-outside-opacity:0.35] [--rdp-weekday-opacity:0.65]"
          >
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={(d) => setFromCalendar(d)}
              weekStartsOn={1}
              captionLayout="dropdown"
              fromYear={2010}
              toYear={2035}
              defaultMonth={selected ?? new Date()}
            />
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            <button
              type="button"
              className="text-sky-300/90 hover:text-sky-200"
              onClick={() => onChange("")}
            >
              Clear
            </button>
            <button
              type="button"
              className="text-sky-300/90 hover:text-sky-200"
              onClick={() => onChange(toYyyyMmDd(new Date()))}
            >
              Today
            </button>
          </div>
          <p className="text-[11px] text-white/45">
            Stored as YYYY-MM-DD for sorting. The public page formats this in the visitor&apos;s locale.
          </p>
        </div>
      ) : (
        <div>
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Coming soon, Spring 2026, TBD…"
            className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white outline-none placeholder:text-white/35 focus:border-white/35"
          />
        </div>
      )}
    </div>
  );
}
