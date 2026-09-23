import os
from PIL import Image

def update_icons():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src_logo = os.path.join(root, "public", "app_logo.png")
    
    if not os.path.exists(src_logo):
        print(f"Error: Master logo not found at {src_logo}")
        return
    
    img = Image.open(src_logo).convert("RGBA")
    print(f"Loaded master icon: {src_logo} ({img.size[0]}x{img.size[1]})")

    # 1. Update public/logo.png
    public_logo = os.path.join(root, "public", "logo.png")
    img.resize((1024, 1024), Image.Resampling.LANCZOS).save(public_logo, "PNG")
    print(f"Updated {public_logo}")

    # 2. Update public/icon-512.png
    icon_512 = os.path.join(root, "public", "icon-512.png")
    img.resize((512, 512), Image.Resampling.LANCZOS).save(icon_512, "PNG")
    print(f"Updated {icon_512}")

    # 3. Update public/icon-192.png
    icon_192 = os.path.join(root, "public", "icon-192.png")
    img.resize((192, 192), Image.Resampling.LANCZOS).save(icon_192, "PNG")
    print(f"Updated {icon_192}")

    # 4. Update public/favicon.png
    fav_png = os.path.join(root, "public", "favicon.png")
    img.resize((128, 128), Image.Resampling.LANCZOS).save(fav_png, "PNG")
    print(f"Updated {fav_png}")

    # 5. Update ICO files (root/app_icon.ico and public/favicon.ico)
    ico_sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    public_ico = os.path.join(root, "public", "favicon.ico")
    root_ico = os.path.join(root, "app_icon.ico")
    img.save(public_ico, format="ICO", sizes=ico_sizes)
    img.save(root_ico, format="ICO", sizes=ico_sizes)
    print(f"Updated {public_ico} and {root_ico}")

    # 6. Update Flutter Android mipmap launcher icons
    flutter_res = os.path.join(root, "flutter_app", "android", "app", "src", "main", "res")
    native_res = os.path.join(root, "android", "app", "src", "main", "res")
    
    mipmap_targets = {
        "mipmap-mdpi": (48, 48),
        "mipmap-hdpi": (72, 72),
        "mipmap-xhdpi": (96, 96),
        "mipmap-xxhdpi": (144, 144),
        "mipmap-xxxhdpi": (192, 192),
    }

    for res_dir in [flutter_res, native_res]:
        if not os.path.exists(res_dir):
            continue
        for folder, size in mipmap_targets.items():
            folder_path = os.path.join(res_dir, folder)
            os.makedirs(folder_path, exist_ok=True)
            out_file = os.path.join(folder_path, "ic_launcher.png")
            img.resize(size, Image.Resampling.LANCZOS).save(out_file, "PNG")
            print(f"Updated {out_file} ({size[0]}x{size[1]})")

    # 7. Update Flutter Web icons
    flutter_web = os.path.join(root, "flutter_app", "web")
    if os.path.exists(flutter_web):
        fl_fav = os.path.join(flutter_web, "favicon.png")
        img.resize((128, 128), Image.Resampling.LANCZOS).save(fl_fav, "PNG")
        
        fl_icons_dir = os.path.join(flutter_web, "icons")
        if os.path.exists(fl_icons_dir):
            img.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(fl_icons_dir, "Icon-192.png"), "PNG")
            img.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(fl_icons_dir, "Icon-512.png"), "PNG")
            img.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(fl_icons_dir, "Icon-maskable-192.png"), "PNG")
            img.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(fl_icons_dir, "Icon-maskable-512.png"), "PNG")
            print(f"Updated Flutter web icons in {fl_icons_dir}")

    print("\nAll application logos and launcher icons successfully updated!")

if __name__ == "__main__":
    update_icons()
