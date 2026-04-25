import { client } from "./client";
import { urlFor } from "./image";

const REELS_QUERY = /* groq */ `
  *[_type == "instagramReel"] | order(coalesce(order, 100) asc, _createdAt desc) {
    "id": _id,
    title,
    "videoUrl": videoFile.asset->url,
    thumbnail,
    link
  }
`;

export async function getAllReels() {
  try {
    const data = await client.fetch(
      REELS_QUERY,
      {},
      { next: { revalidate: 0 } }
    );

    return (data || [])
      .map((reel) => {
        let thumbnailUrl = null;
        if (reel.thumbnail) {
          try {
            thumbnailUrl = urlFor(reel.thumbnail)
              .width(600)
              .quality(85)
              .auto("format")
              .url();
          } catch {
            thumbnailUrl = null;
          }
        }

        const link =
          typeof reel.link === "string" && reel.link.length > 0
            ? reel.link.split("?")[0]
            : null;

        return {
          id: reel.id,
          title: reel.title || "",
          videoUrl: reel.videoUrl || null,
          thumbnail: thumbnailUrl,
          link,
        };
      })
      .filter((reel) => reel.videoUrl || reel.link);
  } catch (err) {
    console.error("[sanity] getAllReels failed:", err);
    return [];
  }
}
