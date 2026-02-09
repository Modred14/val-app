import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { to, message, name } = await req.json();

    if (!to || !message) {
      return new Response(
        JSON.stringify({ message: "Missing email or message" }),
        { status: 400 }
      );
    }

    await resend.emails.send({
      from: "Modred from Val-App <onboarding@resend.dev>", // works in dev
      to,
      subject: "💖 They Said YES!",
      html: `
        <h2>Hello ${name || "there"} </h2>
        <p>${message}</p>
      `,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Email error:", err);

    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
}
