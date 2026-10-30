# KER — landing page 2026

Prototype de validation de la landing page immersive KER (cahier des charges v1.2 du 30 octobre 2026).

- `src/index.src.html` : source de la page (HTML, CSS et JS), avec des marqueurs `__IMG_nom__`.
- `assets/` : logos, captures produit et photos, inlinés au build.
- `tools/build.py` : génère `public/index.html`, page unique autonome.
- `public/` : dossier publié tel quel par Netlify (relancer le build et committer après chaque modification).

```
python3 tools/build.py
```

## Points provisoires

- Logo et couleurs extraits de la planche PNG : à remplacer par les fichiers vectoriels maîtres.
- Photos générées par IA (personnes et lieux fictifs) ; Industrie en illustration SVG.
- Captures p. 19 en basse définition ; écrans cartographie, simulation J−1 et déclenchement manquants.
- Formulaire sans envoi réel : routage CRM, mentions légales et politique de confidentialité à fournir.
