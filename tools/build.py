"""Construit le site KER.

- public/   : site statique publié par Netlify (CSS et JS en fichiers, images dans public/img).
- artifact/ : même site avec CSS et JS intégrés à chaque page, pour l'aperçu Claude.

Chaque page de src/pages commence par un en-tête (title, description, base) puis du HTML
qui peut inclure {{> header}}, {{> footer}} et {{BASE}} (préfixe des liens vers la page d'accueil).
"""
import pathlib, re, shutil

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
css = (SRC / "ker.css").read_text(encoding="utf-8")
js = (SRC / "ker.js").read_text(encoding="utf-8")
partials = {p.stem: p.read_text(encoding="utf-8") for p in (SRC / "partials").glob("*.html")}

FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n'
         '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,400..800'
         '&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap">')


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
            + '<link rel="icon" type="image/png" href="img/icon.png">\n' + FONTS)


def full(meta, body, inline):
    style = "<style>\n%s</style>" % css if inline else '<link rel="stylesheet" href="css/ker.css">'
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
        shutil.copy(f, d / "img" / f.name)
(ROOT / "public" / "css").mkdir()
(ROOT / "public" / "js").mkdir()
(ROOT / "public" / "css" / "ker.css").write_text(css, encoding="utf-8")
(ROOT / "public" / "js" / "ker.js").write_text(js, encoding="utf-8")

for page in sorted((SRC / "pages").glob("*.html")):
    meta, body = parse(page)
    (ROOT / "public" / page.name).write_text(full(meta, body, False), encoding="utf-8")
    if page.name == "index.html":
        # L'aperçu Claude fournit lui-même doctype, head et body autour de la page d'accueil.
        frag = head(meta) + "\n<style>\n%s</style>\n" % css + body + "\n<script>\n%s</script>\n" % js
        (ROOT / "artifact" / page.name).write_text(frag, encoding="utf-8")
    else:
        (ROOT / "artifact" / page.name).write_text(full(meta, body, True), encoding="utf-8")
    print(page.name)
