from PIL import Image

img = Image.open("/tmp/file_attachments/Dream it , Build it!.png")
w, h = img.size

# The pill is on the right side of the card.
# The card background is (37, 37, 39) or so. The pill is (50, 51, 53)
# Let's find the bounding box of the pill.
y_start = h - 300
y_end = h - 100
x_start = w // 2
x_end = w - 100

min_x, max_x = w, 0
min_y, max_y = h, 0

for y in range(y_start, y_end):
    for x in range(x_start, x_end):
        r, g, b = img.getpixel((x, y))[:3]
        if abs(r - 50) < 5 and abs(g - 51) < 5 and abs(b - 53) < 5:
            if x < min_x: min_x = x
            if x > max_x: max_x = x
            if y < min_y: min_y = y
            if y > max_y: max_y = y

print(f"Pill box bounding box: ({min_x}, {min_y}) to ({max_x}, {max_y})")
if max_x > min_x:
    print(f"Pill box size: {max_x - min_x + 1} x {max_y - min_y + 1}")
