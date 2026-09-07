# -*- coding: utf-8 -*-
"""用 PIL 渲染帧 + ffmpeg 编码生成 2 个小体积商品演示 mp4（<1MB）"""
import os
import io
import math
import subprocess
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'static', 'mock')
FONT_BOLD = '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
W = H = 480
FPS = 15
DURATION = 6
FRAMES = FPS * DURATION


def shift(hex_color, factor):
    h = hex_color.lstrip('#')
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    if factor < 1:
        return (int(r * factor), int(g * factor), int(b * factor))
    f = factor - 1
    return (int(r + (255 - r) * f), int(g + (255 - g) * f), int(b + (255 - b) * f))


def make_video(path, color, title, sub):
    cmd = [
        'ffmpeg', '-y', '-f', 'image2pipe', '-vcodec', 'png', '-r', str(FPS),
        '-i', '-', '-vcodec', 'libx264', '-pix_fmt', 'yuv420p',
        '-preset', 'veryfast', '-crf', '30', '-movflags', '+faststart', path
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
    f_title = ImageFont.truetype(FONT_BOLD, 46)
    f_sub = ImageFont.truetype(FONT_BOLD, 26)
    c1, c2 = shift(color, 0.82), shift(color, 1.16)
    for i in range(FRAMES):
        t = i / FPS
        img = Image.new('RGB', (W, H), c1)
        px = img.load()
        # 竖向渐变
        for y in range(0, H, 4):
            f = y / H
            row = tuple(int(c1[k] + (c2[k] - c1[k]) * f) for k in range(3))
            for yy in range(y, min(y + 4, H)):
                for x in range(W):
                    px[x, yy] = row
        d = ImageDraw.Draw(img, 'RGBA')
        # 漂浮圆
        for k in range(5):
            ang = t * 0.8 + k * 1.3
            cx = W / 2 + math.sin(ang) * 150 + (k - 2) * 30
            cy = 200 + math.cos(ang * 0.8 + k) * 90
            r = 40 + k * 8
            d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 255, 255, 26))
        # 中央播放卡
        d.rounded_rectangle([90, 170, 390, 320], radius=28, fill=(255, 255, 255, 235))
        box = d.textbbox((0, 0), title, font=f_title)
        tw = box[2] - box[0]
        d.text(((W - tw) / 2, 200), title, font=f_title, fill=color)
        box2 = d.textbbox((0, 0), sub, font=f_sub)
        sw = box2[2] - box2[0]
        d.text(((W - sw) / 2, 268), sub, font=f_sub, fill=(120, 120, 120, 255))
        # 底部进度点（模拟播放）
        prog = i / (FRAMES - 1)
        d.rounded_rectangle([90, 360, 390, 368], radius=4, fill=(255, 255, 255, 90))
        d.rounded_rectangle([90, 360, 90 + int(300 * prog), 368], radius=4,
                            fill=(255, 255, 255, 230))
        buf = io.BytesIO()
        img.save(buf, 'PNG')
        proc.stdin.write(buf.getvalue())
    proc.stdin.close()
    proc.wait()


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    make_video(os.path.join(OUT, 'video1.mp4'), '#F6A623', '零食实拍', '开箱 · 试吃 · 新鲜看得见')
    make_video(os.path.join(OUT, 'video2.mp4'), '#B4282D', '门店探店', '零食商城直营店 · 千款好物')
    for f in ('video1.mp4', 'video2.mp4'):
        print(f, os.path.getsize(os.path.join(OUT, f)) // 1024, 'KB')
