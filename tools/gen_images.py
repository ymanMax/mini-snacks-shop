# -*- coding: utf-8 -*-
"""生成小程序离线占位静态图（纯色渐变 + 中文文字风格）"""
import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'static', 'mock')
os.makedirs(OUT, exist_ok=True)

FONT_PATH = '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
FONT_BOLD = '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'


def font(size, bold=False):
    try:
        return ImageFont.truetype(FONT_BOLD if bold else FONT_PATH, size)
    except Exception:
        return ImageFont.load_default()


def vgradient(size, c1, c2):
    """竖向线性渐变"""
    w, h = size
    base = Image.new('RGB', size, c1)
    top = Image.new('RGB', size, c2)
    mask = Image.new('L', (1, h))
    for y in range(h):
        mask.putpixel((0, y), int(255 * y / max(h - 1, 1)))
    base.paste(top, (0, 0), mask.resize(size))
    return base


def hgradient(size, c1, c2):
    w, h = size
    base = Image.new('RGB', size, c1)
    top = Image.new('RGB', size, c2)
    mask = Image.new('L', (w, 1))
    for x in range(w):
        mask.putpixel((x, 0), int(255 * x / max(w - 1, 1)))
    base.paste(top, (0, 0), mask.resize(size))
    return base


def shift(hex_color, factor):
    h = hex_color.lstrip('#')
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    if factor < 1:
        return (int(r * factor), int(g * factor), int(b * factor))
    f = factor - 1
    return (int(r + (255 - r) * f), int(g + (255 - g) * f), int(b + (255 - b) * f))


def draw_center(draw, xy, text, fnt, fill):
    cx, cy = xy
    box = draw.textbbox((0, 0), text, font=fnt)
    tw, th = box[2] - box[0], box[3] - box[1]
    draw.text((cx - tw / 2, cy - th / 2 - box[1]), text, font=fnt, fill=fill)


def wrap_text(draw, text, fnt, max_w):
    # 按 token 切分：连续的 ASCII 字符（数字/字母）作为整体不在中间断行
    tokens, buf = [], ''
    for ch in text:
        if ord(ch) < 128 and ch != ' ':
            buf += ch
        else:
            if buf:
                tokens.append(buf)
                buf = ''
            tokens.append(ch)
    if buf:
        tokens.append(buf)
    lines, cur = [], ''
    for tk in tokens:
        if draw.textlength(cur + tk, font=fnt) <= max_w:
            cur += tk
        else:
            if cur.strip():
                lines.append(cur.strip())
            cur = tk if tk != ' ' else ''
    if cur.strip():
        lines.append(cur.strip())
    return lines[:2]


def goods_image(path, name, brand, color, seed, size=(480, 480)):
    """商品包装风格占位图：渐变底 + 白色包裹卡 + 名称"""
    img = vgradient(size, shift(color, 0.82), shift(color, 1.18))
    d = ImageDraw.Draw(img, 'RGBA')
    # 装饰圆点
    for i in range(5):
        ang = seed * 1.7 + i * 1.25
        cx = int(size[0] * (0.15 + 0.18 * i) + math.sin(ang) * 60)
        cy = int(60 + (i % 3) * 150 + math.cos(ang) * 40)
        d.ellipse([cx - 90, cy - 90, cx + 90, cy + 90], fill=(255, 255, 255, 22))
    # 白色包裹卡
    card = [70, 96, size[0] - 70, size[1] - 70]
    d.rounded_rectangle(card, radius=36, fill=(255, 255, 255, 244))
    d.rounded_rectangle([card[0], card[1], card[2], card[1] + 92], radius=36,
                        fill=tuple(shift(color, 1.0)) + (255,))
    d.rectangle([card[0], card[1] + 50, card[2], card[1] + 92],
                fill=tuple(shift(color, 1.0)) + (255,))
    draw_center(d, (size[0] / 2, card[1] + 48), brand, font(40, True), (255, 255, 255, 255))
    # 零食图形（简单几何：圆形/方盒）
    cx = size[0] / 2
    cy = 238
    kind = seed % 3
    if kind == 0:
        d.ellipse([cx - 60, cy - 60, cx + 60, cy + 60], fill=tuple(shift(color, 1.08)) + (255,))
        d.ellipse([cx - 24, cy - 70, cx + 24, cy - 22], fill=(255, 255, 255, 90))
    elif kind == 1:
        d.rounded_rectangle([cx - 58, cy - 54, cx + 58, cy + 54], radius=18,
                            fill=tuple(shift(color, 1.08)) + (255,))
        d.line([cx - 38, cy - 16, cx + 38, cy - 16], fill=(255, 255, 255, 160), width=7)
        d.line([cx - 38, cy + 16, cx + 22, cy + 16], fill=(255, 255, 255, 160), width=7)
    else:
        for k in range(3):
            ox = (k - 1) * 48
            d.ellipse([cx + ox - 27, cy - 48, cx + ox + 27, cy + 48],
                      fill=tuple(shift(color, 1.05 + k * 0.05)) + (255,))
    # 名称
    lines = wrap_text(d, name, font(38, True), size[0] - 160)
    y = (card[3] - 72) - (len(lines) - 1) * 27
    for ln in lines:
        draw_center(d, (size[0] / 2, y), ln, font(38, True), (51, 51, 51, 255))
        y += 54
    img.save(path, 'JPEG', quality=82)


def pool_image(path, label, sub, color, size=(480, 480)):
    """通用实拍风格细节图"""
    img = vgradient(size, shift(color, 0.9), shift(color, 1.15))
    d = ImageDraw.Draw(img, 'RGBA')
    for i in range(9):
        cx = int((i * 197 % 440) + 20)
        cy = int((i * 113 % 440) + 20)
        r = 46 + (i % 3) * 26
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 255, 255, 30))
    draw_center(d, (size[0] / 2, size[1] / 2 - 30), label, font(56, True), (255, 255, 255, 255))
    draw_center(d, (size[0] / 2, size[1] / 2 + 44), sub, font(30), (255, 255, 255, 220))
    img.save(path, 'JPEG', quality=80)


def banner_image(path, title, sub, color, size=(750, 320)):
    img = hgradient(size, shift(color, 0.85), shift(color, 1.2))
    d = ImageDraw.Draw(img, 'RGBA')
    for i in range(6):
        cx = 520 + (i % 3) * 90
        cy = 40 + (i // 3) * 200
        d.ellipse([cx - 110, cy - 110, cx + 110, cy + 110], fill=(255, 255, 255, 24))
    d.text((48, 96), title, font=font(58, True), fill=(255, 255, 255, 255))
    d.text((52, 184), sub, font=font(30), fill=(255, 255, 255, 230))
    d.rounded_rectangle([52, 232, 248, 282], radius=25, fill=(255, 255, 255, 255))
    draw_center(d, (150, 257), '立即抢购', font(28, True), tuple(shift(color, 0.9)) + (255,))
    img.save(path, 'JPEG', quality=82)


def theme_image(path, title, sub, color, size=(342, 200)):
    img = vgradient(size, shift(color, 1.12), shift(color, 0.85))
    d = ImageDraw.Draw(img, 'RGBA')
    d.ellipse([size[0] - 130, -60, size[0] + 60, 130], fill=(255, 255, 255, 34))
    d.ellipse([-70, size[1] - 120, 120, size[1] + 70], fill=(255, 255, 255, 26))
    draw_center(d, (size[0] / 2, size[1] / 2 - 22), title, font(42, True), (255, 255, 255, 255))
    draw_center(d, (size[0] / 2, size[1] / 2 + 34), sub, font(24), (255, 255, 255, 220))
    img.save(path, 'JPEG', quality=82)


def avatar_image(path, color, char, size=(160, 160)):
    img = vgradient(size, shift(color, 0.9), shift(color, 1.15))
    d = ImageDraw.Draw(img)
    draw_center(d, (size[0] / 2, size[1] / 2), char, font(76, True), (255, 255, 255, 255))
    img.save(path, 'JPEG', quality=85)


def icon_image(path, char, color, size=(96, 96)):
    img = Image.new('RGBA', size, (0, 0, 0, 0))
    d = ImageDraw.Draw(img, 'RGBA')
    d.rounded_rectangle([4, 4, size[0] - 4, size[1] - 4], radius=22,
                        fill=tuple(shift(color, 1.05)) + (255,))
    draw_center(d, (size[0] / 2, size[1] / 2 + 2), char, font(48, True), (255, 255, 255, 255))
    img.save(path, 'PNG')


def default_image(path, size=(480, 480)):
    img = Image.new('RGB', size, (245, 246, 247))
    d = ImageDraw.Draw(img, 'RGBA')
    cx, cy = size[0] / 2, size[1] / 2 - 30
    d.rounded_rectangle([cx - 96, cy - 78, cx + 96, cy + 88], radius=18,
                        outline=(200, 202, 205, 255), width=10)
    d.ellipse([cx - 60, cy - 42, cx - 14, cy + 4], fill=(200, 202, 205, 255))
    d.polygon([(cx - 58, cy + 58), (cx - 8, cy + 12), (cx + 34, cy + 58)],
              fill=(200, 202, 205, 255))
    d.polygon([(cx + 6, cy + 58), (cx + 48, cy + 22), (cx + 88, cy + 58)],
              fill=(200, 202, 205, 255))
    draw_center(d, (cx, cy + 130), '图片走丢了', font(34), (180, 182, 185, 255))
    img.save(path, 'PNG')


# ---------------- 数据定义 ----------------
CATS = [
    ('膨', '#F6A623'), ('糖', '#D96B8E'), ('坚', '#B0813F'), ('饼', '#E3BE5C'),
    ('肉', '#B4282D'), ('饮', '#4A90D9'), ('礼', '#8E5BA6'), ('进', '#2FA892'),
]
GOODS = [
    ('乐事原味薯片 75g', '乐事', 0), ('上好佳鲜虾条 80g', '上好佳', 0),
    ('旺旺仙贝米饼 500g', '旺旺', 0), ('品客烧烤味薯片 110g', '品客', 0),
    ('德芙丝滑牛奶巧克力 252g', '德芙', 1), ('阿尔卑斯硬糖混合装 500g', '阿尔卑斯', 1),
    ('旺旺QQ果汁软糖 200g', '旺旺', 1), ('费列罗榛果威化巧克力 T16', '费列罗', 1),
    ('三只松鼠每日坚果 750g', '三只松鼠', 2), ('百草味奶油味碧根果 100g', '百草味', 2),
    ('良品铺子夏威夷果 265g', '良品铺子', 2), ('洽洽五香瓜子 308g', '洽洽', 2),
    ('奥利奥原味夹心饼干 388g', '奥利奥', 3), ('趣多多巧克力曲奇 285g', '趣多多', 3),
    ('达利园蛋黄派 650g', '达利园', 3), ('徐福记沙琪玛 526g', '徐福记', 3),
    ('三只松鼠手撕肉脯 100g', '三只松鼠', 4), ('周黑鸭卤鸭脖锁鲜 180g', '周黑鸭', 4),
    ('麻辣牛肉干 100g', '蜀道香', 4), ('无穷烤鸡小腿 400g', '无穷', 4),
    ('元气森林白桃气泡水 480ml', '元气森林', 5), ('零度可乐 330ml*6罐', '可口可乐', 5),
    ('农夫山泉NFC橙汁 300ml', '农夫山泉', 5), ('喜茶低糖柠檬茶 250ml', '喜茶', 5),
    ('良品铺子零食大礼盒 1.5kg', '良品铺子', 6), ('三只松鼠坚果礼盒 1.2kg', '三只松鼠', 6),
    ('徐福记新年糖果礼盒 1kg', '徐福记', 6), ('环球进口零食礼盒 2kg', '零食商城', 6),
    ('韩国三养火鸡面五连包', '三养', 7), ('卡乐比薯条三兄弟 180g', '卡乐比', 7),
    ('泰国老板仔脆海苔卷 32g', '老板仔', 7), ('丽芝士纳宝帝威化 350g', '丽芝士', 7),
]

def main():
    # 分类图标
    for i, (ch, color) in enumerate(CATS, 1):
        icon_image(os.path.join(OUT, f'cat{i}.png'), ch, color)
    # 商品图
    for i, (name, brand, ci) in enumerate(GOODS, 1):
        goods_image(os.path.join(OUT, f'g{i:02d}.jpg'), name, brand, CATS[ci][1], i)
    # 通用细节图池
    pool_defs = [
        ('细节实拍', '新鲜看得见', '#F6A623'), ('包装展示', '密封锁鲜装', '#D96B8E'),
        ('开箱展示', '满满一箱', '#B0813F'), ('试吃分享', '好吃到停不下', '#E3BE5C'),
        ('产地直采', '当季新货', '#2FA892'), ('质检报告', '坏果包赔', '#B4282D'),
        ('顺丰包邮', '冷链配送', '#4A90D9'), ('会员专享', '金卡折上折', '#8E5BA6'),
    ]
    for i, (lab, sub, color) in enumerate(pool_defs, 1):
        pool_image(os.path.join(OUT, f'u{i:02d}.jpg'), lab, sub, color)
    # banner / 主题
    banner_image(os.path.join(OUT, 'banner1.jpg'), '零食大促销', '全场满 99 减 20，限时 3 天', '#B4282D')
    banner_image(os.path.join(OUT, 'banner2.jpg'), '新品抢先尝', '当季网红零食新鲜上架', '#F6A623')
    banner_image(os.path.join(OUT, 'banner3.jpg'), '会员专享日', '金卡会员享专属折扣与赠券', '#8E5BA6')
    theme_image(os.path.join(OUT, 'theme1.jpg'), '热门零食', '大家都在买', '#B4282D')
    theme_image(os.path.join(OUT, 'theme2.jpg'), '新品上市', '尝鲜不等待', '#F6A623')
    theme_image(os.path.join(OUT, 'theme3.jpg'), '特惠专区', '高性价比之选', '#2FA892')
    # 头像
    avatar_colors = ['#B4282D', '#F6A623', '#4A90D9', '#2FA892', '#8E5BA6', '#D96B8E']
    avatar_chars = ['零', '馋', '猫', '熊', '鹿', '兔']
    for i, (c, ch) in enumerate(zip(avatar_colors, avatar_chars), 1):
        avatar_image(os.path.join(OUT, f'avatar{i}.jpg'), c, ch)
    # 店铺图
    pool_image(os.path.join(OUT, 'shop1.jpg'), '零食商城·直营店', '线下门店实拍', '#B4282D')
    pool_image(os.path.join(OUT, 'shop2.jpg'), '门店陈列', '千款零食任选', '#F6A623')
    pool_image(os.path.join(OUT, 'shop3.jpg'), '打包配送', '顺丰冷链速达', '#4A90D9')
    default_image(os.path.join(ROOT, 'static', 'images', 'default.png'))
    print('images done:', len(os.listdir(OUT)), 'files')

if __name__ == '__main__':
    os.makedirs(os.path.join(ROOT, 'static', 'images'), exist_ok=True)
    main()
