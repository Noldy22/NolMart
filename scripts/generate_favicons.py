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

    # 1. Load original logo
    logo = Image.open(logo_path)
    # The emblem is on the left (x: 0 to 317)
    cart = logo.crop((0, 0, 317, 317))

    # Trim transparent borders
    arr = np.array(cart)
    alpha = arr[:, :, 3]
    coords = np.argwhere(alpha > 10)
    y0, x0 = coords.min(axis=0)
    y1, x1 = coords.max(axis=0)
    cart_trimmed = cart.crop((x0, y0, x1 + 1, y1 + 1))
    cw, ch = cart_trimmed.size
    print(f'Cropped emblem size: {cw}x{ch}')

    # Helper: app icon (white background, safe zone padding)
    def create_app_icon(size, padding_ratio=0.12):
        target_inner = int(size * (1 - 2 * padding_ratio))
        scale = target_inner / max(cw, ch)
        new_w, new_h = int(cw * scale), int(ch * scale)
        resized = cart_trimmed.resize((new_w, new_h), Image.Resampling.LANCZOS)

        canvas = Image.new('RGBA', (size, size), (255, 255, 255, 255))
        offset = ((size - new_w) // 2, (size - new_h) // 2)
        canvas.paste(resized, offset, resized)
        return canvas

    # Helper: tab favicon (transparent background)
    def create_tab_favicon(size, padding_ratio=0.04, alpha_gamma=1.0):
        target_inner = max(1, int(size * (1 - 2 * padding_ratio)))
        scale = target_inner / max(cw, ch)
        new_w, new_h = max(1, int(cw * scale)), max(1, int(ch * scale))
        resized = cart_trimmed.resize((new_w, new_h), Image.Resampling.LANCZOS)

        canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        offset = ((size - new_w) // 2, (size - new_h) // 2)
        canvas.paste(resized, offset, resized)

        if alpha_gamma != 1.0:
            c_arr = np.array(canvas)
            a = c_arr[:, :, 3].astype(float)
            a_boost = np.clip(255 * ((a / 255.0) ** alpha_gamma), 0, 255).astype(np.uint8)
            c_arr[:, :, 3] = a_boost
            canvas = Image.fromarray(c_arr)

        return canvas

    # 2. Generate mobile app icons (PWA & iOS)
    print('Generating mobile app icons...')
    icon_512 = create_app_icon(512, padding_ratio=0.12)
    icon_512.save(os.path.join(fav_dir, 'icon-512.png'), 'PNG', optimize=True)

    icon_192 = create_app_icon(192, padding_ratio=0.12)
    icon_192.save(os.path.join(fav_dir, 'icon-192.png'), 'PNG', optimize=True)

    apple_icon = create_app_icon(180, padding_ratio=0.12)
    apple_icon.save(os.path.join(fav_dir, 'apple-touch-icon.png'), 'PNG', optimize=True)

    # 3. Generate browser favicons
    print('Generating browser favicons...')
    fav_96 = create_tab_favicon(96, padding_ratio=0.04)
    fav_96.save(os.path.join(fav_dir, 'favicon-96x96.png'), 'PNG', optimize=True)

    fav_64 = create_tab_favicon(64, padding_ratio=0.04)
    fav_64.save(os.path.join(fav_dir, 'favicon-64x64.png'), 'PNG', optimize=True)

    fav_48 = create_tab_favicon(48, padding_ratio=0.03)
    fav_48.save(os.path.join(fav_dir, 'favicon-48x48.png'), 'PNG', optimize=True)

    fav_32 = create_tab_favicon(32, padding_ratio=0.02, alpha_gamma=0.7)
    fav_32.save(os.path.join(fav_dir, 'favicon-32x32.png'), 'PNG', optimize=True)

    fav_16 = create_tab_favicon(16, padding_ratio=0.01, alpha_gamma=0.55)
    fav_16.save(os.path.join(fav_dir, 'favicon-16x16.png'), 'PNG', optimize=True)

    # 4. Generate multi-resolution favicon.ico
    print('Generating favicon.ico...')
    fav_16.save(
        os.path.join(fav_dir, 'favicon.ico'),
        format='ICO',
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64)],
        append_images=[fav_32, fav_48, fav_64]
    )

    # 5. Generate favicon.svg
    print('Generating favicon.svg...')
    with open(os.path.join(fav_dir, 'favicon-96x96.png'), 'rb') as f:
        png_b64 = base64.b64encode(f.read()).decode('utf-8')
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">
  <image width="96" height="96" href="data:image/png;base64,{png_b64}"/>
</svg>
'''
    with open(os.path.join(fav_dir, 'favicon.svg'), 'w', encoding='utf-8') as f:
        f.write(svg_content)

    # 6. Copy key files to root directory for root crawler / browser fallback
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

    print('All favicon and app icon assets successfully generated!')

if __name__ == '__main__':
    generate_favicons()
