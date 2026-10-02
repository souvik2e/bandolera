// ==========================================================================
// BANDOLERA — RAZORPAY PAYMENT FUNCTION
// Cloudflare Pages Function — handles order creation and payment verification
// Runs server-side. Secret key never touches the browser.
// ==========================================================================

export async function onRequest(context) {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  // ---- CREATE ORDER -------------------------------------------------------
  if (action === "create" && request.method === "POST") {
    try {
      const { amount, currency = "INR", receipt } = await request.json();

      if (!amount || amount < 100) {
        return new Response(
          JSON.stringify({ ok: false, error: "Invalid amount" }),
          { status: 400, headers: corsHeaders }
        );
      }

      const credentials = btoa(
        `${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`
      );

      const razorRes = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.round(amount),
          currency,
          receipt: receipt || `order_${Date.now()}`,
        }),
      });

      const order = await razorRes.json();

      if (!razorRes.ok) {
        return new Response(
          JSON.stringify({ ok: false, error: order.error?.description || "Razorpay error" }),
          { status: 502, headers: corsHeaders }
        );
      }

      return new Response(
        JSON.stringify({ ok: true, order_id: order.id, amount: order.amount, currency: order.currency, key_id: env.RAZORPAY_KEY_ID }),
        { status: 200, headers: corsHeaders }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ ok: false, error: "Server error" }),
        { status: 500, headers: corsHeaders }
      );
    }
  }

  // ---- VERIFY PAYMENT -----------------------------------------------------
  if (action === "verify" && request.method === "POST") {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        await request.json();

      const message = `${razorpay_order_id}|${razorpay_payment_id}`;
      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(env.RAZORPAY_KEY_SECRET),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const sigBuffer = await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(message)
      );
      const expectedSig = Array.from(new Uint8Array(sigBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      if (expectedSig !== razorpay_signature) {
        return new Response(
          JSON.stringify({ ok: false, error: "Payment verification failed" }),
          { status: 400, headers: corsHeaders }
        );
      }

      return new Response(
        JSON.stringify({ ok: true, payment_id: razorpay_payment_id }),
        { status: 200, headers: corsHeaders }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ ok: false, error: "Verification error" }),
        { status: 500, headers: corsHeaders }
      );
    }
  }

  return new Response(
    JSON.stringify({ ok: false, error: "Not found" }),
    { status: 404, headers: corsHeaders }
  );
}
