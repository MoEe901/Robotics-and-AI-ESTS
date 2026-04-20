"use client";

import { deleteDoc, deleteField, doc, getDoc, updateDoc } from "firebase/firestore";
import { Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { EventAdminDateField } from "@/components/admin/event-admin-date-field";
import { parseWebsiteCtaHex, WEBSITE_CTA_DEFAULT_HEX } from "@/lib/events/website-cta-color";
import { db } from "@/lib/firebase";
import type { EventAttachment, EventDoc, EventGalleryItem } from "@/lib/firebase/types";
import { cn } from "@/lib/utils";

type Props = {
  eventId: string;
};

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

const IMAGE_ZOOM_MIN = 0.25;
const IMAGE_ZOOM_MAX = 2.5;

function readString(data: Record<string, unknown>, key: string): string {
  const v = data[key];
  return typeof v === "string" ? v : "";
}

function readAttachments(data: Record<string, unknown>): EventAttachment[] {
  const raw = data.attachments;
  if (!Array.isArray(raw)) return [];
  const out: EventAttachment[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const label = typeof o.label === "string" ? o.label : "";
    const url = typeof o.url === "string" ? o.url : "";
    const visible = o.visible === undefined ? true : o.visible === true;
    out.push({ label, url, visible });
  }
  return out;
}

function readGallery(data: Record<string, unknown>): EventGalleryItem[] {
  const raw = data.gallery;
  if (!Array.isArray(raw)) return [];
  const out: EventGalleryItem[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const url = typeof o.url === "string" ? o.url : "";
    const kind = o.kind === "video" ? "video" : "image";
    const caption = typeof o.caption === "string" ? o.caption : "";
    const visible = o.visible === undefined ? true : o.visible === true;
    out.push({ url, kind, caption, visible });
  }
  return out;
}

export function EventEditor({ eventId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [documentary, setDocumentary] = useState("");
  const [location, setLocation] = useState("");
  const [locationMapsUrl, setLocationMapsUrl] = useState("");
  const [date, setDate] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFocusX, setImageFocusX] = useState(50);
  const [imageFocusY, setImageFocusY] = useState(50);
  const [imageZoom, setImageZoom] = useState(1);
  const [order, setOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [attachments, setAttachments] = useState<EventAttachment[]>([{ label: "", url: "", visible: true }]);
  const [gallery, setGallery] = useState<EventGalleryItem[]>([{ url: "", kind: "image", caption: "", visible: true }]);
  const [eventWebsiteUrl, setEventWebsiteUrl] = useState("");
  const [showEventWebsite, setShowEventWebsite] = useState(true);
  const [websiteButtonColor, setWebsiteButtonColor] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const snap = await getDoc(doc(db(), "events", eventId));
        if (cancelled) return;
        if (!snap.exists()) {
          setLoadError("Event not found.");
          setLoading(false);
          return;
        }
        const data = snap.data() as Record<string, unknown>;
        setTitle(readString(data, "title"));
        setSlug(readString(data, "slug"));
        setDescription(readString(data, "description"));
        setDocumentary(readString(data, "documentary"));
        setLocation(readString(data, "location"));
        setLocationMapsUrl(readString(data, "locationMapsUrl"));
        setDate(readString(data, "date"));
        setImageUrl(readString(data, "imageUrl"));
        setImageFocusX(clampNumber(typeof data.imageFocusX === "number" ? data.imageFocusX : 50, 0, 100));
        setImageFocusY(clampNumber(typeof data.imageFocusY === "number" ? data.imageFocusY : 50, 0, 100));
        setImageZoom(clampNumber(typeof data.imageZoom === "number" ? data.imageZoom : 1, IMAGE_ZOOM_MIN, IMAGE_ZOOM_MAX));
        setOrder(typeof data.order === "number" ? data.order : 0);
        setIsActive(data.isActive !== false);
        setIsFeatured(data.isFeatured === true);
        const att = readAttachments(data).filter((a) => a.label.trim() || a.url.trim());
        setAttachments(att.length ? att : [{ label: "", url: "", visible: true }]);
        const gal = readGallery(data).filter((g) => g.url.trim());
        setGallery(gal.length ? gal : [{ url: "", kind: "image", caption: "", visible: true }]);
        setEventWebsiteUrl(readString(data, "eventWebsiteUrl"));
        setShowEventWebsite(data.showEventWebsite !== false);
        setWebsiteButtonColor(parseWebsiteCtaHex(readString(data, "eventWebsiteButtonColor")) ?? "");
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const save = useCallback(async () => {
    const t = title.trim();
    const s = slug.trim();
    if (!t) {
      setError("Title is required.");
      return;
    }
    if (!s) {
      setError("Slug is required for the public event URL (/events/your-slug).");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        title: t,
        slug: s,
        order: Number.isFinite(order) ? order : 0,
        isActive,
        isFeatured,
        showEventWebsite,
      };
      const d = description.trim();
      const docu = documentary.trim();
      const loc = location.trim();
      const maps = locationMapsUrl.trim();
      const dt = date.trim();
      const img = imageUrl.trim();
      const web = eventWebsiteUrl.trim();

      payload.description = d ? d : deleteField();
      payload.documentary = docu ? docu : deleteField();
      payload.location = loc ? loc : deleteField();
      payload.locationMapsUrl = maps ? maps : deleteField();
      payload.date = dt ? dt : deleteField();
      payload.imageUrl = img ? img : deleteField();
      payload.imageFocusX = clampNumber(imageFocusX, 0, 100);
      payload.imageFocusY = clampNumber(imageFocusY, 0, 100);
      payload.imageZoom = clampNumber(imageZoom, IMAGE_ZOOM_MIN, IMAGE_ZOOM_MAX);
      payload.eventWebsiteUrl = web ? web : deleteField();
      const ctaHex = parseWebsiteCtaHex(websiteButtonColor);
      payload.eventWebsiteButtonColor = ctaHex ? ctaHex : deleteField();

      const attClean = attachments
        .map((a) => ({ label: a.label.trim(), url: a.url.trim(), visible: a.visible === true }))
        .filter((a) => a.label && a.url);
      payload.attachments = attClean.length ? attClean : deleteField();

      const galClean = gallery
        .map((g) => ({
          url: g.url.trim(),
          kind: g.kind === "video" ? "video" : "image",
          caption: g.caption?.trim() || "",
          visible: g.visible === true,
        }))
        .filter((g) => g.url);
      const galForStore = galClean.map(({ caption, ...rest }) => (caption ? { ...rest, caption } : rest));
      payload.gallery = galForStore.length ? galForStore : deleteField();

      await updateDoc(doc(db(), "events", eventId), payload as Partial<EventDoc>);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [
    title,
    slug,
    description,
    documentary,
    location,
    locationMapsUrl,
    date,
    imageUrl,
    imageFocusX,
    imageFocusY,
    imageZoom,
    order,
    isActive,
    isFeatured,
    attachments,
    gallery,
    eventWebsiteUrl,
    showEventWebsite,
    websiteButtonColor,
    eventId,
  ]);

  const remove = useCallback(async () => {
    if (!window.confirm("Delete this event permanently?")) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteDoc(doc(db(), "events", eventId));
      router.replace("/admin/events");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }, [eventId, router]);

  if (loading) return <p className="px-6 py-12 text-sm text-white/60">Loading event...</p>;
  if (loadError) {
    return (
      <div className="mx-auto max-w-lg px-6 py-12">
        <p className="text-sm text-red-200">{loadError}</p>
        <Link href="/admin/events" className="mt-4 inline-block text-sm text-blue-300 hover:text-blue-200">
          Back to events
        </Link>
      </div>
    );
  }

  const websitePreviewUrl = eventWebsiteUrl.trim();
  const showPreviewButton = Boolean(websitePreviewUrl) && showEventWebsite;
  const previewCtaHex = parseWebsiteCtaHex(websiteButtonColor);

  return (
    <div className="mx-auto max-w-2xl px-6 py-12 pb-40">
      <Link href="/admin/events" className="text-xs font-medium text-white/55 hover:text-white">
        All events
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white">Edit event</h1>

      <div className="mt-8 space-y-6">
        <label className="block text-sm"><span className="text-white/70">Title</span><input value={title} onChange={(e)=>setTitle(e.target.value)} className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"/></label>
        <label className="block text-sm"><span className="text-white/70">URL slug</span><input value={slug} onChange={(e)=>setSlug(e.target.value)} className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 font-mono text-sm text-white outline-none focus:border-white/35"/></label>
        <div className="block text-sm"><span className="text-white/70">Date</span><div className="mt-2"><EventAdminDateField value={date} onChange={setDate}/></div></div>
        <label className="block text-sm"><span className="text-white/70">Venue / location label</span><input value={location} onChange={(e)=>setLocation(e.target.value)} className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"/></label>
        <label className="block text-sm"><span className="text-white/70">Google Maps link (optional)</span><input value={locationMapsUrl} onChange={(e)=>setLocationMapsUrl(e.target.value)} className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/35"/></label>
        <label className="block text-sm"><span className="text-white/70">Image URL</span><input value={imageUrl} onChange={(e)=>setImageUrl(e.target.value)} className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"/></label>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="text-sm font-semibold text-white">Image crop controls</h2>
          <p className="mt-1 text-xs text-white/50">Control what part of the image is visible on event cards and event page hero.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <label className="block text-xs">
              <span className="text-white/70">Horizontal ({Math.round(imageFocusX)}%)</span>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={imageFocusX}
                onChange={(e) => setImageFocusX(Number(e.target.value))}
                className="mt-2 w-full"
              />
            </label>
            <label className="block text-xs">
              <span className="text-white/70">Vertical ({Math.round(imageFocusY)}%)</span>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={imageFocusY}
                onChange={(e) => setImageFocusY(Number(e.target.value))}
                className="mt-2 w-full"
              />
            </label>
            <label className="block text-xs">
              <span className="text-white/70">Zoom ({imageZoom.toFixed(2)}x)</span>
              <input
                type="range"
                min={IMAGE_ZOOM_MIN}
                max={IMAGE_ZOOM_MAX}
                step={0.01}
                value={imageZoom}
                onChange={(e) => setImageZoom(Number(e.target.value))}
                className="mt-2 w-full"
              />
            </label>
          </div>
          <div className="mt-3">
            <button
              type="button"
              className="rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-white/70 transition hover:border-white/30 hover:text-white"
              onClick={() => {
                setImageFocusX(50);
                setImageFocusY(50);
                setImageZoom(1);
              }}
            >
              Reset crop
            </button>
          </div>
        </div>
        <label className="block text-sm"><span className="text-white/70">Short description (optional)</span><textarea value={description} onChange={(e)=>setDescription(e.target.value)} rows={3} className="mt-1 w-full resize-y rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"/></label>
        <label className="block text-sm"><span className="text-white/70">Event story / documentary</span><textarea value={documentary} onChange={(e)=>setDocumentary(e.target.value)} rows={10} className="mt-1 w-full resize-y rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"/></label>

        <div className="border-t border-white/10 pt-6">
          <h2 className="text-sm font-semibold text-white">Downloads</h2>
          <p className="mt-1 text-xs text-white/45">Paste direct HTTPS links. Use visibility toggle per file.</p>
          <ul className="mt-4 space-y-3">
            {attachments.map((row, i) => (
              <li key={i} className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 sm:flex-row sm:items-end">
                <label className="block min-w-0 flex-1 text-xs"><span className="text-white/60">Label</span><input value={row.label} onChange={(e)=>{const next=[...attachments]; next[i]={...next[i], label:e.target.value}; setAttachments(next);}} className="mt-1 w-full rounded-lg border border-white/12 bg-black/30 px-2 py-1.5 text-sm text-white"/></label>
                <label className="block min-w-0 flex-[2] text-xs"><span className="text-white/60">File URL</span><input value={row.url} onChange={(e)=>{const next=[...attachments]; next[i]={...next[i], url:e.target.value}; setAttachments(next);}} className="mt-1 w-full rounded-lg border border-white/12 bg-black/30 px-2 py-1.5 font-mono text-xs text-white"/></label>
                <label className="inline-flex items-center gap-2 text-xs text-white/70"><input type="checkbox" className="size-4 rounded border-white/20 bg-black/40" checked={row.visible !== false} onChange={(e)=>{const next=[...attachments]; next[i]={...next[i], visible:e.target.checked}; setAttachments(next);}}/>Visible</label>
                <button type="button" className="shrink-0 rounded-lg border border-white/15 px-2 py-1 text-xs text-white/70 hover:border-red-500/40 hover:text-red-200" onClick={() => setAttachments(attachments.filter((_, j) => j !== i))}>Remove</button>
              </li>
            ))}
          </ul>
          <button type="button" className="mt-3 text-xs font-medium text-sky-300 hover:text-sky-200" onClick={() => setAttachments([...attachments, { label: "", url: "", visible: true }])}>+ Add file</button>
        </div>

        <div className="border-t border-white/10 pt-6">
          <h2 className="text-sm font-semibold text-white">Photos & videos</h2>
          <p className="mt-1 text-xs text-white/45">Paste image URL, direct video URL, or YouTube link. Captions optional.</p>
          <ul className="mt-4 space-y-3">
            {gallery.map((row, i) => (
              <li key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <label className="block min-w-0 flex-1 text-xs"><span className="text-white/60">Media URL</span><input value={row.url} onChange={(e)=>{const next=[...gallery]; next[i]={...next[i], url:e.target.value}; setGallery(next);}} className="mt-1 w-full rounded-lg border border-white/12 bg-black/30 px-2 py-1.5 font-mono text-xs text-white"/></label>
                  <label className="block text-xs sm:w-32"><span className="text-white/60">Type</span><select value={row.kind} onChange={(e)=>{const next=[...gallery]; next[i]={...next[i], kind:e.target.value === "video" ? "video" : "image"}; setGallery(next);}} className="mt-1 w-full rounded-lg border border-white/12 bg-black/30 px-2 py-1.5 text-sm text-white"><option value="image">Image</option><option value="video">Video</option></select></label>
                  <label className="inline-flex items-center gap-2 text-xs text-white/70"><input type="checkbox" className="size-4 rounded border-white/20 bg-black/40" checked={row.visible !== false} onChange={(e)=>{const next=[...gallery]; next[i]={...next[i], visible:e.target.checked}; setGallery(next);}}/>Visible</label>
                  <button type="button" className="shrink-0 rounded-lg border border-white/15 px-2 py-1 text-xs text-white/70 hover:border-red-500/40 hover:text-red-200" onClick={() => setGallery(gallery.filter((_, j) => j !== i))}>Remove</button>
                </div>
                <label className="mt-2 block text-xs"><span className="text-white/60">Caption (optional)</span><input value={row.caption ?? ""} onChange={(e)=>{const next=[...gallery]; next[i]={...next[i], caption:e.target.value}; setGallery(next);}} className="mt-1 w-full rounded-lg border border-white/12 bg-black/30 px-2 py-1.5 text-sm text-white"/></label>
              </li>
            ))}
          </ul>
          <button type="button" className="mt-3 text-xs font-medium text-sky-300 hover:text-sky-200" onClick={() => setGallery([...gallery, { url: "", kind: "image", caption: "", visible: true }])}>+ Add media</button>
        </div>

        <label className="block text-sm"><span className="text-white/70">Sort order</span><input type="number" value={order} onChange={(e)=>setOrder(Number(e.target.value))} className="mt-1 w-full max-w-[12rem] rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/35"/></label>

        <div className="flex flex-col gap-4 border-t border-white/10 pt-6">
          <div className="flex flex-wrap gap-6">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-white/80"><input type="checkbox" className="size-4 rounded border-white/20 bg-black/40" checked={isActive} onChange={(e)=>setIsActive(e.target.checked)} />Show on site</label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-white/80"><input type="checkbox" className="size-4 rounded border-white/20 bg-black/40" checked={isFeatured} onChange={(e)=>setIsFeatured(e.target.checked)} />Featured</label>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6">
          <h2 className="text-sm font-semibold text-white">Event website</h2>
          <label className="mt-3 block text-sm"><span className="text-white/70">Website URL</span><input value={eventWebsiteUrl} onChange={(e)=>setEventWebsiteUrl(e.target.value)} placeholder="https://..." className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/35"/></label>
          <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-white/80"><input type="checkbox" className="size-4 rounded border-white/20 bg-black/40" checked={showEventWebsite} onChange={(e)=>setShowEventWebsite(e.target.checked)} disabled={!websitePreviewUrl}/>Show website button on public page</label>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <span className="text-xs text-white/45">Preview (hover to expand)</span>
            {showPreviewButton ? (
              <>
                <a href={websitePreviewUrl} target="_blank" rel="noopener noreferrer" aria-label="Visit event website" title="Visit event website" style={previewCtaHex ? { backgroundColor: previewCtaHex, boxShadow: `0 8px 30px -6px ${previewCtaHex}99` } : undefined} className={cn("group inline-flex h-14 min-h-14 min-w-14 max-w-[3.5rem] items-center justify-center overflow-hidden rounded-full text-white transition-[max-width,background-color,padding,justify-content] duration-300 ease-out hover:max-w-[min(22rem,calc(100vw-2rem))] hover:justify-start hover:pl-4 hover:pr-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-200 focus-visible:max-w-[min(22rem,calc(100vw-2rem))] focus-visible:justify-start focus-visible:pl-4 focus-visible:pr-1", previewCtaHex ? "ring-1 ring-white/20 hover:brightness-110 focus-visible:brightness-110" : "bg-sky-600 shadow-[0_8px_30px_-6px_rgba(14,165,233,0.45)] ring-1 ring-sky-400/25 hover:bg-sky-500") }><span className="max-w-0 shrink overflow-hidden whitespace-nowrap text-sm font-semibold uppercase tracking-wide opacity-0 transition-[max-width,opacity] duration-300 ease-out group-hover:max-w-[16rem] group-hover:opacity-100 group-hover:delay-75 group-focus-visible:max-w-[16rem] group-focus-visible:opacity-100 group-focus-visible:delay-75">Visit event website</span><span className="flex size-14 shrink-0 items-center justify-center" aria-hidden><Send className="size-5 text-white" strokeWidth={2.1} /></span></a>
                <div className="flex items-center gap-2"><label className="flex cursor-pointer items-center gap-2 text-xs text-white/60"><span className="whitespace-nowrap">Button color</span><input type="color" value={previewCtaHex ?? WEBSITE_CTA_DEFAULT_HEX} onChange={(e)=>setWebsiteButtonColor(e.target.value)} aria-label="Website button fill color" className="h-10 w-14 cursor-pointer rounded-lg border border-white/15 bg-black/40 p-0.5 shadow-inner"/></label><button type="button" className="rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-white/70 transition hover:border-white/30 hover:text-white" onClick={()=>setWebsiteButtonColor("")}>Default</button></div>
              </>
            ) : <span className="text-xs text-white/40">Add a URL and enable visibility to preview.</span>}
          </div>
        </div>
      </div>

      {error ? <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <button type="button" disabled={saving} onClick={() => void save()} className="rounded-full border border-white/20 bg-white/[0.1] px-5 py-2 text-sm font-medium text-white hover:border-white/35 disabled:opacity-50">{saving ? "Saving..." : "Save changes"}</button>
        <button type="button" disabled={deleting} onClick={() => void remove()} className="rounded-full border border-red-500/35 px-5 py-2 text-sm font-medium text-red-200/90 hover:bg-red-500/10 disabled:opacity-50">{deleting ? "Deleting..." : "Delete event"}</button>
      </div>
    </div>
  );
}

