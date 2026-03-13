from PIL import Image

img1 = Image.open("/tmp/file_attachments/Dream it , Build it!.png")
img2 = Image.open("/tmp/file_attachments/Dream it , Build it! - 2.png")

# Let's find the bounding box of the phone in img1.
# The background is (24, 25, 27). We look for pixels that are NOT the background.
# We will focus on the right side of the image (x > 600) and top half (y > 400).

w, h = img1.size
bg = (24, 25, 27)

min_x, max_x = w, 0
min_y, max_y = h, 0

for y in range(h):
    for x in range(600, w):
        p = img1.getpixel((x, y))[:3]
        if abs(p[0] - bg[0]) > 5 or abs(p[1] - bg[1]) > 5 or abs(p[2] - bg[2]) > 5:
            # Check if it's the phone (not text)
            # The phone is quite large. Let's just assume anything non-bg on the right is phone
            # We skip x < 650 to avoid text.
            if x > 700:
                if x < min_x: min_x = x
                if x > max_x: max_x = x
                if y < min_y: min_y = y
                if y > max_y: max_y = y

print(f"Phone bounding box in img1: ({min_x}, {min_y}) to ({max_x}, {max_y})")
print(f"Phone size in img1: {max_x - min_x} x {max_y - min_y}")

# Let's do the same for img2 (the phone image)
w2, h2 = img2.size
bg2 = img2.getpixel((10, 10))[:3]
min_x2, max_x2 = w2, 0
min_y2, max_y2 = h2, 0
for y in range(h2):
    for x in range(w2):
        p = img2.getpixel((x, y))[:3]
        if abs(p[0] - bg2[0]) > 5 or abs(p[1] - bg2[1]) > 5 or abs(p[2] - bg2[2]) > 5:
            if x < min_x2: min_x2 = x
            if x > max_x2: max_x2 = x
            if y < min_y2: min_y2 = y
            if y > max_y2: max_y2 = y

print(f"Phone bounding box in img2: ({min_x2}, {min_y2}) to ({max_x2}, {max_y2})")
print(f"Phone size in img2: {max_x2 - min_x2} x {max_y2 - min_y2}")
