#!/usr/bin/env python3
"""
Generates every raster asset the watch face needs, so no binary blob in this
repo is unexplained. Run from the repo root:

    python3 tools/generate_assets.py

Outputs:
    watchface/src/main/res/drawable/ic_*.png      48x48 white glyphs (tinted at runtime)
    watchface/src/main/res/drawable-nodpi/preview.png   450x450 store/picker preview

Glyphs are drawn white with an alpha channel and recoloured in watchface.xml via
`tintColor` / BitmapFont `color`, so one asset serves every accent colour.
Everything is drawn at 4x and downsampled for antialiasing.
"""
import math
import os

from PIL import Image, ImageDraw, ImageFont

SS = 4                      # supersample factor
ICON = 48                   # icon edge, in watch-face units
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
RES = os.path.join(ROOT, "watchface", "src", "main", "res")
DRAWABLE = os.path.join(RES, "drawable")
NODPI = os.path.join(RES, "drawable-nodpi")
FONT_DIR = os.path.join(RES, "font")

WHITE = (255, 255, 255, 255)


def canvas(size=ICON):
    img = Image.new("RGBA", (size * SS, size * SS), (0, 0, 0, 0))
    return img, ImageDraw.Draw(img)


def s(*vals):
    """Scale watch-face units to supersampled pixels."""
    return [v * SS for v in vals]


def circle(d, cx, cy, r, fill=WHITE, width=0, outline=None):
    box = s(cx - r, cy - r, cx + r, cy + r)
    if width:
        d.ellipse(box, outline=outline or WHITE, width=int(width * SS))
    else:
        d.ellipse(box, fill=fill)


def poly(d, pts, fill=WHITE):
    d.polygon([(x * SS, y * SS) for x, y in pts], fill=fill)


def line(d, x1, y1, x2, y2, width, fill=WHITE, cap=True):
    d.line(s(x1, y1, x2, y2), fill=fill, width=int(width * SS))
    if cap:  # round the ends; PIL has no line cap option
        r = width / 2.0
        circle(d, x1, y1, r, fill)
        circle(d, x2, y2, r, fill)


def save(img, name, folder=DRAWABLE, size=ICON):
    img = img.resize((size, size), Image.LANCZOS)
    img.save(os.path.join(folder, name + ".png"))
    return img


# ---------------------------------------------------------------- status icons

def battery():
    img, d = canvas()
    d.rounded_rectangle(s(3, 15, 38, 33), radius=3 * SS, outline=WHITE, width=int(2.5 * SS))
    d.rounded_rectangle(s(39, 20, 45, 28), radius=1.5 * SS, fill=WHITE)
    d.rounded_rectangle(s(7, 19, 34, 29), radius=1.5 * SS, fill=WHITE)
    return save(img, "ic_battery")


def heart():
    img, d = canvas()
    circle(d, 14.5, 17, 9.5)
    circle(d, 33.5, 17, 9.5)
    poly(d, [(5.5, 19.5), (42.5, 19.5), (24, 42)])
    return save(img, "ic_heart")


def mountain():
    img, d = canvas()
    poly(d, [(2, 40), (17, 13), (26, 29), (32, 20), (46, 40)])
    return save(img, "ic_mountain")


# --------------------------------------------------------------- weather parts

def _cloud(d, cx=24.0, cy=30.0, scale=1.0):
    def p(v):
        return v * scale
    circle(d, cx - p(8), cy, p(8))
    circle(d, cx + p(8), cy, p(7))
    circle(d, cx - p(1), cy - p(7), p(10))
    d.rectangle(s(cx - p(8), cy, cx + p(8), cy + p(8)), fill=WHITE)


def _sun(d, cx=24.0, cy=24.0, r=9.0, ray_len=6.0, ray_w=3.0):
    circle(d, cx, cy, r)
    for i in range(8):
        a = math.radians(i * 45)
        x1 = cx + math.cos(a) * (r + 2.5)
        y1 = cy + math.sin(a) * (r + 2.5)
        x2 = cx + math.cos(a) * (r + 2.5 + ray_len)
        y2 = cy + math.sin(a) * (r + 2.5 + ray_len)
        line(d, x1, y1, x2, y2, ray_w)


def _moon(cx=25.0, cy=23.0, r=13.0):
    """Crescent: a disc with an offset disc punched out."""
    tmp, td = canvas()
    circle(td, cx, cy, r)
    cut = Image.new("RGBA", tmp.size, (0, 0, 0, 0))
    ImageDraw.Draw(cut).ellipse(s(cx + 1 - r, cy - 5 - r, cx + 1 + r, cy - 5 + r), fill=WHITE)
    tmp.paste((0, 0, 0, 0), (0, 0), cut)
    return tmp


def _drops(d, count, y0=36.0, length=7.0, width=3.0):
    xs = [12, 20.5, 29, 37.5][:count]
    for i, x in enumerate(xs):
        off = 0 if i % 2 == 0 else 2.5
        line(d, x, y0 + off, x - 3, y0 + off + length, width)


def _flakes(d, count, y0=39.0, r=3.6, width=2.2):
    xs = [12, 20.5, 29, 37.5][:count]
    for i, x in enumerate(xs):
        y = y0 + (0 if i % 2 == 0 else 2.5)
        for a in (0, 60, 120):
            rad = math.radians(a)
            line(d, x - math.cos(rad) * r, y - math.sin(rad) * r,
                 x + math.cos(rad) * r, y + math.sin(rad) * r, width)


def weather_icons():
    # unknown
    img, d = canvas()
    circle(d, 24, 24, 17, width=3)
    d.rectangle(s(22, 15, 26, 27), fill=WHITE)
    circle(d, 24, 32, 2.4)
    save(img, "ic_unknown")

    # clear (night)
    save(_moon(), "ic_clear")

    # sunny (day)
    img, d = canvas()
    _sun(d)
    save(img, "ic_sunny")

    # cloudy
    img, d = canvas()
    _cloud(d, cy=27)
    save(img, "ic_cloudy")

    # partly cloudy, day
    img, d = canvas()
    _sun(d, cx=18, cy=17, r=6.5, ray_len=4.5, ray_w=2.4)
    _cloud(d, cx=27, cy=31, scale=0.85)
    save(img, "ic_partly_cloudy_day")

    # partly cloudy, night
    img = _moon(cx=19, cy=17, r=9.5)
    d = ImageDraw.Draw(img)
    _cloud(d, cx=27, cy=31, scale=0.85)
    save(img, "ic_partly_cloudy_night")

    # rain / heavy rain
    for name, n, ln in (("ic_rain", 3, 7), ("ic_heavy_rain", 4, 9)):
        img, d = canvas()
        _cloud(d, cy=24, scale=0.92)
        _drops(d, n, y0=33, length=ln)
        save(img, name)

    # snow / heavy snow
    for name, n in (("ic_snow", 3), ("ic_heavy_snow", 4)):
        img, d = canvas()
        _cloud(d, cy=23, scale=0.92)
        _flakes(d, n, y0=37)
        save(img, name)

    # sleet: one drop, one flake
    img, d = canvas()
    _cloud(d, cy=23, scale=0.92)
    _drops(d, 1, y0=33)
    _flakes(d, 1, y0=37)
    line(d, 33, 34, 30, 42, 3)
    save(img, "ic_sleet")

    # thunderstorm
    img, d = canvas()
    _cloud(d, cy=22, scale=0.92)
    poly(d, [(26, 31), (16, 43), (22.5, 43), (19, 47.5), (31, 35), (24, 35)])
    save(img, "ic_thunderstorm")

    # fog / mist
    for name, widths, w in (("ic_fog", [(6, 42), (9, 39), (6, 42), (12, 36)], 3.2),
                            ("ic_mist", [(9, 39), (6, 42), (11, 37)], 2.6)):
        img, d = canvas()
        step = 40.0 / (len(widths) + 1)
        for i, (x1, x2) in enumerate(widths):
            y = 12 + step * i
            line(d, x1, y, x2, y, w)
        save(img, name)

    # windy: three gusts, each curling up at its tail
    img, d = canvas()
    for y, x2 in ((16, 30), (24, 36), (32, 27)):
        line(d, 6, y, x2, y, 3.2)
        d.arc(s(x2 - 5, y - 10, x2 + 5, y), start=0, end=270,
              fill=WHITE, width=int(3.2 * SS))
    save(img, "ic_windy")


# -------------------------------------------------------------------- preview

PALETTE = {
    "bg": (0, 0, 0, 255),
    "lime": (181, 255, 41, 255),
    "lime_dim": (122, 168, 28, 255),
    "ghost": (16, 42, 8, 255),
    "amber": (242, 193, 78, 255),
    "white": (232, 232, 232, 255),
    "grey": (138, 138, 138, 255),
    "divider": (58, 58, 58, 255),
    "lcd": (10, 20, 8, 255),
    "badge": (29, 61, 5, 255),
}


def preview():
    """Renders the same layout watchface.xml describes, at 450x450."""
    W = 450
    img = Image.new("RGBA", (W * SS, W * SS), PALETTE["bg"])
    d = ImageDraw.Draw(img)

    def font(path, size):
        return ImageFont.truetype(os.path.join(FONT_DIR, path), int(size * SS))

    def sysfont(size, bold=False):
        for c in ("DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf",
                  "LiberationSans-Bold.ttf" if bold else "LiberationSans-Regular.ttf"):
            for base in ("/usr/share/fonts/truetype/dejavu", "/usr/share/fonts/truetype/liberation",
                         "/usr/share/fonts/TTF", "/usr/share/fonts"):
                p = os.path.join(base, c)
                if os.path.exists(p):
                    return ImageFont.truetype(p, int(size * SS))
        return ImageFont.load_default()

    def text(x, y, msg, f, fill, anchor="la"):
        d.text((x * SS, y * SS), msg, font=f, fill=fill, anchor=anchor)

    def paste_icon(name, x, y, size, color):
        ic = Image.open(os.path.join(DRAWABLE, name + ".png")).convert("RGBA")
        ic = ic.resize((int(size * SS), int(size * SS)), Image.LANCZOS)
        tint = Image.new("RGBA", ic.size, color)
        tint.putalpha(ic.getchannel("A"))
        img.alpha_composite(tint, (int(x * SS), int(y * SS)))

    # --- top status stack
    rows = [("ic_battery", "100%", 64), ("ic_heart", "68", 108)]
    for name, val, y in rows:
        paste_icon(name, 112, y + 1, 34, PALETTE["amber"])
        text(158, y + 2, val, sysfont(30, True), PALETTE["lime"])
    paste_icon("ic_partly_cloudy_day", 110, 151, 38, PALETTE["amber"])
    text(158, 154, "32°", sysfont(30, True), PALETTE["lime"])

    # --- slanted dividers
    for x1, y1, x2, y2 in ((70, 103, 248, 97), (76, 147, 248, 141), (60, 191, 248, 185)):
        d.line(s(x1, y1, x2, y2), fill=PALETTE["divider"], width=int(1.5 * SS))
    d.line(s(254, 56, 264, 212), fill=PALETTE["divider"], width=int(1.5 * SS))

    # --- weekday strip, Sunday first, Wednesday highlighted (DAY_OF_WEEK == 4)
    letters = ["S", "M", "T", "W", "T", "F", "S"]
    today = 4
    for i, ch in enumerate(letters):
        y = 58 + i * 20
        on = (i + 1) == today
        if on:
            d.rectangle(s(268, y, 296, y + 19), fill=PALETTE["lime"])
        text(282, y + 9, ch, sysfont(15, on), PALETTE["bg"] if on else PALETTE["white"], anchor="mm")

    # --- date badge
    d.ellipse(s(297, 105, 379, 187), fill=PALETTE["badge"], outline=PALETTE["lime"], width=int(3 * SS))
    text(338, 133, "AUG", sysfont(23, True), PALETTE["lime"], anchor="mm")
    text(338, 161, "1", sysfont(27, True), PALETTE["lime"], anchor="mm")

    # --- LCD panel + time
    d.rounded_rectangle(s(20, 196, 430, 288), radius=8 * SS,
                        fill=PALETTE["lcd"], outline=(36, 44, 32, 255), width=int(1.5 * SS))
    big = font("dseg7_bold.ttf", 68)
    text(30, 208, "88:88", big, PALETTE["ghost"])
    text(30, 208, "12:17", big, PALETTE["lime"])
    small = font("dseg7_bold.ttf", 26)
    text(392, 210, "88", small, PALETTE["ghost"], anchor="ma")
    text(392, 210, "38", small, PALETTE["lime"], anchor="ma")
    paste_icon("ic_mountain", 378, 245, 28, PALETTE["lime"])

    # --- ZULU + complication row
    d.line(s(225, 300, 225, 336), fill=PALETTE["divider"], width=int(1.5 * SS))
    text(46, 305, "ZULU", sysfont(21), PALETTE["amber"])
    text(112, 302, "1510", sysfont(26, True), PALETTE["white"])
    paste_icon("ic_mountain", 246, 304, 26, PALETTE["amber"])
    text(284, 302, "3130", sysfont(26, True), PALETTE["white"])

    # --- bottom complication row
    d.line(s(120, 344, 330, 344), fill=PALETTE["divider"], width=int(1.5 * SS))
    text(150, 352, "0556", sysfont(23, True), PALETTE["white"])
    paste_icon("ic_sunny", 214, 350, 24, PALETTE["amber"])
    text(250, 352, "2047", sysfont(23, True), PALETTE["white"])

    # --- mask to the round display
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).ellipse((0, 0, W * SS - 1, W * SS - 1), fill=255)
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    out.resize((W, W), Image.LANCZOS).convert("RGB").save(os.path.join(NODPI, "preview.png"))


if __name__ == "__main__":
    for folder in (DRAWABLE, NODPI):
        os.makedirs(folder, exist_ok=True)
    battery()
    heart()
    mountain()
    weather_icons()
    preview()
    print("assets written to", RES)
