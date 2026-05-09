import { getShippingFeesMapCached } from "../../../sanity/lib/shippingFees";

export async function GET() {
  const fees = await getShippingFeesMapCached();
  return Response.json({ fees });
}
