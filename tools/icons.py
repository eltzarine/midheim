#!/usr/bin/env python3
"""Logo « C » (monogramme M + quatre pierres) -> icônes de l'app dans assets/icons/.

Le M vient de la police Uncial Antiqua (contour figé dans assets/icons/M.path, unités
de la police, 2048/em) : les icônes ne dépendent d'aucune police au chargement.
    python3 tools/icons.py          # écrit les SVG, puis les PNG si Playwright est là
"""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'icons')
M = open(os.path.join(OUT, 'M.path')).read().strip()
M_X0, M_X1, M_H = 102, 2519, 1470          # boîte du glyphe
STONES = ['#cfe2ff', '#ff7a3a', '#f0c95a', '#b98cff']
SEA, SEA2, BRONZE, PARCH = '#13252c', '#1d3640', '#b98544', '#efe6cf'


def mark(k=1.0):
    """Le monogramme seul, centré sur 512x512, réduit d'un facteur k (zone sûre)."""
    s = 0.1407
    w = (M_X1 - M_X0) * s
    top = 112
    m = ('<path fill="%s" transform="translate(%.2f %.2f) scale(%.4f -%.4f)" d="%s"/>'
         % (PARCH, 256 - w / 2 - M_X0 * s, top + M_H * s, s, s, M))
    gems = ''.join('<rect x="%g" y="%g" width="40" height="40" transform="rotate(45 %g %g)" fill="%s"/>'
                   % (cx - 20, 382, cx, 402, c) for cx, c in zip((151, 221, 291, 361), STONES))
    return '<g transform="translate(256 256) scale(%g) translate(-256 -256)">%s%s</g>' % (k, m, gems)


def svg(kind):
    if kind == 'any':        # carré arrondi bordé de bronze, coins transparents
        bg = '<rect x="10" y="10" width="492" height="492" rx="112" fill="%s" stroke="%s" stroke-width="16"/>' % (SEA2, BRONZE)
        body = mark(1)
    elif kind == 'maskable':  # plein cadre, contenu dans la zone sûre (80 %)
        bg = ('<rect width="512" height="512" fill="%s"/><rect x="58" y="58" width="396" height="396" rx="84" fill="none" stroke="%s" stroke-width="12"/>'
              % (SEA2, BRONZE))
        body = mark(.74)
    else:                     # apple : plein cadre, iOS arrondit lui-même
        bg = ('<rect width="512" height="512" fill="%s"/><rect x="26" y="26" width="460" height="460" rx="96" fill="none" stroke="%s" stroke-width="14"/>'
              % (SEA2, BRONZE))
        body = mark(.9)
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Les Pierres de Midheim">%s%s</svg>'
            % (bg, body))


def main():
    files = {'icon.svg': svg('any'), 'icon-maskable.svg': svg('maskable'), 'icon-apple.svg': svg('apple')}
    for n, t in files.items():
        open(os.path.join(OUT, n), 'w').write(t)
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print('Playwright absent : PNG non régénérés'); return
    sizes = [('icon.svg', 'icon-192.png', 192), ('icon.svg', 'icon-512.png', 512),
             ('icon-maskable.svg', 'icon-maskable-512.png', 512), ('icon-apple.svg', 'apple-touch-icon.png', 180)]
    with sync_playwright() as pw:
        br = pw.chromium.launch()
        for src, dst, px in sizes:
            p = br.new_page(viewport={'width': px, 'height': px})
            p.set_content('<html><body style="margin:0;background:transparent">%s</body></html>'
                          % files[src].replace('<svg ', '<svg width="%d" height="%d" ' % (px, px), 1))
            p.screenshot(path=os.path.join(OUT, dst), omit_background=True)
            p.close()
        br.close()
    print('icônes ok')


if __name__ == '__main__':
    main()
