import { adminDb } from "../../../../../lib/firebaseAdmin";

export async function GET(req, context) {
  try {
    const { slug } = await context.params;
    const cleanSlug = (slug || "").toLowerCase().trim();

    if (!cleanSlug) {
      return new Response(JSON.stringify({ message: "Missing slug" }), {
        status: 400,
      });
    }

    const db = adminDb();

    const snap = await db
      .collection("generatedSites")
      .where("slug", "==", cleanSlug)
      .limit(1)
      .get();

    if (snap.empty) {
      return new Response(JSON.stringify({ message: "Not found" }), {
        status: 404,
      });
    }

    const doc = snap.docs[0];
    const data = doc.data();

    // Prefer top-level link, fallback to links[0]
    const link = data.link || data?.links?.[0] || null;

    return new Response(
      JSON.stringify({
        id: doc.id,
        owner: { name: data?.name || "", email: data?.email || "" },
        link,
        slug: data.slug,
        website: `/v/${data.slug}`,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("GET /api/generated-sites/[slug] error:", err);
    return new Response(
      JSON.stringify({ message: "Server error", error: err?.message || String(err) }),
      { status: 500 }
    );
  }
}
