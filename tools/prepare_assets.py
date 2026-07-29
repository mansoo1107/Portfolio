# -*- coding: utf-8 -*-
"""素材处理（可重跑）：
1. 从 cats.png 提取 Mae 各个姿态：自动分行分列、去白底（边缘洪水填充 +
   保守的腿部白缝清理 + 边缘羽化）→ assets/mae/*.png，并生成 tools/_contact.png 核对图。
   注意：只清理腿部附近的细小封闭白块；脸、背心、外套的白色一律保留。
2. 生成派生图 → assets/derived/：
   - p55.jpg  排版55 转正
   - p57.jpg  排版57 涂掉右上角官方 Mae
   - p42.jpg  排版42 涂掉左上角官方 Mae
   - p46.jpg  排版46 打码：小组成员/指导老师头像与姓名 + 底部学校专业横幅
   - p48.jpg  排版48 打码：顶部“城乡规划专业”横幅文字
   - p49.jpg  排版49 打码：顶部“城乡规划专业”横幅文字
3. 生成网页优化图 → assets/web/（最长边 1600、q80）
"""
from PIL import Image, ImageFilter
import numpy as np
from collections import deque
import os
import shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "cats.png")
P_DIR = os.path.join(ROOT, "Portfoliofile")
MAE_OUT = os.path.join(ROOT, "assets", "mae")
DER_OUT = os.path.join(ROOT, "assets", "derived")
WEB_OUT = os.path.join(ROOT, "assets", "web")
for d in (MAE_OUT, DER_OUT, WEB_OUT):
    os.makedirs(d, exist_ok=True)

INK = 235
X_MIN = 160
MERGE_Y = 16
MERGE_X = 8
MAX_BAND_H = 280
ROW_NAMES = ["crouch", "walk", "jump", "face", "act"]
LEG_ROWS = {"crouch", "walk", "jump"}  # 只有这几行做腿部白缝清理

MOSAICS = {
    "排版46.jpg": [
        (490, 865, 1170, 1160, 16),
        (1545, 1995, 2790, 2095, 14),
    ],
    "排版48.jpg": [(50, 165, 680, 235, 14)],
    "排版49.jpg": [(35, 170, 650, 230, 14)],
}

ORIGINALS = [8, 12, 15, 19, 21, 24, 25, 29, 30, 32, 37, 38, 39, 43, 50, 52, 54, 56]
DERIVED = [42, 46, 48, 49, 55, 57]


# ---------------- Mae 姿态提取 ----------------

def remove_bg(im, leg_clean=False):
    """去白底：边缘洪水填充 + 边缘羽化。
    leg_clean=True 时，额外清理腿部附近（重心在图片下 40% 且面积 < 3.5%）的
    封闭白块（腿缝），脸/背心/外套的白色不受影响。全图另有极保守的杂点清理。"""
    im = im.convert("RGB")
    a = np.asarray(im)
    h, w, _ = a.shape
    border = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
    level = int(np.median(border)) - 18
    near_white = np.all(a > level, axis=2)

    # 1) 边缘洪水填充
    seen = np.zeros((h, w), bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if near_white[y, x] and not seen[y, x]:
                seen[y, x] = True
                q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if near_white[y, x] and not seen[y, x]:
                seen[y, x] = True
                q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and near_white[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True
                q.append((ny, nx))
    alpha = np.where(seen, 0, 255).astype(np.uint8)

    # 2) 封闭白区：全局只去杂点（<0.4%）；leg_clean 时再清腿部白缝（<3.5% 且在下 40%）
    inner = near_white & ~seen
    visited = np.zeros((h, w), bool)
    for yy in range(h):
        for xx in range(w):
            if inner[yy, xx] and not visited[yy, xx]:
                region = []
                qq = deque([(yy, xx)])
                visited[yy, xx] = True
                while qq:
                    cy, cx = qq.popleft()
                    region.append((cy, cx))
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        ny, nx = cy + dy, cx + dx
                        if 0 <= ny < h and 0 <= nx < w and inner[ny, nx] and not visited[ny, nx]:
                            visited[ny, nx] = True
                            qq.append((ny, nx))
                n = len(region)
                centroid_y = sum(p[0] for p in region) / n
                is_speck = n < 0.004 * h * w
                is_leg_gap = leg_clean and n < 0.035 * h * w and centroid_y > 0.60 * h
                if is_speck or is_leg_gap:
                    for (cy, cx) in region:
                        alpha[cy, cx] = 0

    # 3) 边缘羽化
    alpha_im = Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(0.8))
    return Image.fromarray(np.dstack([a, np.asarray(alpha_im)]), "RGBA")


def trim(im, pad=6):
    a = np.asarray(im)
    ys, xs = np.where(a[..., 3] > 10)
    if len(xs) == 0:
        return im
    x0, x1 = max(0, xs.min() - pad), min(im.width, xs.max() + pad + 1)
    y0, y1 = max(0, ys.min() - pad), min(im.height, ys.max() + pad + 1)
    return im.crop((x0, y0, x1, y1))


def extract_sprites():
    im = Image.open(SRC).convert("RGB")
    a = np.asarray(im)
    ink = np.any(a < INK, axis=2)

    rows = ink.sum(axis=1)
    bands, y = [], 0
    while y < len(rows):
        if rows[y] > 2:
            y0 = y
            while y < len(rows) and rows[y] > 2:
                y += 1
            if bands and y0 - bands[-1][1] < MERGE_Y:
                bands[-1] = (bands[-1][0], y)
            else:
                bands.append((y0, y))
        else:
            y += 1
    split_bands = []
    for (y0, y1) in bands:
        if y1 - y0 > MAX_BAND_H:
            lo, hi = y0 + 80, y1 - 80
            cut = lo + int(np.argmin(rows[lo:hi]))
            split_bands += [(y0, cut), (cut, y1)]
        else:
            split_bands.append((y0, y1))
    bands = split_bands
    print("行带:", bands)

    contact_cells = []
    for bi, (y0, y1) in enumerate(bands):
        name = ROW_NAMES[bi] if bi < len(ROW_NAMES) else f"row{bi}"
        cols = ink[y0:y1, :].sum(axis=0)
        segs, x = [], X_MIN
        while x < len(cols):
            if cols[x] > 0:
                x0 = x
                while x < len(cols) and cols[x] > 0:
                    x += 1
                if segs and x0 - segs[-1][1] < MERGE_X:
                    segs[-1] = (segs[-1][0], x)
                else:
                    segs.append((x0, x))
            else:
                x += 1
        segs = [s for s in segs if s[1] - s[0] > 40]
        row_cells = []
        for si, (x0, x1) in enumerate(segs):
            crop = im.crop((x0, max(0, y0 - 6), x1, min(im.height, y1 + 6)))
            sprite = trim(remove_bg(crop, leg_clean=name in LEG_ROWS))
            h = 200
            w2 = max(1, round(sprite.width * h / sprite.height))
            sprite = sprite.resize((w2, h), Image.LANCZOS)
            fn = f"{name}{si + 1}.png"
            sprite.save(os.path.join(MAE_OUT, fn))
            row_cells.append(sprite)
            print("  saved", fn, sprite.size)
        contact_cells.append(row_cells)

    def alias(src, dst):
        p = os.path.join(MAE_OUT, src)
        if os.path.exists(p):
            shutil.copy(p, os.path.join(MAE_OUT, dst))
    alias("walk1.png", "idle.png")
    alias("act5.png", "star.png")
    alias("act6.png", "back.png")

    cell = 220
    cols_n = max(len(r) for r in contact_cells)
    sheet = Image.new("RGB", (cols_n * cell, len(contact_cells) * cell), (40, 40, 48))
    for ri, row in enumerate(contact_cells):
        for ci, sp in enumerate(row):
            x = ci * cell + (cell - sp.width) // 2
            y = ri * cell + (cell - sp.height) // 2
            sheet.paste(sp, (x, y), sp)
    sheet.save(os.path.join(ROOT, "tools", "_contact.png"))
    print("核对拼图 -> tools/_contact.png")


# ---------------- 派生图 ----------------

def mosaic_region(im, box, block):
    r = im.crop(box)
    small = r.resize((max(1, r.width // block), max(1, r.height // block)), Image.BILINEAR)
    im.paste(small.resize((r.width, r.height), Image.NEAREST), box)


def derive():
    Image.open(os.path.join(P_DIR, "排版55.jpg")).rotate(90, expand=True).save(
        os.path.join(DER_OUT, "p55.jpg"), quality=90)

    im = Image.open(os.path.join(P_DIR, "排版57.jpg")).convert("RGB")
    W, H = im.size
    bg = im.getpixel((int(W * 0.80), int(H * 0.05)))
    a = np.asarray(im).copy()
    a[int(H * 0.005):int(H * 0.17), int(W * 0.865):int(W * 0.995)] = bg
    Image.fromarray(a).save(os.path.join(DER_OUT, "p57.jpg"), quality=90)

    im = Image.open(os.path.join(P_DIR, "排版42.jpg")).convert("RGB")
    W, H = im.size
    a = np.asarray(im).copy()
    a[int(H * 0.075):int(H * 0.235), int(W * 0.055):int(W * 0.155)] = (255, 255, 255)
    Image.fromarray(a).save(os.path.join(DER_OUT, "p42.jpg"), quality=90)

    for fn, regions in MOSAICS.items():
        im = Image.open(os.path.join(P_DIR, fn)).convert("RGB")
        for (x0, y0, x1, y1, block) in regions:
            mosaic_region(im, (x0, y0, x1, y1), block)
        out = os.path.join(DER_OUT, "p" + fn.replace("排版", "").replace(".jpg", "") + ".jpg")
        im.save(out, quality=90)
        print("mosaic ->", os.path.basename(out))


# ---------------- 网页优化图 ----------------

def optimize():
    jobs = [(os.path.join(P_DIR, f"排版{n}.jpg"), n) for n in ORIGINALS]
    jobs += [(os.path.join(DER_OUT, f"p{n}.jpg"), n) for n in DERIVED]
    for path, n in jobs:
        im = Image.open(path).convert("RGB")
        if im.width > 1600:
            im = im.resize((1600, round(im.height * 1600 / im.width)), Image.LANCZOS)
        im.save(os.path.join(WEB_OUT, f"p{n}.jpg"), quality=80, optimize=True)
    print("web 优化图 ->", WEB_OUT, f"({len(jobs)} 张)")


if __name__ == "__main__":
    extract_sprites()
    derive()
    optimize()
    print("完成")
