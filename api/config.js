module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }
  res.status(200).json({ carerSignupUrl: process.env.CARER_SIGNUP_URL || "" });
};
