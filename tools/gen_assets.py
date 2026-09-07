# -*- coding: utf-8 -*-
"""
零食商城小程序本地 Mock 资源生成脚本
运行: python3 tools/gen_assets.py
生成: static/mock 下的商品图/banner/主题图/店铺照/头像、static/images 下的默认图与空态图、演示小视频
风格: 纯色渐变 + 中文文字 + 扁平图标，保证离线可用、无裂图风险
"""
import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MOCK = os.path.join(ROOT, 'static', 'mock')
IMG = os.path.join(ROOT, 'static', 'images')
VIDEO = os.path.join(MOCK, 'video')
for p in [MOCK, IMG, VIDEO,
          os.path.join(MOCK, 'goods'), os.path.join(MOCK, 'detail'),
          os.path.join(MOCK, 'shop'), os.path.join(MOCK, 'avatar'),
          os.path.join(MOCK, 'banner'), os.path.join(MOCK, 'theme'),
          os.path.join(MOCK, 'category'), os.path.join(ROOT, 'images', 'mine')]:
    os.makedirs(p, exist_ok=True)

FONT_B = '/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc'
FONT_M = '/usr/share/fonts/opentype/noto/NotoSansCJK-Medium.ttc'
FONT_R = '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'


def font(size, bold=True):
    return ImageFont.truetype(FONT_B if bold else FONT_R, size)


def vgrad(size, c1, c2):
    """竖向渐变"""
    w, h = size
    base = Image.new('RGB', size, c1)
    top = Image.new('RGB', size, c2)
    mask = Image.new('L', size)
    md = mask.load()
    for y in range(h):
        v = int(255 * y / max(h - 1, 1))
        for x in range(w):
            md[x, y] = v
    base.paste(top, (0, 0), mask)
    return base


def dgrad(size, c1, c2, angle=-35):
    """对角渐变（旋转实现）"""
    w, h = size
    s = int(math.hypot(w, h)) + 8
    g = vgrad((s, s), c1, c2).rotate(angle)
    out = Image.new('RGB', size, c1)
    out.paste(g, ((w - s) // 2, (h - s) // 2))
    return out


def hx(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def rr(d, box, r, fill, outline=None, width=1):
    d.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=width)


def center_text(d, cx, cy, text, fnt, fill, anchor='mm'):
    d.text((cx, cy), text, font=fnt, fill=fill, anchor=anchor)


def wrap_name(name):
    """长名称两行拆分"""
    if len(name) <= 6:
        return [name]
    # 尽量在中间位置断行
    mid = len(name) // 2
    return [name[:mid + 1], name[mid + 1:]]


# ---------------- 扁平图标（白色描边/填充） ----------------
def draw_icon(d, kind, cx, cy, s, fill=(255, 255, 255), lw=10):
    """以 (cx,cy) 为中心、s 为尺寸绘制 8 类零食扁平图标"""
    x0, y0, x1, y1 = cx - s // 2, cy - s // 2, cx + s // 2, cy + s // 2
    if kind == 1:  # 薯片：三片叠加圆
        for dx, dy, a in [(-s*0.18, s*0.12, 255), (s*0.16, s*0.14, 235), (0, -s*0.12, 255)]:
            col = fill + (a,) if len(fill) == 3 else fill
            d.ellipse([cx-s*0.34+dx, cy-s*0.26+dy, cx+s*0.14+dx, cy+s*0.22+dy],
                      outline=col, width=lw)
            d.arc([cx-s*0.34+dx, cy-s*0.26+dy, cx+s*0.14+dx, cy+s*0.22+dy],
                  200, 320, fill=col, width=lw)
    elif kind == 2:  # 巧克力排块
        rr(d, [x0, cy-s*0.28, x1, cy+s*0.30], int(s*0.10), fill)
        col = (236, 64, 122)
        for i in range(3):
            for j in range(2):
                bx0 = x0 + s*0.08 + i*s*0.29
                by0 = cy - s*0.20 + j*s*0.28
                rr(d, [bx0, by0, bx0+s*0.22, by0+s*0.20], int(s*0.04),
                   fill, outline=col, width=4)
    elif kind == 3:  # 坚果
        d.ellipse([cx-s*0.26, cy-s*0.16, cx+s*0.26, cy+s*0.34], fill=fill)
        d.pieslice([cx-s*0.30, cy-s*0.40, cx+s*0.30, cy+s*0.06], 180, 360, fill=fill)
        d.line([cx-s*0.30, cy-s*0.16, cx+s*0.30, cy-s*0.16], fill=(180, 120, 40), width=6)
        d.ellipse([cx-s*0.06, cy+s*0.02, cx+s*0.06, cy+s*0.14], fill=(180, 120, 40))
    elif kind == 4:  # 曲奇
        d.ellipse([x0, y0, x1, y1], fill=fill)
        chip = (120, 70, 30)
        for dx, dy in [(-0.18, -0.14), (0.12, -0.10), (-0.05, 0.05),
                       (0.2, 0.16), (-0.22, 0.18), (0.0, -0.26)]:
            r = s*0.055
            d.ellipse([cx+dx*s-r, cy+dy*s-r, cx+dx*s+r, cy+dy*s+r], fill=chip)
    elif kind == 5:  # 肉脯：条状+纹理
        rr(d, [x0, cy-s*0.30, x1, cy+s*0.30], int(s*0.14), fill)
        for i in range(3):
            yy = cy - s*0.14 + i*s*0.14
            d.arc([x0+s*0.12, yy-s*0.10, x1-s*0.12, yy+s*0.10],
                  20, 160, fill=(180, 60, 60), width=6)
    elif kind == 6:  # 奶茶杯
        # 吸管
        d.line([cx+s*0.16, cy-s*0.48, cx+s*0.04, cy-s*0.08],
               fill=fill, width=int(lw*0.9))
        # 杯身（梯形）
        d.polygon([(cx-s*0.26, cy-s*0.10), (cx+s*0.26, cy-s*0.10),
                   (cx+s*0.18, cy+s*0.40), (cx-s*0.18, cy+s*0.40)], fill=fill)
        # 珍珠
        for dx in (-0.10, 0.02, 0.13):
            d.ellipse([cx+dx*s-s*0.05, cy+s*0.22-s*0.05,
                       cx+dx*s+s*0.05, cy+s*0.22+s*0.05], fill=(90, 50, 30))
        rr(d, [cx-s*0.30, cy-s*0.18, cx+s*0.30, cy-s*0.06], int(s*0.06), fill)
    elif kind == 7:  # 礼盒
        rr(d, [x0, cy-s*0.22, x1, cy+s*0.36], int(s*0.08), fill)
        d.rectangle([cx-s*0.10, cy-s*0.22, cx+s*0.10, cy+s*0.36],
                    fill=(120, 70, 200))
        rr(d, [x0, cy-s*0.36, x1, cy-s*0.20], int(s*0.06), fill)
        d.ellipse([cx-s*0.16, cy-s*0.46, cx+s*0.02, cy-s*0.28],
                  outline=fill, width=int(lw*0.8))
        d.ellipse([cx-s*0.02, cy-s*0.46, cx+s*0.16, cy-s*0.28],
                  outline=fill, width=int(lw*0.8))
    elif kind == 8:  # 进口：地球
        d.ellipse([x0, cy-s*0.38, x1, cy+s*0.38], outline=fill, width=lw)
        d.ellipse([cx-s*0.18, cy-s*0.38, cx+s*0.18, cy+s*0.38],
                  outline=fill, width=int(lw*0.7))
        d.line([cx, cy-s*0.38, cx, cy+s*0.38], fill=fill, width=int(lw*0.7))
        d.arc([cx-s*0.38, cy-s*0.18, cx+s*0.38, cy+s*0.18], 20, 160,
              fill=fill, width=int(lw*0.7))


# ---------------- 商品数据（名称 + 类别，类别决定图标与配色） ----------------
GOODS = [
    ('香辣味薯片', 1), ('原味马铃薯片', 1), ('墨西哥玉米片', 1), ('芝士玉米棒', 1),
    ('丝滑牛奶巧克力', 2), ('松露形黑巧克力', 2), ('果汁QQ软糖', 2), ('海盐薄荷糖', 2),
    ('奶油夏威夷果', 3), ('每日坚果混合装', 3), ('手剥巴旦木', 3), ('焦糖味瓜子', 3),
    ('蔓越莓曲奇饼干', 4), ('咸蛋黄麦芽饼', 4), ('手撕软面包', 4), ('流心榴莲饼', 4),
    ('靖江精制猪肉脯', 5), ('麻辣手撕牛肉干', 5), ('虎皮五香凤爪', 5), ('卤味鸭脖大礼包', 5),
    ('手摇珍珠奶茶', 6), ('冷萃冻干咖啡', 6), ('白桃味气泡水', 6), ('桂花酸梅汤', 6),
    ('进口零食大礼盒', 7), ('坚果年货礼盒', 7), ('童心糖果礼盒', 7), ('辣条欢聚大礼包', 7),
    ('蜂蜜黄油杏仁', 8), ('白色恋人饼干', 8), ('泰国芒果软糖', 8), ('德式咸脆饼干棒', 8),
]
PALETTE = {
    1: ('#ffb74d', '#f4511e'),
    2: ('#f48fb1', '#d81b60'),
    3: ('#ffd54f', '#b8860b'),
    4: ('#ffcc80', '#ef6c00'),
    5: ('#ef9a9a', '#c62828'),
    6: ('#81d4fa', '#0277bd'),
    7: ('#b39ddb', '#5e35b1'),
    8: ('#80cbc4', '#00695c'),
}
CAT_NAMES = ['', '膨化食品', '糖果巧克力', '坚果炒货', '饼干糕点',
             '肉脯卤味', '饮料冲调', '礼盒专区', '进口零食']


def gen_goods(idx, name, kind):
    S = 600
    c1, c2 = PALETTE[kind]
    im = dgrad((S, S), hx(c1), hx(c2))
    d = ImageDraw.Draw(im, 'RGBA')
    # 装饰圆
    for cx, cy, r, a in [(70, 80, 130, 26), (540, 520, 170, 22),
                         (520, 60, 60, 30), (60, 520, 80, 20)]:
        d.ellipse([cx-r, cy-r, cx+r, cy+r], fill=(255, 255, 255, a))
    # 白色圆角卡片
    rr(d, [70, 70, S-70, S-70], 36, (255, 255, 255, 40),
       outline=(255, 255, 255, 120), width=3)
    draw_icon(d, kind, S//2, 250, 250, fill=(255, 255, 255, 250), lw=14)
    # 名称
    lines = wrap_name(name)
    f = font(58 if len(lines) == 1 else 52)
    if len(lines) == 1:
        center_text(d, S//2, 430, lines[0], f, (255, 255, 255))
    else:
        center_text(d, S//2, 415, lines[0], f, (255, 255, 255))
        center_text(d, S//2, 480, lines[1], f, (255, 255, 255))
    # 角标
    rr(d, [100, 510, 220, 552], 20, (255, 255, 255, 235))
    center_text(d, 160, 532, CAT_NAMES[kind], font(24, False), hx(c2))
    im = im.convert('RGB')
    im.save(os.path.join(MOCK, 'goods', 'g%02d.jpg' % idx), quality=78)


def gen_detail(idx, c1, c2, label):
    W, H = 750, 560
    im = dgrad((W, H), hx(c1), hx(c2), angle=-20)
    d = ImageDraw.Draw(im, 'RGBA')
    for i in range(9):
        cx = 80 + (i % 3) * 300
        cy = 80 + (i // 3) * 200
        d.ellipse([cx-50, cy-50, cx+50, cy+50], fill=(255, 255, 255, 18))
    center_text(d, W//2, H//2 - 30, label, font(64), (255, 255, 255, 245))
    center_text(d, W//2, H//2 + 50, '零食商城 · 实物拍摄', font(30, False),
                (255, 255, 255, 210))
    im.convert('RGB').save(os.path.join(MOCK, 'detail', 'd%02d.jpg' % idx),
                           quality=78)


def gen_shop(idx, label):
    W, H = 750, 460
    im = dgrad((W, H), hx('#fff3e0'), hx('#ffcc80'), angle=-25)
    d = ImageDraw.Draw(im, 'RGBA')
    # 货架
    rr(d, [60, 130, W-60, 400], 18, (255, 255, 255, 235))
    shelf_cols = ['#ef5350', '#42a5f5', '#66bb6a', '#ffca28', '#ab47bc']
    for r in range(2):
        for c in range(5):
            bx = 90 + c*122
            by = 150 + r*120
            col = hx(shelf_cols[(r*5+c) % 5])
            rr(d, [bx, by, bx+80, by+86], 10, col + (255,))
    d.line([60, 262, W-60, 262], fill=(180, 140, 90, 255), width=6)
    center_text(d, W//2, 70, label, font(48), hx('#bf360c'))
    im.convert('RGB').save(os.path.join(MOCK, 'shop', 's%02d.jpg' % idx), quality=80)


def gen_banner(idx, c1, c2, title, sub):
    W, H = 750, 340
    im = dgrad((W, H), hx(c1), hx(c2), angle=-30)
    d = ImageDraw.Draw(im, 'RGBA')
    for cx, cy, r in [(640, 60, 110), (60, 300, 90), (560, 300, 50)]:
        d.ellipse([cx-r, cy-r, cx+r, cy+r], fill=(255, 255, 255, 28))
    center_text(d, 90, 120, title, font(64), (255, 255, 255), anchor='lm')
    center_text(d, 92, 200, sub, font(34, False), (255, 255, 255, 230), anchor='lm')
    rr(d, [90, 235, 250, 285], 25, (255, 255, 255, 235))
    center_text(d, 170, 260, '立即抢购', font(28, False), hx(c2))
    im.convert('RGB').save(os.path.join(MOCK, 'banner', 'b%02d.jpg' % idx), quality=82)


def gen_theme(idx, c1, c2, title, sub, kind):
    S = 700, 420
    im = dgrad(S, hx(c1), hx(c2), angle=-35)
    d = ImageDraw.Draw(im, 'RGBA')
    d.ellipse([S[0]-220, -90, S[0]+90, 220], fill=(255, 255, 255, 26))
    draw_icon(d, kind, S[0]-150, S[1]//2, 190, fill=(255, 255, 255, 235), lw=12)
    center_text(d, 50, 160, title, font(56), (255, 255, 255), anchor='lm')
    center_text(d, 52, 230, sub, font(30, False), (255, 255, 255, 220), anchor='lm')
    im.convert('RGB').save(os.path.join(MOCK, 'theme', 't%02d.jpg' % idx), quality=82)


def gen_avatar(idx, bg):
    S = 160
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse([4, 4, S-4, S-4], fill=hx(bg) + (255,))
    # 笑脸
    d.ellipse([S*0.32, S*0.36, S*0.44, S*0.48], fill=(255, 255, 255, 255))
    d.ellipse([S*0.56, S*0.36, S*0.68, S*0.48], fill=(255, 255, 255, 255))
    d.arc([S*0.34, S*0.44, S*0.66, S*0.66], 20, 160, fill=(255, 255, 255, 255), width=8)
    im.save(os.path.join(MOCK, 'avatar', 'av%02d.png' % idx))


def gen_category(idx, kind, name, c1, c2):
    S = 120
    im = dgrad((S, S), hx(c1), hx(c2), angle=-35).convert('RGBA')
    mask = Image.new('L', (S, S), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle([0, 0, S-1, S-1], radius=26, fill=255)
    out = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    out.paste(im, (0, 0), mask)
    d = ImageDraw.Draw(out)
    draw_icon(d, kind, S//2, S//2+2, 76, fill=(255, 255, 255, 245), lw=8)
    out.save(os.path.join(MOCK, 'category', 'c%02d.png' % idx))


def gen_default():
    S = 400
    im = Image.new('RGB', (S, S), hx('#f2f3f5'))
    d = ImageDraw.Draw(im)
    d.rectangle([2, 2, S-2, S-2], outline=hx('#dcdee0'), width=4)
    # 山与太阳
    d.ellipse([S//2-40, 110, S//2+40, 190], fill=hx('#c8c9cc'))
    d.polygon([(110, 300), (200, 180), (290, 300)], fill=hx('#c8c9cc'))
    d.polygon([(220, 300), (310, 200), (380, 300)], fill=hx('#dcdee0'))
    center_text(d, S//2, 340, '暂无图片', font(30, False), hx('#969799'))
    im.save(os.path.join(IMG, 'default.png'))


def gen_logo():
    S = 240
    im = dgrad((S, S), hx('#d8443a'), hx('#b4282d'), angle=-30).convert('RGBA')
    m = Image.new('L', (S, S), 0)
    ImageDraw.Draw(m).ellipse([0, 0, S-1, S-1], fill=255)
    out = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    out.paste(im, (0, 0), m)
    d = ImageDraw.Draw(out)
    center_text(d, S//2, S//2 + 8, '食', font(120), (255, 255, 255, 250))
    out.save(os.path.join(MOCK, 'logo.png'))
    # mine 页头像
    av = Image.open(os.path.join(MOCK, 'avatar', 'av01.png')).resize((160, 160))
    av.save(os.path.join(ROOT, 'images', 'mine', 'avatar.png'))


def gen_empty(key, draw_fn, text):
    S = 420
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    GRAY = (176, 178, 182, 255)
    LIGHT = (220, 222, 226, 255)
    draw_fn(d, GRAY, LIGHT)
    im.save(os.path.join(IMG, 'empty_%s.png' % key))
    return im


def gen_empties():
    def cart(d, g, l):
        d.rounded_rectangle([110, 140, 300, 250], radius=18, outline=g, width=10)
        d.ellipse([140, 280, 176, 316], fill=g)
        d.ellipse([244, 280, 280, 316], fill=g)
        d.line([90, 120, 130, 120], fill=g, width=10)
        d.line([130, 120, 150, 150], fill=g, width=10)
        d.arc([150, 70, 240, 150], 200, 340, fill=l, width=8)
    def order(d, g, l):
        d.rounded_rectangle([130, 90, 290, 300], radius=16, outline=g, width=10)
        for i in range(3):
            d.line([160, 140+i*50, 260, 140+i*50], fill=l, width=8)
        d.ellipse([190, 200, 230, 240], outline=g, width=8)
        d.line([218, 222, 230, 236], fill=g, width=8)
    def search(d, g, l):
        d.ellipse([130, 110, 250, 230], outline=g, width=12)
        d.line([240, 220, 300, 290], fill=g, width=14)
    def addr(d, g, l):
        d.arc([140, 90, 280, 230], 200, -20, fill=g, width=12)
        d.ellipse([190, 150, 230, 190], fill=g)
        d.rounded_rectangle([120, 250, 300, 300], radius=10, outline=l, width=8)
    def heart(d, g, l):
        d.arc([130, 130, 215, 215], 180, 360, fill=g, width=12)
        d.arc([205, 130, 290, 215], 180, 360, fill=g, width=12)
        d.polygon([(138, 185), (282, 185), (210, 290)], outline=g)
        d.line([138, 185, 210, 290], fill=g, width=12)
        d.line([282, 185, 210, 290], fill=g, width=12)
    def coupon(d, g, l):
        d.rounded_rectangle([100, 150, 320, 270], radius=14, outline=g, width=10)
        d.ellipse([90, 195, 120, 225], fill=(255, 255, 255, 0), outline=g, width=10)
        d.ellipse([300, 195, 330, 225], outline=g, width=10)
        d.line([210, 160, 210, 260], fill=l, width=6)
    def msg(d, g, l):
        d.rounded_rectangle([110, 120, 310, 250], radius=18, outline=g, width=10)
        d.line([110, 140, 210, 210], fill=g, width=10)
        d.line([310, 140, 210, 210], fill=g, width=10)
    def foot(d, g, l):
        for cx, cy, r in [(170, 160, 34), (135, 215, 13), (170, 225, 13),
                          (205, 220, 13), (235, 205, 13)]:
            d.ellipse([cx-r, cy-r, cx+r, cy+r], fill=g)
        for cx, cy, r in [(270, 250, 26), (245, 292, 10), (275, 300, 10), (303, 292, 10)]:
            d.ellipse([cx-r, cy-r, cx+r, cy+r], fill=l)
    gen_empty('cart', cart, '')
    gen_empty('order', order, '')
    gen_empty('search', search, '')
    gen_empty('address', addr, '')
    gen_empty('collect', heart, '')
    gen_empty('coupon', coupon, '')
    gen_empty('message', msg, '')
    gen_empty('footprint', foot, '')


def gen_video_frames():
    """生成两版短视频帧，再由 ffmpeg 合成"""
    FR = os.path.join(VIDEO, 'frames')
    os.makedirs(FR, exist_ok=True)
    variants = [
        ('#ff8a65', '#c62828', '零食店铺实拍', '新鲜上架 · 当日发货'),
        ('#4fc3f7', '#01579b', '零食开箱视频', '严选好物 · 安心品尝'),
    ]
    N = 24
    for vi, (c1, c2, t1, t2) in enumerate(variants, 1):
        for i in range(N):
            W, H = 640, 360
            im = dgrad((W, H), hx(c1), hx(c2), angle=-35 + i*2)
            d = ImageDraw.Draw(im, 'RGBA')
            # 飘动圆点
            for k in range(6):
                cx = int((80 + k*120 + i*8*(k+1)) % 720) - 40
                cy = int(60 + ((k*53 + i*6) % 260))
                d.ellipse([cx-24, cy-24, cx+24, cy+24], fill=(255, 255, 255, 40))
            center_text(d, W//2, 150, t1, font(52), (255, 255, 255, 250))
            center_text(d, W//2, 215, t2, font(28, False), (255, 255, 255, 220))
            # 播放进度点
            d.rounded_rectangle([W//2-80, 280, W//2+80, 288], radius=4,
                                fill=(255, 255, 255, 90))
            w = int(160 * (i+1) / N)
            d.rounded_rectangle([W//2-80, 280, W//2-80+w, 288], radius=4,
                                fill=(255, 255, 255, 220))
            im.convert('RGB').save(os.path.join(FR, 'v%d_%03d.jpg' % (vi, i)),
                                   quality=70)


if __name__ == '__main__':
    print('生成商品图...')
    for i, (name, kind) in enumerate(GOODS, 1):
        gen_goods(i, name, kind)
    print('生成详情图...')
    gen_detail(1, '#ffe0b2', '#fb8c00', '新鲜食材')
    gen_detail(2, '#ffccbc', '#d84315', '独立包装')
    gen_detail(3, '#d7ccc8', '#5d4037', '匠心工艺')
    gen_detail(4, '#b2dfdb', '#00695c', '品质保障')
    print('生成店铺照...')
    gen_shop(1, '零食商城 · 直营店')
    gen_shop(2, '货架一角')
    gen_shop(3, '打包发货区')
    print('生成 banner / 主题图...')
    gen_banner(1, '#d8443a', '#b4282d', '零食大促 8 折起', '千款网红零食 限时直降')
    gen_banner(2, '#f78a1d', '#e8590c', '新品首发季', '尝鲜价 第二件半价')
    gen_banner(3, '#8e6fdb', '#5e35b1', '会员尊享日', '领券立减 积分翻倍')
    gen_theme(1, '#ff7043', '#d84315', '人气热卖', '好评如潮的爆款清单', 7)
    gen_theme(2, '#29b6f6', '#0277bd', '新品上市', '本周上新 抢先尝鲜', 6)
    gen_theme(3, '#ec407a', '#ad1457', '特惠专区', '高性价比 闭眼囤', 1)
    print('生成头像/分类图标/logo...')
    av_colors = ['#ef5350', '#42a5f5', '#66bb6a', '#ffca28', '#ab47bc', '#26a69a']
    for i, c in enumerate(av_colors, 1):
        gen_avatar(i, c)
    for i in range(1, 9):
        c1, c2 = PALETTE[i]
        gen_category(i, i, CAT_NAMES[i], c1, c2)
    gen_logo()
    print('生成默认图与空态图...')
    gen_default()
    gen_empties()
    print('生成视频帧...')
    gen_video_frames()
    print('图片资源完成。')
