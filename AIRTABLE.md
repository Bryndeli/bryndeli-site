# Airtable setup

## Bryndeli Match hire requests

Create a table in the Bryndeli base with these fields:

| Field | Airtable type | Notes |
| --- | --- | --- |
| `Hiring as` | Single line text | `A family or individual` or `An agency or care home`. |
| `Postcode area` | Single line text | Max 20 characters. |
| `Help needed` | Long text | Max 1000 characters. |
| `Email` | Email | Max 254 characters. |
| `Consent` | Checkbox | Required. |
| `Submitted at` | Date with time | ISO 8601 timestamp. |
| `UTM source` | Single line text | Max 200 characters. |
| `UTM medium` | Single line text | Max 200 characters. |
| `UTM campaign` | Single line text | Max 200 characters. |
| `UTM content` | Single line text | Max 200 characters. |

Environment variables:

| Variable | Purpose |
| --- | --- |
| `AIRTABLE_TOKEN` | Airtable personal access token with write access to the base. |
| `AIRTABLE_BASE_ID` | Airtable base ID. |
| `AIRTABLE_HIRE_TABLE` | Hire requests table name or ID. |

If these variables are not set, `/hire` shows `Requests open soon` and no record is submitted.

## Bryndeli Match carer sign-up

Set `CARER_SIGNUP_URL` in Vercel to the external carer sign-up form URL. If it is unset, Join buttons on `/carers` scroll to `#join`.

## Bryndeli Circle / Families waitlist

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
