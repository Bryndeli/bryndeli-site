// Vercel serverless function for the Bryndeli for Families waitlist.
//   GET  /api/families-waitlist  -> { enabled: boolean }
//   POST /api/families-waitlist  -> writes one record to Airtable
// Only this function talks to Airtable. The token never reaches the browser.

// Airtable column names — rename them here, in one place (see AIRTABLE.md).
const FIELD = {
  name: "Name",
  email: "Email",
  caresFor: "Cares for",
  employsPAs: "Employs PAs",
  hardestPart: "Hardest part",
  consent: "Consent",
  utmSource: "UTM source",
  utmMedium: "UTM medium",
  utmCampaign: "UTM campaign",
  utmContent: "UTM content",
  signedUpAt: "Signed up at",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CARES_FOR = new Set(["A parent", "A partner", "A child", "Someone else"]);
const MAX = { name: 200, email: 254, hardestPart: 1000, utm: 200 };

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 5;

// Per-instance only: resets on cold start and isn't shared across instances.
const submissions = new Map();

function getClientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (fwd) return String(fwd).split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

function isRateLimited(ip) {
  const now = Date.now();
  const recent = (submissions.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  submissions.set(ip, recent);
  if (submissions.size > 5000) {
    for (const [key, times] of submissions) {
      if (!times.some((t) => now - t < RATE_LIMIT_WINDOW_MS)) submissions.delete(key);
    }
  }
  return recent.length > RATE_LIMIT_MAX;
}

const str = (v, max) => String(v ?? "").trim().slice(0, max);

function isConfigured() {
  const { AIRTABLE_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_WAITLIST_TABLE } = process.env;
  return Boolean(AIRTABLE_TOKEN && AIRTABLE_BASE_ID && AIRTABLE_WAITLIST_TABLE);
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    res.status(200).json({ enabled: isConfigured() });
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    res.status(429).json({ ok: false, error: "Too many attempts. Please try again in a minute." });
    return;
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};

  // Honeypot: pretend success, record nothing.
  if (str(body.website, 200)) {
    res.status(200).json({ ok: true });
    return;
  }

  const name = str(body.name, MAX.name + 1);
  const email = str(body.email, MAX.email + 1);
  const caresFor = str(body.caresFor, 50);
  const employsPAs = str(body.employsPAs, 10);
  const hardestPart = String(body.hardestPart ?? "").trim();

  const fields = {};
  if (!name) fields.name = "Please enter your name.";
  else if (name.length > MAX.name) fields.name = "That name is too long.";
  if (!email) fields.email = "Please enter your email.";
  else if (email.length > MAX.email || !EMAIL_RE.test(email)) fields.email = "Please enter a valid email address.";
  if (employsPAs !== "Yes" && employsPAs !== "No") fields.employsPAs = "Please choose Yes or No.";
  if (hardestPart.length > MAX.hardestPart) fields.hardestPart = "Please keep this under 1000 characters.";
  if (body.consent !== true) fields.consent = "Please tick the box so we can email you about early access.";
  if (caresFor && !CARES_FOR.has(caresFor)) fields.caresFor = "Please choose an option.";

  if (Object.keys(fields).length) {
    res.status(400).json({ ok: false, error: "Please check the form and try again.", fields });
    return;
  }

  if (!isConfigured()) {
    res.status(503).json({ ok: false, error: "Early access sign up opens soon" });
    return;
  }

  const { AIRTABLE_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_WAITLIST_TABLE, FAMILIES_SURVEY_URL } = process.env;

  const record = {
    [FIELD.name]: name,
    [FIELD.email]: email,
    [FIELD.caresFor]: caresFor || "Someone else",
    [FIELD.employsPAs]: employsPAs,
    [FIELD.hardestPart]: hardestPart,
    [FIELD.consent]: true,
    [FIELD.utmSource]: str(body.utm_source, MAX.utm),
    [FIELD.utmMedium]: str(body.utm_medium, MAX.utm),
    [FIELD.utmCampaign]: str(body.utm_campaign, MAX.utm),
    [FIELD.utmContent]: str(body.utm_content, MAX.utm),
    [FIELD.signedUpAt]: new Date().toISOString(),
  };

  const genericError = "Something went wrong on our end. Please try again shortly.";

  try {
    const airtableRes = await fetch(
      `https://api.airtable.com/v0/${encodeURIComponent(AIRTABLE_BASE_ID)}/${encodeURIComponent(AIRTABLE_WAITLIST_TABLE)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AIRTABLE_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ records: [{ fields: record }] }),
      },
    );

    if (!airtableRes.ok) {
      // Log status and Airtable's error type only, never the person's details.
      const detail = await airtableRes.json().catch(() => ({}));
      console.error("Families waitlist: Airtable error", airtableRes.status, detail?.error?.type || "");
      res.status(502).json({ ok: false, error: genericError });
      return;
    }
  } catch (err) {
    console.error("Families waitlist: Airtable request failed", err?.name || "Error");
    res.status(502).json({ ok: false, error: genericError });
    return;
  }

  const out = { ok: true };
  if (FAMILIES_SURVEY_URL) out.surveyUrl = FAMILIES_SURVEY_URL;
  res.status(200).json(out);
};

module.exports.FIELD = FIELD;
