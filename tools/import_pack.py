#!/usr/bin/env python3
"""Copie dans assets/pack/ les images du pack « Ninja Adventure » (pixel-boy, licence CC0) utilisées par le jeu.

Usage : python3 tools/import_pack.py "<dossier Ninja Adventure - Asset Pack>"
Les fichiers copiés sont ensuite intégrés en base64 par tools/build.py (marqueur @@PACK@@).
"""
import os
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEST = os.path.join(ROOT, 'assets', 'pack')

# Personnages : planches 64×112 (colonnes = bas, haut, gauche, droite ; lignes 0-3 marche, 4 attaque)
CHARS = [
    # héros (armure de base 0, 1, 2 par classe)
    'Knight', 'GladiatorBlue', 'KnightGold',            # guerrier
    'SorcererBlack', 'NinjaMageOrange', 'NinjaMageBlack',  # mage
    'NinjaDark', 'NinjaGray', 'Hunter',                 # voleur
    'Monk2', 'Master', 'Monk',                          # soigneur
    # ennemis
    'Skeleton', 'Vampire', 'Tengu', 'GreenPig', 'RobotGrey',
    # habitants et personnages
    'Villager', 'Villager2', 'Villager3', 'Villager4', 'Villager5', 'Woman', 'OldWoman',
    'OldMan', 'OldMan2', 'OldMan3', 'Child', 'Boy', 'Noble', 'Princess', 'Sultan', 'DemonRed', 'Inspector',
]
WEAPONS = ['Sword', 'Axe', 'Hammer', 'Stick', 'Book', 'Sai', 'Ninjaku', 'Katana', 'Club', 'MagicWand']
TILES = ['TilesetFloor', 'TilesetHouse', 'TilesetNature', 'TilesetFloorDetail', 'TilesetWater', 'TilesetDungeon']


def main(pack):
    os.makedirs(DEST, exist_ok=True)
    def cp(src, name):
        shutil.copyfile(os.path.join(pack, src), os.path.join(DEST, name))
    for c in CHARS:
        cp(os.path.join('Actor', 'Character', c, 'SpriteSheet.png'), 'c_' + c + '.png')
    for w in WEAPONS:
        cp(os.path.join('Items', 'Weapons', w, 'Sprite.png'), 'w_' + w + '.png')
    for t in TILES:
        cp(os.path.join('Backgrounds', 'Tilesets', t + '.png'), 't_' + t + '.png')
    cp(os.path.join('Backgrounds', 'Tilesets', 'Interior', 'TilesetInteriorFloor.png'), 't_InteriorFloor.png')
    for col in ('Red', 'Blue', 'Yellow'):
        cp(os.path.join('Backgrounds', 'Animated', 'Flag', 'Flag%s16x16.png' % col), 'f_Flag' + col + '.png')
    shutil.copyfile(os.path.join(pack, 'LICENSE.txt'), os.path.join(DEST, 'LICENSE-NinjaAdventure.txt'))
    print(len(os.listdir(DEST)), 'fichiers dans', DEST)


if __name__ == '__main__':
    main(sys.argv[1])
