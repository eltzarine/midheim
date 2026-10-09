# Les Pierres de Midheim

Jeu d’aventure coopératif à deux, pensé pour le téléphone (vertical et paysage) et l’ordinateur.
Deux héros traversent Midheim, de Tarkin aux Pics Rouges, pour réunir les quatre pierres divines avant les adeptes d’Amarath.

**Jouer :** https://eltzarine.github.io/midheim/

## Jouer à deux

1. L’un ouvre le jeu et touche **Créer une partie à deux** : un code de 4 lettres s’affiche en haut de l’écran.
2. L’autre ouvre le même lien, choisit son héros, tape le code dans **Rejoindre avec un code** et touche **Rejoindre**.

La partie tourne sur le téléphone de celui qui l’a créée ; la connexion passe par Firebase Realtime Database
(une « salle » `rooms/<CODE>` par partie, effacée quand les joueurs se déconnectent).

## Fonctionnalités

- Monde continu peint à la main, villes, donjons liés à l’histoire, boss et quêtes secondaires avec reliques
- Quatre classes (guerrier, mage, voleur, soigneur), talents, équipement visible sur le personnage, forge et enchantements
- Mises en scène en jeu, narratrice et voix des personnages
- Musiques et bruitages entièrement synthétisés dans le navigateur (aucun fichier audio pour la musique)
- Sauvegarde locale sur chaque appareil

## Structure

| Dossier | Contenu |
| --- | --- |
| `src/` | Modules JavaScript (concaténés dans l’ordre de `tools/build.py`) et `page.html` (styles et interface) |
| `data/world.json` | Terrain du monde (encodé RLE) et lieux |
| `assets/` | Carte de Midheim et voix enregistrées |
| `tools/build.py` | Assemble le jeu en un seul fichier HTML autonome |
| `tests/` | Tests de bout en bout (Playwright), avec un faux salon et un faux Firebase pour jouer à deux hors ligne |
| `docs/index.html` | Version publiée sur GitHub Pages (générée) |

## Construire

```sh
python3 tools/build.py          # docs/index.html (site web, avec politique de sécurité CSP)
python3 tools/build.py artifact # dist/midheim.html
```

## Tester

```sh
pip install playwright && playwright install chromium
python3 tools/build.py artifact && python3 tests/run.py
```

## Crédits

- Univers, carte et histoire de Midheim : eltzarine
- Voix : générées avec ElevenLabs
- Polices : Uncial Antiqua, Cinzel, Alegreya Sans (Google Fonts)
