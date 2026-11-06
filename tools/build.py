"""Construit le site KER.

- public/   : site statique publié par Netlify (CSS et JS en fichiers, images dans public/img).
- artifact/ : même site avec CSS et JS intégrés à chaque page, pour l'aperçu Claude.

Chaque page de src/pages commence par un en-tête (title, description, base) puis du HTML
qui peut inclure {{> header}}, {{> footer}} et {{BASE}} (préfixe des liens vers la page d'accueil).
"""
import pathlib, re, shutil

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
# Polices hébergées avec le site (pas d'appel à Google Fonts) : chemins relatifs à css/ker.css.
css = (SRC / "fonts.css").read_text(encoding="utf-8") + (SRC / "ker.css").read_text(encoding="utf-8")
css_inline = css.replace("../fonts/", "fonts/")
js = (SRC / "ker.js").read_text(encoding="utf-8")
partials = {p.stem: p.read_text(encoding="utf-8") for p in (SRC / "partials").glob("*.html")}

FONTS = '<link rel="preload" href="%sfonts/k3kQo8UDI-1M0wlSfdnoLg.woff2" as="font" type="font/woff2" crossorigin>'


def parse(path):
    text = path.read_text(encoding="utf-8")
    m = re.match(r"---\n(.*?)\n---\n", text, re.S)
    meta = dict(re.findall(r"^(\w+):\s*(.*)$", m.group(1), re.M))
    body = text[m.end():]
    for _ in range(3):
        body = re.sub(r"\{\{> (\w+)\}\}", lambda x: partials[x.group(1)], body)
    return meta, body.replace("{{BASE}}", meta.get("base", ""))


def head(meta):
    return ("<title>%s</title>\n" % meta["title"]
            + '<meta name="claude:viewport-fit-sides" content="cover">\n'
            + '<meta name="description" content="%s">\n' % meta["description"]
            + '<link rel="icon" type="image/png" href="img/icon.png">\n' + FONTS % "")


def full(meta, body, inline):
    style = "<style>\n%s</style>" % css_inline if inline else '<link rel="stylesheet" href="css/ker.css">'
    script = "<script>\n%s</script>" % js if inline else '<script src="js/ker.js" defer></script>'
    return ('<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
            + head(meta) + "\n" + style + "\n</head>\n<body>\n" + body + "\n" + script + "\n</body>\n</html>\n")


for out in ("public", "artifact"):
    d = ROOT / out
    if d.exists():
        shutil.rmtree(d)
    (d / "img").mkdir(parents=True)
    for f in (ROOT / "assets").iterdir():
        if f.is_file():
            shutil.copy(f, d / "img" / f.name)
    shutil.copytree(ROOT / "assets" / "fonts", d / "fonts")
(ROOT / "public" / "css").mkdir()
(ROOT / "public" / "js").mkdir()
(ROOT / "public" / "css" / "ker.css").write_text(css, encoding="utf-8")
(ROOT / "public" / "js" / "ker.js").write_text(js, encoding="utf-8")

for page in sorted((SRC / "pages").glob("*.html")):
    meta, body = parse(page)
    (ROOT / "public" / page.name).write_text(full(meta, body, False), encoding="utf-8")
    if page.name == "index.html":
        # L'aperçu Claude fournit lui-même doctype, head et body autour de la page d'accueil.
        frag = head(meta) + "\n<style>\n%s</style>\n" % css_inline + body + "\n<script>\n%s</script>\n" % js
        (ROOT / "artifact" / page.name).write_text(frag, encoding="utf-8")
    else:
        (ROOT / "artifact" / page.name).write_text(full(meta, body, True), encoding="utf-8")
    print(page.name)
