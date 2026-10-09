#!/usr/bin/env python3
"""Assemble « Les Pierres de Midheim » en un seul fichier HTML autonome.

Usage :
    python3 tools/build.py            # site web  -> docs/index.html (GitHub Pages)
    python3 tools/build.py artifact   # version claude.ai -> dist/midheim.html

Les modules de src/ sont concaténés dans l'ordre de MODULES ; la carte, le monde
et les voix sont intégrés en base64 pour que le jeu fonctionne hors ligne.
"""
import base64
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src')
VOICE = os.path.join(ROOT, 'assets', 'voice')

MODULES = [
    '10_data.js', '11_store.js', '12_sound.js', '15_music.js', '20_lore.js',
    '21_bosses.js', '22_story.js', '23_humour.js', '26_maprend.js',
    '30_world.js', '35_dungeons.js', '40_game.js', '45_quests.js', '50_net.js',
    '60_render.js', '61_draw.js', '61_portrait.js', '61_storyui.js', '62_art.js',
    '63_fx.js', '64_worldart.js', '65_cine.js', '66_scene.js', '68_menu.js', '70_ui.js',
]

# Politique de sécurité du site public : tout est dans la page, sauf les polices et la base Firebase.
CSP = ("default-src 'self'; script-src 'self' 'unsafe-inline' https://www.gstatic.com https://*.firebasedatabase.app https://*.firebaseio.com; "
       "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; "
       "img-src 'self' data: blob:; media-src 'self' data: blob:; "
       "connect-src 'self' https://*.firebasedatabase.app wss://*.firebasedatabase.app "
       "https://*.firebaseio.com wss://*.firebaseio.com https://*.googleapis.com; "
       "object-src 'none'; base-uri 'none'; form-action 'none'")


def read(*p, mode='r'):
    with open(os.path.join(ROOT, *p), mode) as f:
        return f.read()


def b64(path, mime):
    return 'data:%s;base64,%s' % (mime, base64.b64encode(read(path, mode='rb')).decode())


def voices():
    """Clips enregistrés (assets/voice/*.mp3) + table texte -> clip pour les répliques."""
    clips, times, lines = {}, None, {}
    if not os.path.isdir(VOICE):
        return clips, [0], lines
    for f in sorted(os.listdir(VOICE)):
        if f.endswith('.mp3'):
            clips[f[:-4]] = b64(os.path.join(VOICE, f), 'audio/mpeg')
    tf = os.path.join(VOICE, 'intro_times.json')
    if os.path.exists(tf):
        times = json.load(open(tf))
    if 'intro' in clips and not times:
        clips.pop('intro')
    mf = os.path.join(VOICE, 'manifest.json')
    if os.path.exists(mf):
        for j in json.load(open(mf)):
            if j['key'][:2] in ('d_', 'g_') and j['key'] in clips:
                lines[j['text']] = j['key']
    return clips, times or [0], lines


def build(target):
    clips, times, lines = voices()
    world = json.load(open(os.path.join(ROOT, 'data', 'world.json')))
    parts = []
    for m in MODULES:
        js = read('src', m)
        if m == '20_lore.js':
            js = js.replace('@@WORLD@@', json.dumps(world, separators=(',', ':')))
        if m == '65_cine.js':
            js = (js.replace('@@CLIPS@@', json.dumps(clips))
                    .replace('@@CINETIMES@@', json.dumps(times))
                    .replace('@@LINES@@', json.dumps(lines, ensure_ascii=False)))
        parts.append('/* ---- %s ---- */\n%s' % (m, js.rstrip()))
    js = '\n'.join(parts)
    assert '@@' not in js.replace("'@@'", ''), 'un marqueur @@ n’a pas été remplacé'
    page = read('src', 'page.html').replace('@@MAP@@', b64(os.path.join('assets', 'map.jpg'), 'image/jpeg'))
    script = '<script>\n"use strict";\n' + js + '\n</script>\n'
    if target == 'web':
        # page complète : en-tête (titre, polices, styles) puis le corps du jeu
        k = page.index('</style>') + len('</style>')
        html = ('<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n'
                '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">\n'
                '<meta http-equiv="Content-Security-Policy" content="%s">\n<meta name="referrer" content="no-referrer">\n'
                '<meta name="description" content="Jeu d’aventure coopératif à deux dans le monde de Midheim.">\n'
                '%s\n</head>\n<body>\n%s\n%s</body>\n</html>\n') % (CSP, page[:k], page[k:], script)
        out_dir, name = os.path.join(ROOT, 'docs'), 'index.html'
    else:
        html = page + '\n' + script
        out_dir, name = os.path.join(ROOT, 'dist'), 'midheim.html'
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, name), 'w') as f:
        f.write(html)
    os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
    with open(os.path.join(ROOT, 'dist', 'bundle.js'), 'w') as f:  # pour node --check
        f.write('"use strict";\n' + js)
    print('ok', target, os.path.join(out_dir, name), len(html))


if __name__ == '__main__':
    build(sys.argv[1] if len(sys.argv) > 1 else 'web')
