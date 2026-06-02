import { NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/db";
import { PaymentTransaction } from "@/models/PaymentTransaction";
import { completePayment } from "@/lib/payments";

export const runtime = "nodejs";

function getHeaderSecret(req: Request) {
  const bearer = req.headers.get("authorization") || "";
  if (bearer.toLowerCase().startsWith("bearer ")) return bearer.slice(7).trim();
  return req.headers.get("x-webhook-secret") || "";
}

function normalizeMatchText(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function verifySePaySignature(req: Request, rawBody: string, secret: string) {
  const signature = req.headers.get("x-sepay-signature") || "";
  const timestamp = req.headers.get("x-sepay-timestamp") || "";
  const received = signature.replace(/^sha256=/i, "").trim();
  if (!received || !timestamp) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`, "utf8")
    .digest("hex");

  const receivedBuffer = Buffer.from(received, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  return receivedBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

function normalizePayload(body: any) {
  const content = String(body.content || body.description || body.transaction_content || "");
  const transferType = String(body.transferType || body.transfer_type || body.type || "").toLowerCase();
  const amount = Number(body.transferAmount || body.amount || body.creditAmount || 0);
  const reference = String(body.referenceCode || body.reference || body.transactionId || body.id || "");
  const accountNumber = String(body.accountNumber || body.account_number || body.bankAccount || "");

  return { content, transferType, amount, reference, accountNumber };
}

export async function POST(req: Request) {
  try {
    const expectedSecret = process.env.PAYMENT_WEBHOOK_SECRET;
    const rawBody = await req.text();
    const hasSePaySignature = Boolean(req.headers.get("x-sepay-signature"));

    if (expectedSecret) {
      const isValid = hasSePaySignature
        ? verifySePaySignature(req, rawBody, expectedSecret)
        : getHeaderSecret(req) === expectedSecret;

      if (!isValid) {
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
      }
    }

    const body = JSON.parse(rawBody);
    const tx = normalizePayload(body);

    if (tx.transferType && !["in", "credit", "deposit"].includes(tx.transferType)) {
      return NextResponse.json({ success: true, ignored: "not_incoming" });
    }

    await dbConnect();

    const pendingCodes = await PaymentTransaction.distinct("orderCode", { status: "pending" }) as string[];
    const normalizedContent = normalizeMatchText(tx.content);
    const matchedCode = pendingCodes.find((code) => normalizedContent.includes(normalizeMatchText(code)));
    const matchedPayment = matchedCode
      ? await PaymentTransaction.findOne({ status: "pending", orderCode: matchedCode })
      : null;

    if (!matchedPayment) {
      return NextResponse.json({ success: true, ignored: "no_matching_order" });
    }

    if (tx.accountNumber && matchedPayment.bankAccountNumber && tx.accountNumber !== matchedPayment.bankAccountNumber) {
      return NextResponse.json({ success: true, ignored: "wrong_account" });
    }

    if (tx.amount < matchedPayment.finalPrice) {
      return NextResponse.json({ success: true, ignored: "amount_too_low" });
    }

    const completed = await completePayment({
      paymentId: matchedPayment._id.toString(),
      confirmedBy: "webhook",
      bankReference: tx.reference,
      webhookPayload: body,
    });

    return NextResponse.json({
      success: true,
      paymentId: completed._id.toString(),
      orderCode: completed.orderCode,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
