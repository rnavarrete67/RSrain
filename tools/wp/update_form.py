"""Update one page's Elementor form definition (honeypot field / email type fix) and verify the saved result."""
import json, sys, wpclient as w
pid = sys.argv[1]
new_data = open(f"_elementor_data-{pid}.new.json").read()
r = w.req(f"/wp-json/wp/v2/pages/{pid}?context=edit", data={"meta": {"_elementor_data": new_data}}, method="POST", headers={"X-WP-Nonce": w.nonce()})
if "code" in r: print("ERROR", r); sys.exit(1)
got = json.loads(r["meta"]["_elementor_data"])
print(pid, r["title"]["raw"], "| round-trip equal:", got == json.loads(new_data), "| modified:", r["modified"])
def walk(els):
    for e in els:
        if e.get("elType") == "widget" and e.get("widgetType") == "form": yield e
        yield from walk(e.get("elements", []))
for f in walk(got):
    print("  form", f["id"], [(x["custom_id"], x.get("field_type", "text")) for x in f["settings"]["form_fields"]])
