# rsraingutters.com — form spam protection

WordPress site (GoDaddy Managed WordPress, Divi theme, pages built with Elementor Pro 4.2.3, Cloudflare in front).

## Problem
All four lead forms (Elementor Pro form widgets) had no bot protection. The reCAPTCHA v3 script on the site belongs to Divi's contact module, which is unused, so it protected nothing.

## Changes applied to the live site (2026-09-10)
| Page | Form | Change |
|---|---|---|
| Home (id 2973) | New Construction ×2 | Honeypot field added; second form's Email field changed from `text` to `email` |
| Residential Services (id 3496) | Residential Services | Honeypot field added |
| Property Manager Landing (id 3289) | Property Management | Honeypot field added |

Applied by writing `_elementor_data` through the REST API (`tools/wp/update_form.py`), then Elementor "Clear Files & Data" and the GoDaddy cache flush.

Before/after copies of each page's Elementor data are in `backups/elementor-forms/`.

## Cloudflare Turnstile (done 2026-09-10)
Elementor Pro 4.2.3 has no native Turnstile field, so the free plugin *Simple Cloudflare Turnstile* (v1.43) is installed with a Managed-mode widget for `rsraingutters.com`. Settings → Cloudflare Turnstile → Elementor Forms is enabled (widget before button, scripts on all pages). The widget is injected client-side by the plugin's `elementor-forms.js`; submissions are validated server-side via the `elementor_pro/forms/validation` hook, so a request without a valid token is rejected.

## Optional follow-ups
- Wordfence rate limiting for POSTs to `/wp-admin/admin-ajax.php`.
- Close comments sitewide if unused (`/wp-json/wp/v2/comments` is publicly readable).
- Divi → Theme Options still holds an unused Google reCAPTCHA key; disabling it stops an unneeded Google script from loading.

## Notes
- Saving a page from the classic WordPress editor or the Divi builder clears Elementor's `_elementor_edit_mode` flag and the page falls back to old Divi content. Always save these pages from the Elementor editor. `tools/wp/restore_flag.py` restores the flag if it happens again.
- `tools/wp/wpclient.py` expects a curl cookie jar (`jar-py.txt`) from a logged-in admin session; cookies and nonces are git-ignored.

## Address autocomplete (`site/address-autocomplete.js`)
Adds Google Places (New) suggestions to every form's Address field and fills City + ZIP on selection. Manual typing keeps working; nothing about the forms, validation or Turnstile changes. Also sets standard browser `autocomplete` hints on name/phone/email/address/city/zip.

Setup:
1. Google Cloud: enable **Maps JavaScript API** and **Places API (New)** on a project with billing; create an API key restricted to websites `rsraingutters.com/*` and `*.rsraingutters.com/*` and to those two APIs.
2. Paste the key into `GOOGLE_KEY` in the script.
3. Elementor → Custom Code → Add New: location `</body> - End`, condition Entire Site, wrap the file in `<script>…</script>`, Publish.
4. Google loads only on first focus of an Address field. Results are biased to an 80 km circle around the Treasure Valley and restricted to the US.
