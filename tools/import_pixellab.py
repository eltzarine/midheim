#!/usr/bin/env python3
"""Assemble des exports PixelLab (8 directions) en une planche haute définition pour le jeu.

Usage :
    python3 tools/import_pixellab.py <classe> <dossier_debout> [<dossier_combat>]

  <dossier_debout> : export avec rotations/ (pose de repos) et animations/<course>/ (8 directions)
  <dossier_combat> : export facultatif dont animations/<attaque>/ fournit l'attaque (une ou plusieurs directions)

Écrit assets/hd/<classe>.png et assets/hd/<classe>.json. Toutes les images sont centrées dans des cases
de taille fixe (PixelLab agrandit la toile des animations en gardant le personnage au centre).
Lignes = directions S, SE, E, NE, N, NW, W, SW ; colonnes = repos, course, attaque.
"""
import json
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIRS = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west']
CODES = ['S', 'SE', 'E', 'NE', 'N', 'NW', 'W', 'SW']


def frames(d):
    return sorted(f for f in os.listdir(d) if f.endswith('.png'))


def first_anim(root, prefer):
    a = os.path.join(root, 'animations')
    if not os.path.isdir(a):
        return None
    names = sorted(os.listdir(a))
    for n in names:
        if any(p in n.lower() for p in prefer):
            return os.path.join(a, n)
    return os.path.join(a, names[0]) if names else None


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    cls, stand = sys.argv[1], sys.argv[2]
    combat = sys.argv[3] if len(sys.argv) > 3 else None
    run = first_anim(stand, ('run', 'walk', 'course', 'marche'))
    atk = first_anim(combat, ('attack', 'attaque', 'sword', 'slash')) if combat else None
    imgs = []
    for d in DIRS:
        imgs.append(Image.open(os.path.join(stand, 'rotations', d + '.png')))
        if run:
            imgs += [Image.open(os.path.join(run, d, f)) for f in frames(os.path.join(run, d))]
        if atk and os.path.isdir(os.path.join(atk, d)):
            imgs += [Image.open(os.path.join(atk, d, f)) for f in frames(os.path.join(atk, d))]
    cs = max(max(i.size) for i in imgs)
    cs += cs % 2
    nrun = len(frames(os.path.join(run, 'south'))) if run else 0
    atk_dirs = [c for d, c in zip(DIRS, CODES) if atk and os.path.isdir(os.path.join(atk, d))]
    natk = max((len(frames(os.path.join(atk, d))) for d in DIRS if atk and os.path.isdir(os.path.join(atk, d))), default=0)
    cols = 1 + nrun + natk
    sheet = Image.new('RGBA', (cs * cols, cs * 8), (0, 0, 0, 0))

    def put(im, c, r):
        im = im.convert('RGBA')
        w, h = im.size
        sheet.alpha_composite(im, (c * cs + (cs - w) // 2, r * cs + (cs - h) // 2))

    feet, tops = [], []
    for r, d in enumerate(DIRS):
        rot = Image.open(os.path.join(stand, 'rotations', d + '.png'))
        put(rot, 0, r)
        b = rot.convert('RGBA').getbbox()
        off = (cs - rot.size[1]) // 2
        feet.append(b[3] + off)
        tops.append(b[1] + off)
        for i, f in enumerate(frames(os.path.join(run, d)) if run else []):
            put(Image.open(os.path.join(run, d, f)), 1 + i, r)
        if atk and os.path.isdir(os.path.join(atk, d)):
            for i, f in enumerate(frames(os.path.join(atk, d))):
                put(Image.open(os.path.join(atk, d, f)), 1 + nrun + i, r)
    foot = max(feet)
    meta = {
        'cs': cs, 'dirs': 8, 'axis': 'row', 'order': CODES,
        'idle': [0], 'walk': list(range(1, 1 + nrun)) or [0], 'atk': list(range(1 + nrun, 1 + nrun + natk)) or [0],
        'atkDirs': atk_dirs, 'foot': foot, 'h': foot - min(tops), 'wh': 48, 'stride': 64,
        'weapon': False, 'tint': False,
    }
    out = os.path.join(ROOT, 'assets', 'hd')
    os.makedirs(out, exist_ok=True)
    sheet.save(os.path.join(out, cls + '.png'), optimize=True)
    old = os.path.join(out, cls + '.json')
    if os.path.exists(old):   # garde les réglages faits à la main (taille à l'écran, foulée…)
        keep = json.load(open(old))
        for k in ('wh', 'stride', 'weapon', 'tint', 'idleFps', 'smooth', 'head'):
            if k in keep:
                meta[k] = keep[k]
    json.dump(meta, open(old, 'w'), indent=1)
    print('ok', cls, '%dx%d' % sheet.size, 'case', cs, 'course', nrun, 'attaque', natk, atk_dirs)


if __name__ == '__main__':
    main()
