const FALLBACK = "/fallback.jpg";

/**
 * Team images are Firebase Storage (or any HTTPS) URLs from `imageUrl`.
 * Legacy `image` object is ignored.
 */
export function teamMemberImageUrl(
  image: unknown | null | undefined,
  imageUrl?: string | null,
): string {
  if (imageUrl && typeof imageUrl === "string" && imageUrl.trim()) {
    return imageUrl.trim();
  }
  return FALLBACK;
}

/** Convenience when member has `imageUrl` at top level. */
export function memberImageSrc(member: { imageUrl?: string | null; image?: unknown | null }): string {
  return teamMemberImageUrl(member.image, member.imageUrl);
}
