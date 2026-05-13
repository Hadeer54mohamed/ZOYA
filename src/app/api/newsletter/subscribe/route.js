import { upsertSubscriber } from "../_lib/subscribers";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const result = await upsertSubscriber(body?.email);

    if (!result.ok) {
      return Response.json({ error: result.error }, { status: result.status });
    }

    return Response.json({
      success: true,
      email: result.email,
    });
  } catch (err) {
    console.error("[newsletter/subscribe] Unexpected error:", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}

