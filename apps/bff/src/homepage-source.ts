export type HomepageContent = {
  headline: string;
  body: string;
  imageUrl: string | null;
};

/** Contentstack boundary the Homepage query calls. Tests substitute a double. */
export type HomepageSource = {
  getHomepage(): Promise<HomepageContent | null>;
};

/** Blank headline and body together mean there is no Homepage to show. */
export function presentHomepage(
  content: HomepageContent | null,
): HomepageContent | null {
  if (!content) {
    return null;
  }

  const headline = content.headline.trim();
  const body = content.body.trim();
  if (!headline && !body) {
    return null;
  }

  const imageUrl = content.imageUrl?.trim() || null;
  return { headline, body, imageUrl };
}
