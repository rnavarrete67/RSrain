"""Restore the Elementor 'edit mode' flag on a page so Elementor renders it again.
Usage: python3 restore_flag.py <page_id>
"""
import sys, wpclient as w
pid = sys.argv[1]
r = w.req(f"/wp-json/wp/v2/pages/{pid}?context=edit", data={"meta": {"_elementor_edit_mode": "builder"}}, method="POST", headers={"X-WP-Nonce": w.nonce()})
print(pid, "edit_mode now:", repr(r["meta"]["_elementor_edit_mode"]), "| modified:", r["modified"])
