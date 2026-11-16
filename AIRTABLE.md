# Airtable setup: Bryndeli for Families waitlist

Create a table in your base with these fields. Names must match exactly. They are defined in one constant, `FIELD`, at the top of [api/families-waitlist.js](api/families-waitlist.js), so you can rename them there.

| Field | Airtable type | Notes |
| --- | --- | --- |
| `Name` | Single line text | Primary field. Max 200 characters. |
| `Email` | Email (or single line text) | Max 254 characters. |
| `Cares for` | Single line text | One of: A parent, A partner, A child, Someone else. Use text, not single select, so a renamed option never rejects a signup. |
| `Employs PAs` | Single select | Options: `Yes`, `No`. |
| `Hardest part` | Long text | Optional. Max 1000 characters. |
| `Consent` | Checkbox | Always ticked: the form requires it. |
| `UTM source` | Single line text | From the page URL. Max 200 characters. |
| `UTM medium` | Single line text | |
| `UTM campaign` | Single line text | |
| `UTM content` | Single line text | |
| `Signed up at` | Single line text, or Date with time (ISO, GMT) | ISO 8601 timestamp. |

## Environment variables (Vercel, server side only)

| Variable | Purpose |
| --- | --- |
| `AIRTABLE_TOKEN` | Personal access token with `data.records:write` on this base. |
| `AIRTABLE_BASE_ID` | Starts with `app`. |
| `AIRTABLE_WAITLIST_TABLE` | Table name or ID. |
| `FAMILIES_SURVEY_URL` | Optional. Link for the "Take the 5 minute survey" button. The button is hidden if unset. |

If the first three aren't set, the form shows "Early access sign up opens soon" and nothing is submitted.
