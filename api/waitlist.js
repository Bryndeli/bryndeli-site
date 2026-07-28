// Vercel serverless function: POST /api/waitlist
// Validates a waiting-list signup, writes it to Airtable, and sends a
// Brevo auto-reply. See prompt/prompt-waiting-list.md for the spec.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES = new Set(["Owner", "Manager", "Carer", "Other"]);

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

Thanks for joining the Bryndeli waiting list.

Bryndeli is an AI companion that reads care plans and answers carers' questions during visits — by voice or text, cited from the plan. We're launching pilots soon.

I'll be in touch personally when we're ready to onboard your service, or sooner if something you'd want to know comes up.

If you have questions in the meantime, just reply to this email.

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
  const serviceName = String(body.serviceName || "").trim();
  const role = String(body.role || "").trim();
  const interest = String(body.interest || "").trim();
  const website = String(body.website || "").trim(); // honeypot

  // Honeypot tripped — pretend success, record nothing.
  if (website) {
    res.status(200).json({ ok: true });
    return;
  }

  if (!name || !email || !serviceName || !role) {
    res.status(400).json({
      ok: false,
      error: "Please fill in your name, email, service name, and role.",
    });
    return;
  }
  if (!EMAIL_RE.test(email)) {
    res.status(400).json({ ok: false, error: "Please enter a valid email address." });
    return;
  }
  if (!ROLES.has(role)) {
    res.status(400).json({ ok: false, error: "Please select a valid role." });
    return;
  }

  const {
    AIRTABLE_API_KEY,
    AIRTABLE_BASE_ID,
    AIRTABLE_TABLE_NAME,
    BREVO_API_KEY,
    MAIL_FROM_ADDRESS,
  } = process.env;

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_NAME) {
    console.error("Waitlist: missing Airtable env vars");
    res
      .status(500)
      .json({ ok: false, error: "Something went wrong on our end. Please try again shortly." });
    return;
  }

  try {
    const airtableRes = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`,
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
                "Service Name": serviceName,
                Role: role,
                Interest: interest,
                "Signed Up At": new Date().toISOString(),
                Status: "New",
                Source: "Signup",
              },
            },
          ],
        }),
      },
    );

    if (!airtableRes.ok) {
      const errText = await airtableRes.text().catch(() => "");
      console.error("Waitlist: Airtable error", airtableRes.status, errText);
      res
        .status(502)
        .json({ ok: false, error: "Something went wrong on our end. Please try again shortly." });
      return;
    }
  } catch (err) {
    console.error("Waitlist: Airtable request failed", err);
    res
      .status(502)
      .json({ ok: false, error: "Something went wrong on our end. Please try again shortly." });
    return;
  }

  // Auto-reply is best-effort — a delivery hiccup shouldn't block the signup,
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
          subject: "Thanks for joining the Bryndeli waiting list",
          textContent: autoReplyText(name),
        }),
      });
    } catch (err) {
      console.error("Waitlist: Brevo email failed", err);
    }
  } else {
    console.error("Waitlist: missing Brevo env vars, skipping auto-reply");
  }

  res.status(200).json({ ok: true });
};
