const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HIRING_AS = new Set(["A family or individual", "An agency or care home"]);
const MAX = { hiringAs: 30, postcode: 20, help: 1000, email: 254, utm: 200 };
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 5;
const submissions = new Map();

const str = (value, max) => String(value ?? "").trim().slice(0, max);

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return String(forwarded).split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

function isRateLimited(ip) {
  const now = Date.now();
  const recent = (submissions.get(ip) || []).filter((time) => now - time < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  submissions.set(ip, recent);
  if (submissions.size > 5000) {
    for (const [key, times] of submissions) {
      if (!times.some((time) => now - time < RATE_LIMIT_WINDOW_MS)) submissions.delete(key);
    }
  }
  return recent.length > RATE_LIMIT_MAX;
}

function isConfigured() {
  return Boolean(process.env.AIRTABLE_TOKEN && process.env.AIRTABLE_BASE_ID && process.env.AIRTABLE_HIRE_TABLE);
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  if (isRateLimited(getClientIp(req))) {
    res.status(429).json({ ok: false, error: "Too many attempts. Please try again in a minute." });
    return;
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};
  if (str(body.website, 200)) {
    res.status(200).json({ ok: true });
    return;
  }

  const hiringAs = str(body.hiringAs, MAX.hiringAs);
  const postcode = str(body.postcode, MAX.postcode);
  const help = str(body.help, MAX.help);
  const email = str(body.email, MAX.email);
  const fields = {};
  if (!HIRING_AS.has(hiringAs)) fields.hiringAs = "Please choose who you are hiring as.";
  if (!postcode) fields.postcode = "Please enter your postcode area.";
  else if (postcode.length > MAX.postcode) fields.postcode = "That postcode area is too long.";
  if (!help) fields.help = "Please tell us what help is needed.";
  else if (help.length > MAX.help) fields.help = "Please keep this under 1000 characters.";
  if (!email) fields.email = "Please enter your email.";
  else if (email.length > MAX.email || !EMAIL_RE.test(email)) fields.email = "Please enter a valid email address.";
  if (body.consent !== true) fields.consent = "Please tick the consent box.";
  if (Object.keys(fields).length) {
    res.status(400).json({ ok: false, error: "Please check the form and try again.", fields });
    return;
  }

  if (!isConfigured()) {
    res.status(503).json({ ok: false, error: "Requests open soon" });
    return;
  }

  const record = {
    "Hiring as": hiringAs,
    "Postcode area": postcode,
    "Help needed": help,
    "Email": email,
    "Consent": true,
    "Submitted at": new Date().toISOString(),
    "UTM source": str(body.utm_source, MAX.utm),
    "UTM medium": str(body.utm_medium, MAX.utm),
    "UTM campaign": str(body.utm_campaign, MAX.utm),
    "UTM content": str(body.utm_content, MAX.utm),
  };

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${encodeURIComponent(process.env.AIRTABLE_BASE_ID)}/${encodeURIComponent(process.env.AIRTABLE_HIRE_TABLE)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ records: [{ fields: record }] }),
      },
    );
    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      console.error("Hire request: Airtable error", response.status, detail?.error?.type || "");
      res.status(502).json({ ok: false, error: "Something went wrong on our end. Please try again shortly." });
      return;
    }
  } catch (error) {
    console.error("Hire request: Airtable request failed", error?.name || "Error");
    res.status(502).json({ ok: false, error: "Something went wrong on our end. Please try again shortly." });
    return;
  }

  res.status(200).json({ ok: true });
};
