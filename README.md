# KER — landing page 2026 (prototype v0.3)

Site statique multipage (HTML/CSS/JS, sans framework), déployé sur Netlify.

## Structure
- `src/pages/` : pages (`index.html`, `canicule.html`, `panne-electrique.html`) avec front matter (`title`, `description`, `base`).
- `src/partials/` : `header.html`, `footer.html` (inclus via `{{> header}}`, `{{> footer}}`).
- `src/ker.css`, `src/ker.js` : styles et scripts communs.
- `assets/` : images (copiées dans `img/`).
- `tools/build.py` : génère `public/` (site Netlify) et `artifact/` (aperçu Claude, ignoré par git).

## Build
```
python3 tools/build.py
```
Puis commiter `public/`. Netlify publie `public` sans commande de build (`netlify.toml`).

## Formulaire
Netlify Forms (`demande-demo`) : activer la détection des formulaires dans les réglages du site Netlify. Le message de succès ne s'affiche qu'après une réponse positive du serveur.

## Points à valider
Mention « Entreprise française · Basée en France », garanties techniques (CTO), pages légales, visuels IA, logo vectoriel.
