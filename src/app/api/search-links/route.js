import { adminDb } from "../../../../lib/firebaseAdmin";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return new Response(
        JSON.stringify({ message: "Email is required" }),
        { status: 400 }
      );
    }

    const db = adminDb();

    // Query by email
    const snap = await db
      .collection("generatedSites")
      .where("email", "==", email.trim())
      .get();

    if (snap.empty) {
      return new Response(
        JSON.stringify({ links: [] }),
        { status: 200 }
      );
    }

    const results = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return new Response(
      JSON.stringify({ links: results }),
      { status: 200 }
    );
  } catch (err) {
    console.error("SEARCH LINKS ERROR:", err);

    return new Response(
      JSON.stringify({
        message: "Server error",
        error: err?.message,
      }),
      { status: 500 }
    );
  }
}
