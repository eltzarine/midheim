# Planches de personnage haute définition

Une planche par personnage, `<nom>.png`, avec sa fiche `<nom>.json`.
Une planche nommée comme une classe (`guerrier`, `mage`, `voleur`, `soigneur`) remplace le personnage du pack Ninja Adventure pour cette classe.

## Depuis PixelLab

```
python3 tools/import_pixellab.py guerrier <export_debout> [<export_combat>]
python3 tools/build.py
```

- `<export_debout>` : dossier dézippé avec `rotations/` (8 directions) et `animations/<course>/`.
- `<export_combat>` : dossier facultatif dont `animations/<attaque>/` donne l'attaque.

## Organisation de la planche

- Cases carrées de même taille (`cs`, 96 px pour le chevalier). Chaque image est centrée dans sa case.
- Une **ligne par direction**, dans l'ordre : bas (S), bas-droite (SE), droite (E), haut-droite (NE), haut (N), haut-gauche (NW), gauche (W), bas-gauche (SW).
- Colonnes : pose de repos, puis images de course, puis images d'attaque.

## Fiche (`.json`)

| Champ | Rôle |
| --- | --- |
| `cs` | taille d'une case en pixels |
| `order` | ordre des directions (lignes) |
| `idle`, `walk`, `atk` | colonnes de la pose de repos, de la course, de l'attaque |
| `atkDirs` | directions qui ont une attaque ; ailleurs, la voisine à 45° ou la pose de repos |
| `foot` | ligne des pieds dans la case (pixels depuis le haut) |
| `h` | hauteur du personnage dessiné dans la case |
| `wh` | hauteur voulue à l'écran, en pixels du monde (une tuile = 32) |
| `stride` | distance parcourue pendant un cycle de course (pixels du monde) : plus grand = pas plus lents |
| `mirror` | `true` si la planche n'a qu'un côté : la gauche est dessinée en miroir de la droite |
| `weapon`, `tint` | arme du pack par-dessus et recoloration selon la rareté (désactivées pour les planches qui ont leur arme) |
