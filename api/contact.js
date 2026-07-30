// Vercel serverless function: POST /api/contact
// Validates a contact-form enquiry, writes it to Airtable, and sends a
// Brevo auto-reply. Mirrors the waiting-list function's shape/limits.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOPICS = new Set(["General", "Sales", "Support", "Partnership"]);

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 3;

// Per-instance only — resets on cold start and isn't shared across
// concurrent instances. Acceptable "basic" anti-abuse at this volume;
// a durable store (e.g. Redis) would be needed for a stronger guarantee.
const submissions = new Map();

function getClientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (fwd) return fwd.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

function isRateLimited(ip) {
  const now = Date.now();
  const recent = (submissions.get(ip) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  recent.push(now);
  submissions.set(ip, recent);
  return recent.length > RATE_LIMIT_MAX;
}

function autoReplyText(name) {
  return `Hi ${name},

Thanks for getting in touch with Bryndeli.

I've received your message and will get back to you personally within one business day.

If it's urgent in the meantime, just reply to this email.

Regards,
Olu Akinyemi
Founder, Bryndeli
bryndeli.co.uk`;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    res
      .status(429)
      .json({ ok: false, error: "Too many submissions. Please try again later." });
    return;
  }

  const body = req.body || {};
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const topic = String(body.topic || "").trim();
  const message = String(body.message || "").trim();
  const website = String(body.website || "").trim(); // honeypot

  // Honeypot tripped — pretend success, record nothing.
  if (website) {
    res.status(200).json({ ok: true });
    return;
  }

  if (!name || !email || !topic || !message) {
    res.status(400).json({
      ok: false,
      error: "Please fill in your name, email, topic, and message.",
    });
    return;
  }
  if (!EMAIL_RE.test(email)) {
    res.status(400).json({ ok: false, error: "Please enter a valid email address." });
    return;
  }
  if (!TOPICS.has(topic)) {
    res.status(400).json({ ok: false, error: "Please select a valid topic." });
    return;
  }

  const {
    AIRTABLE_API_KEY,
    AIRTABLE_BASE_ID,
    AIRTABLE_CONTACT_TABLE_NAME,
    BREVO_API_KEY,
    MAIL_FROM_ADDRESS,
  } = process.env;

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_CONTACT_TABLE_NAME) {
    console.error("Contact: missing Airtable env vars");
    res
      .status(500)
      .json({ ok: false, error: "Something went wrong on our end. Please try again shortly." });
    return;
  }

  try {
    const airtableRes = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_CONTACT_TABLE_NAME)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: [
            {
              fields: {
                Name: name,
                Email: email,
                Topic: topic,
                Message: message,
                "Submitted At": new Date().toISOString(),
                Status: "New",
                Source: "Contact form",
              },
            },
          ],
        }),
      },
    );

    if (!airtableRes.ok) {
      const errText = await airtableRes.text().catch(() => "");
      console.error("Contact: Airtable error", airtableRes.status, errText);
      res
        .status(502)
        .json({ ok: false, error: "Something went wrong on our end. Please try again shortly." });
      return;
    }
  } catch (err) {
    console.error("Contact: Airtable request failed", err);
    res
      .status(502)
      .json({ ok: false, error: "Something went wrong on our end. Please try again shortly." });
    return;
  }

  // Auto-reply is best-effort — a delivery hiccup shouldn't block the submission,
  // since the Airtable record (the source of truth) is already saved.
  if (BREVO_API_KEY && MAIL_FROM_ADDRESS) {
    try {
      await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": BREVO_API_KEY,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          sender: { email: MAIL_FROM_ADDRESS, name: "Olu Akinyemi" },
          to: [{ email, name }],
          subject: "Thanks for contacting Bryndeli",
          textContent: autoReplyText(name),
        }),
      });
    } catch (err) {
      console.error("Contact: Brevo email failed", err);
    }
  } else {
    console.error("Contact: missing Brevo env vars, skipping auto-reply");
  }

  res.status(200).json({ ok: true });
};
