import nodemailer from "nodemailer";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  subject?: unknown;
  projectType?: unknown;
  message?: unknown;
  website?: unknown;
};

type RateRecord = {
  count: number;
  resetAt: number;
};

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const rateStore = new Map<string, RateRecord>();

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 120;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const current = rateStore.get(ip);

  if (!current || now >= current.resetAt) {
    rateStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (current.count >= RATE_LIMIT_MAX) {
    return true;
  }

  current.count += 1;
  rateStore.set(ip, current);
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const contentLength = Number(request.headers.get("content-length") || "0");
    if (contentLength > 20_000) {
      return NextResponse.json({ message: "The submitted message is too large." }, { status: 413 });
    }

    const ip = getClientIp(request);
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { message: "Too many messages were submitted. Please wait 15 minutes and try again." },
        { status: 429 },
      );
    }

    const payload = (await request.json()) as ContactPayload;

    const name = cleanText(payload.name, 80);
    const email = cleanText(payload.email, 120).toLowerCase();
    const subject = cleanText(payload.subject, 120);
    const projectType = cleanText(payload.projectType, 80);
    const message = cleanText(payload.message, 2000);
    const website = cleanText(payload.website, 120);

    // Hidden honeypot field: legitimate visitors never fill this in.
    if (website) {
      return NextResponse.json({ message: "Message received." }, { status: 200 });
    }

    if (name.length < 2) {
      return NextResponse.json({ message: "Please enter your name." }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ message: "Please enter a valid email address." }, { status: 400 });
    }

    if (subject.length < 3) {
      return NextResponse.json({ message: "Please enter a subject." }, { status: 400 });
    }

    if (message.length < 10) {
      return NextResponse.json({ message: "Please provide a little more detail in your message." }, { status: 400 });
    }

    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.replaceAll(" ", "");
    const contactTo = process.env.CONTACT_TO || gmailUser;

    if (!gmailUser || !gmailAppPassword || !contactTo) {
      console.error("Missing Gmail SMTP environment variables.");
      return NextResponse.json(
        { message: "The contact service is not configured yet. Please email Shiva directly." },
        { status: 503 },
      );
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject);
    const safeProjectType = escapeHtml(projectType || "Not specified");
    const safeMessage = escapeHtml(message).replaceAll("\n", "<br>");

    await transporter.sendMail({
      from: `Shiva Portfolio Contact <${gmailUser}>`,
      to: contactTo,
      replyTo: { name, address: email },
      subject: `[Portfolio Contact] ${subject}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Project type: ${projectType || "Not specified"}`,
        `Subject: ${subject}`,
        "",
        message,
      ].join("\n"),
      html: `
        <div style="margin:0;padding:32px;background:#020617;font-family:Arial,sans-serif;color:#e2e8f0;">
          <div style="max-width:680px;margin:0 auto;border:1px solid #1e3a5f;border-radius:18px;overflow:hidden;background:#07111f;">
            <div style="padding:28px 32px;background:linear-gradient(135deg,#0f172a,#1e3a8a,#0ea5e9);">
              <p style="margin:0 0 8px;color:#bae6fd;font-size:13px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">New portfolio enquiry</p>
              <h1 style="margin:0;color:#ffffff;font-size:27px;">${safeSubject}</h1>
            </div>
            <div style="padding:30px 32px;">
              <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
                <tr><td style="padding:9px 0;color:#7dd3fc;width:130px;">Name</td><td style="padding:9px 0;color:#ffffff;font-weight:700;">${safeName}</td></tr>
                <tr><td style="padding:9px 0;color:#7dd3fc;">Email</td><td style="padding:9px 0;"><a href="mailto:${safeEmail}" style="color:#38bdf8;">${safeEmail}</a></td></tr>
                <tr><td style="padding:9px 0;color:#7dd3fc;">Project type</td><td style="padding:9px 0;color:#ffffff;">${safeProjectType}</td></tr>
              </table>
              <div style="border-top:1px solid #1e293b;padding-top:22px;line-height:1.75;color:#cbd5e1;">${safeMessage}</div>
            </div>
            <div style="padding:18px 32px;background:#050b14;color:#64748b;font-size:12px;">Sent from shiva's Vercel portfolio contact form.</div>
          </div>
        </div>
      `,
    });

    return NextResponse.json({
      message: "Thanks for reaching out. I’ll review your message and respond as soon as possible.",
    });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { message: "The message could not be sent right now. Please try again shortly." },
      { status: 500 },
    );
  }
}
