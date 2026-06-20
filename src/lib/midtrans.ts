import midtransClient from "midtrans-client";

// Snap client (for token creation)
export const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
  serverKey: process.env.MIDTRANS_SERVER_KEY || "",
  clientKey: process.env.MIDTRANS_CLIENT_KEY || "",
});

// Helper: query Midtrans transaction status via REST API (no CoreApi needed)
export async function getMidtransTransactionStatus(orderId: string): Promise<Record<string, any>> {
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
  const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
  const baseUrl = isProduction
    ? "https://api.midtrans.com"
    : "https://api.sandbox.midtrans.com";

  const credentials = Buffer.from(`${serverKey}:`).toString("base64");

  const response = await fetch(`${baseUrl}/v2/${orderId}/status`, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Authorization": `Basic ${credentials}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Midtrans API error (${response.status}): ${errorText}`);
  }

  return response.json();
}
