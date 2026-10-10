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
    '05_log.js', '10_data.js', '11_store.js', '12_sound.js', '13_sprites.js', '15_music.js', '20_lore.js',
    '21_bosses.js', '22_story.js', '23_humour.js', '26_maprend.js',
    '30_world.js', '31_towns.js', '35_dungeons.js', '40_game.js', '45_quests.js', '50_net.js',
    '60_render.js', '61_draw.js', '61_portrait.js', '61_storyui.js', '62_art.js',
    '63_fx.js', '64_worldart.js', '64_sky.js', '64_vitrine.js', '65_cine.js', '66_scene.js', '67_splash.js', '68_menu.js', '69_pwa.js', '70_ui.js',
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


def pack():
    """Images du pack Ninja Adventure (CC0) copiées par tools/import_pack.py -> {nom: data-URI}."""
    d = os.path.join(ROOT, 'assets', 'pack')
    if not os.path.isdir(d):
        return {}
    return {f[:-4]: b64(os.path.join('assets', 'pack', f), 'image/png') for f in sorted(os.listdir(d)) if f.endswith('.png')}


def build(target):
    clips, times, lines = voices()
    world = json.load(open(os.path.join(ROOT, 'data', 'world.json')))
    parts = []
    for m in MODULES:
        js = read('src', m)
        if m == '13_sprites.js':
            js = js.replace('@@PACK@@', json.dumps(pack()))
        if m == '20_lore.js':
            js = js.replace('@@WORLD@@', json.dumps(world, separators=(',', ':')))
        if m == '65_cine.js':
            js = (js.replace('@@CLIPS@@', json.dumps(clips))
                    .replace('@@CINETIMES@@', json.dumps(times))
                    .replace('@@LINES@@', json.dumps(lines, ensure_ascii=False)))
        parts.append('/* ---- %s ---- */\n%s' % (m, js.rstrip()))
    js = '\n'.join(parts)
    import hashlib
    js = js.replace('@@BUILD@@', hashlib.sha256(js.encode()).hexdigest()[:8])
    assert '@@' not in js.replace("'@@'", ''), 'un marqueur @@ n’a pas été remplacé'
    page = read('src', 'page.html').replace('@@MAP@@', b64(os.path.join('assets', 'map.jpg'), 'image/jpeg'))
    icon = read('assets', 'icons', 'icon.svg').replace(' role="img" aria-label="Les Pierres de Midheim"', ' focusable="false"')
    page = page.replace('@@ICON@@', icon)
    assert '@@' not in page, 'un marqueur @@ de la page n’a pas été remplacé'
    script = '<script>\n"use strict";\n' + js + '\n</script>\n'
    if target == 'web':
        # page complète : en-tête (titre, polices, styles) puis le corps du jeu
        k = page.index('</style>') + len('</style>')
        html = ('<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n'
                '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">\n'
                '<meta http-equiv="Content-Security-Policy" content="%s">\n<meta name="referrer" content="no-referrer">\n'
                '<meta name="description" content="Jeu d’aventure coopératif à deux dans le monde de Midheim.">\n'
                '<meta name="theme-color" content="#13252c">\n'
                '<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="mobile-web-app-capable" content="yes">\n'
                '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n'
                '<meta name="apple-mobile-web-app-title" content="Midheim">\n'
                '<link rel="manifest" href="manifest.webmanifest">\n'
                '<link rel="icon" href="icons/icon.svg" type="image/svg+xml">\n'
                '<link rel="icon" href="icons/icon-192.png" type="image/png" sizes="192x192">\n'
                '<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">\n'
                '%s\n</head>\n<body>\n%s\n%s</body>\n</html>\n') % (CSP, page[:k], page[k:], script)
        out_dir, name = os.path.join(ROOT, 'docs'), 'index.html'
    else:
        html = page + '\n' + script
        out_dir, name = os.path.join(ROOT, 'dist'), 'midheim.html'
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, name), 'w') as f:
        f.write(html)
    if target == 'web':
        pwa(out_dir, html)
    os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
    with open(os.path.join(ROOT, 'dist', 'bundle.js'), 'w') as f:  # pour node --check
        f.write('"use strict";\n' + js)
    print('ok', target, os.path.join(out_dir, name), len(html))


ICONS = ['icon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png']
MANIFEST = {
    'id': './', 'name': 'Les Pierres de Midheim', 'short_name': 'Midheim',
    'description': 'Jeu d’aventure coopératif à deux dans le monde de Midheim.',
    'lang': 'fr', 'dir': 'ltr', 'start_url': './', 'scope': './', 'display': 'fullscreen',
    'orientation': 'any', 'background_color': '#13252c', 'theme_color': '#13252c', 'categories': ['games'],
    'icons': [
        {'src': 'icons/icon.svg', 'sizes': 'any', 'type': 'image/svg+xml', 'purpose': 'any'},
        {'src': 'icons/icon-192.png', 'sizes': '192x192', 'type': 'image/png', 'purpose': 'any'},
        {'src': 'icons/icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any'},
        {'src': 'icons/icon-maskable-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'},
    ],
}


def pwa(out_dir, html):
    """Appli installable : manifeste, icônes et service worker. La version du service worker
    est l'empreinte de la page : chaque build différent déclenche le bandeau de mise à jour."""
    import hashlib
    import shutil
    os.makedirs(os.path.join(out_dir, 'icons'), exist_ok=True)
    for n in ICONS:
        shutil.copyfile(os.path.join(ROOT, 'assets', 'icons', n), os.path.join(out_dir, 'icons', n))
    with open(os.path.join(out_dir, 'manifest.webmanifest'), 'w') as f:
        json.dump(MANIFEST, f, ensure_ascii=False, indent=2)
    version = 'midheim-' + hashlib.sha256(html.encode()).hexdigest()[:12]
    sw = read('tools', 'sw.js').replace('@@VERSION@@', version).replace('@@ICONS@@', json.dumps(['icons/' + n for n in ICONS]))
    with open(os.path.join(out_dir, 'sw.js'), 'w') as f:
        f.write(sw)
    print('pwa', version)

if __name__ == '__main__':
    build(sys.argv[1] if len(sys.argv) > 1 else 'web')
