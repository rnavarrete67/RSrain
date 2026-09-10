"""Minimal authenticated client for the client's WordPress REST API, reusing the curl login session."""
import json, os, urllib.request
SITE = "https://rsraingutters.com"
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/128 Safari/537.36"
def _cookie():
    parts = []
    for l in open("jar-py.txt"):
        if l.strip() and not l.startswith("#"):
            c = l.rstrip("\n").split("\t"); parts.append(c[5] + "=" + c[6])
    return "; ".join(parts)
_op = urllib.request.build_opener(urllib.request.ProxyHandler({"https": os.environ["HTTPS_PROXY"]}))
def req(path, data=None, method=None, headers=None, raw=False):
    h = {"User-Agent": UA, "Cookie": _cookie()}
    h.update(headers or {})
    body = None
    if data is not None:
        body = json.dumps(data).encode(); h["Content-Type"] = "application/json"
    r = _op.open(urllib.request.Request(SITE + path, data=body, method=method, headers=h), timeout=120)
    b = r.read()
    return b if raw else json.loads(b)
def nonce():
    return req("/wp-admin/admin-ajax.php?action=rest-nonce", raw=True).decode().strip()
