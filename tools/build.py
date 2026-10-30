"""Assemble public/index.html : inline les images de assets/ en data: URI dans src/index.src.html."""
import base64, pathlib, re
ROOT = pathlib.Path(__file__).resolve().parent.parent
src = (ROOT / "src" / "index.src.html").read_text(encoding="utf-8")
mime = {".png": "image/png", ".webp": "image/webp"}
for name in sorted(set(re.findall(r"__IMG_([\w-]+)__", src))):
    f = next(p for p in (ROOT / "assets").glob(name + ".*"))
    uri = "data:%s;base64,%s" % (mime[f.suffix], base64.b64encode(f.read_bytes()).decode())
    src = src.replace("__IMG_%s__" % name, uri)
html = ('<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
        '</head>\n<body>\n' + src + '\n</body>\n</html>\n')
(ROOT / "public" / "index.html").write_text(html, encoding="utf-8")
print("public/index.html", len(html), "octets")
