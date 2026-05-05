function getExpectedPassword(scope) {
  if (scope === "admin") return process.env.ADMIN_PASS || "";
  return process.env.STUDIO_PASS || process.env.ADMIN_PASS || "";
}

export async function POST(req) {
  try {
    const body = await req.json();
    const password = (body?.password || "").toString();
    const scope = (body?.scope || "studio").toString();
    const expected = getExpectedPassword(scope);

    if (!expected) {
      return Response.json(
        { success: false, error: "System config missing." },
        { status: 500 }
      );
    }

    if (!password || password !== expected) {
      return Response.json(
        { success: false, error: "Invalid Access Key" },
        { status: 401 }
      );
    }

    return Response.json({ success: true });
  } catch {
    return Response.json(
      { success: false, error: "Bad request" },
      { status: 400 }
    );
  }
}
