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

## Still to do
1. **Cloudflare Turnstile** (invisible bot check). Elementor Pro 4.2.3 has no native Turnstile field, so install the free plugin *Simple Cloudflare Turnstile*, enter a Site Key + Secret Key from a free Cloudflare account (Turnstile → Add widget, hostname `rsraingutters.com`, mode Managed), and enable it for Elementor Forms.
2. Optional: enable Wordfence rate limiting for POSTs to `/wp-admin/admin-ajax.php`; close comments sitewide if unused.

## Notes
- Saving a page from the classic WordPress editor or the Divi builder clears Elementor's `_elementor_edit_mode` flag and the page falls back to old Divi content. Always save these pages from the Elementor editor. `tools/wp/restore_flag.py` restores the flag if it happens again.
- `tools/wp/wpclient.py` expects a curl cookie jar (`jar-py.txt`) from a logged-in admin session; cookies and nonces are git-ignored.
