import { adminDb } from "../../../../lib/firebaseAdmin";

const slugify = (s = "") =>
  s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-") // spaces -> dash
    .replace(/[^a-z0-9-]/g, "") // keep only a-z 0-9 -
    .replace(/-+/g, "-") // collapse multiple dashes
    .replace(/^-|-$/g, ""); // trim edges

const rand4 = () => {
  try {
    return crypto.randomUUID().slice(0, 4);
  } catch {
    return Math.random().toString(36).slice(2, 6);
  }
};

async function slugExists(db, slug) {
  const snap = await db
    .collection("generatedSites")
    .where("slug", "==", slug)
    .limit(1)
    .get();
  return !snap.empty;
}

async function generateUniqueSlug(db, baseSlug) {
  let candidate = baseSlug;
  let attempts = 0;

  while (await slugExists(db, candidate)) {
    attempts += 1;
    candidate = `${baseSlug}-${rand4()}`; // ✅ add another "-" + chars

    if (attempts > 25) {
      throw new Error("Could not generate a unique URL. Try again.");
    }
  }

  return candidate;
}

export async function POST(req) {
  try {
    const body = await req.json();

    if (!body?.email || !body?.name) {
      return new Response(
        JSON.stringify({ message: "Name and email are required" }),
        { status: 400 },
      );
    }

    const link0 = body?.links?.[0];
    const hisHerName = link0?.name || "";
    const hisHerOtherName = link0?.secName || "";

    // Prefer generating from names (safer + consistent)
    let baseSlug = slugify(`${hisHerName}-${hisHerOtherName}`);

    // Fallback: if names missing, try the provided url
    if (!baseSlug) baseSlug = slugify(link0?.url || "");

    if (!baseSlug) {
      return new Response(
        JSON.stringify({ message: "Missing/invalid slug inputs" }),
        { status: 400 },
      );
    }

    const db = adminDb();

    // ✅ server-side uniqueness guarantee
    const uniqueSlug = await generateUniqueSlug(db, baseSlug);

    const updatedLink0 = {
      ...link0,
      id: uniqueSlug,
      url: uniqueSlug,
    };

    const ref = await db.collection("generatedSites").add({
      ...body,
      slug: uniqueSlug, // ✅ TOP LEVEL slug
      link: updatedLink0, // ✅ TOP LEVEL link (optional but useful)
      links: [updatedLink0], // ✅ keep in links too
      createdAt: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        message: "Saved successfully",
        id: ref.id,
        slug: uniqueSlug,
      }),
      { status: 201 },
    );
  } catch (err) {
    console.error("POST /api/generated-sites error:", err);
    return new Response(
      JSON.stringify({
        message: "Server error",
        error: err?.message || String(err),
      }),
      { status: 500 },
    );
  }
}
