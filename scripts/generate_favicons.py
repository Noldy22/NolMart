import os
import shutil
import base64
from PIL import Image
import numpy as np

def generate_favicons():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    logo_path = os.path.join(base_dir, 'img', 'nolmart-logo.png')
    fav_dir = os.path.join(base_dir, 'img', 'favicons')
    os.makedirs(fav_dir, exist_ok=True)

    # Load original full logo (cart + the word NolMart)
    logo = Image.open(logo_path)
    lw, lh = logo.size
    print(f'Source logo size: {lw}x{lh}')

    # Helper: create mobile app icon (solid white background, sized to fit safe zone so it's never cut out)
    def create_app_icon(size, target_width):
        scale = target_width / lw
        th = max(1, int(lh * scale))
        resized = logo.resize((target_width, th), Image.Resampling.LANCZOS)

        canvas = Image.new('RGBA', (size, size), (255, 255, 255, 255))
        offset = ((size - target_width) // 2, (size - th) // 2)
        canvas.paste(resized, offset, resized)
        return canvas

    # Helper: create browser favicon (transparent background, optional alpha boost for small sizes)
    def create_tab_favicon(size, target_width, alpha_gamma=1.0):
        scale = target_width / lw
        th = max(1, int(lh * scale))
        resized = logo.resize((target_width, th), Image.Resampling.LANCZOS)

        canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        offset = ((size - target_width) // 2, (size - th) // 2)
        canvas.paste(resized, offset, resized)

        if alpha_gamma != 1.0:
            c_arr = np.array(canvas)
            a = c_arr[:, :, 3].astype(float)
            a_boost = np.clip(255 * ((a / 255.0) ** alpha_gamma), 0, 255).astype(np.uint8)
            c_arr[:, :, 3] = a_boost
            canvas = Image.fromarray(c_arr)

        return canvas

    # 1. Mobile app icons (Android PWA & iOS)
    # Inside 512x512, Android's circular mask has diameter 409.6px (radius 204.8px).
    # Width 396px with height 81px gives diagonal radius sqrt(198^2 + 40.5^2) = 202px < 204.8px,
    # ensuring the full logo is completely inside the circle and never cut off by any Android mask!
    print('Generating mobile app icons with full logo...')
    icon_512 = create_app_icon(512, target_width=396)
    icon_512.save(os.path.join(fav_dir, 'icon-512.png'), 'PNG', optimize=True)

    icon_192 = create_app_icon(192, target_width=148)
    icon_192.save(os.path.join(fav_dir, 'icon-192.png'), 'PNG', optimize=True)

    apple_icon = create_app_icon(180, target_width=156)
    apple_icon.save(os.path.join(fav_dir, 'apple-touch-icon.png'), 'PNG', optimize=True)

    # 2. Browser favicons with full logo
    print('Generating browser favicons with full logo...')
    fav_96 = create_tab_favicon(96, target_width=90)
    fav_96.save(os.path.join(fav_dir, 'favicon-96x96.png'), 'PNG', optimize=True)

    fav_64 = create_tab_favicon(64, target_width=60)
    fav_64.save(os.path.join(fav_dir, 'favicon-64x64.png'), 'PNG', optimize=True)

    fav_48 = create_tab_favicon(48, target_width=45, alpha_gamma=0.85)
    fav_48.save(os.path.join(fav_dir, 'favicon-48x48.png'), 'PNG', optimize=True)

    fav_32 = create_tab_favicon(32, target_width=30, alpha_gamma=0.65)
    fav_32.save(os.path.join(fav_dir, 'favicon-32x32.png'), 'PNG', optimize=True)

    fav_16 = create_tab_favicon(16, target_width=15, alpha_gamma=0.55)
    fav_16.save(os.path.join(fav_dir, 'favicon-16x16.png'), 'PNG', optimize=True)

    # 3. Multi-resolution favicon.ico
    print('Generating favicon.ico...')
    fav_16.save(
        os.path.join(fav_dir, 'favicon.ico'),
        format='ICO',
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64)],
        append_images=[fav_32, fav_48, fav_64]
    )

    # 4. Scalable SVG favicon
    print('Generating favicon.svg...')
    with open(logo_path, 'rb') as f:
        full_b64 = base64.b64encode(f.read()).decode('utf-8')
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <!-- NolMart Full Logo Favicon -->
  <image x="16" y="202" width="480" height="108" href="data:image/png;base64,{full_b64}"/>
</svg>
'''
    with open(os.path.join(fav_dir, 'favicon.svg'), 'w', encoding='utf-8') as f:
        f.write(svg_content)

    # 5. Copy fallback files to root directory
    print('Copying root fallback files...')
    root_copies = [
        'icon-512.png',
        'icon-192.png',
        'apple-touch-icon.png',
        'favicon-32x32.png',
        'favicon-16x16.png',
        'favicon.ico',
        'favicon.svg',
    ]
    for filename in root_copies:
        src = os.path.join(fav_dir, filename)
        dst = os.path.join(base_dir, filename)
        shutil.copy2(src, dst)

    print('All favicon and app icon assets with full logo successfully generated!')

if __name__ == '__main__':
    generate_favicons()
