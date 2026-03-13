from PIL import Image

img = Image.open("/tmp/file_attachments/Dream it , Build it!.png")
w, h = img.size

y = h - 250
min_x, max_x = w, 0
for x in range(w):
    r,g,b = img.getpixel((x, y))[:3]
    if r > 40 and r < 60 and g > 40 and g < 60 and b > 40 and b < 60: # (50,51,53)
        if x < min_x: min_x = x
        if x > max_x: max_x = x

print(f"Card width: {max_x - min_x + 1} px, {min_x} to {max_x}")

min_y, max_y = h, 0
x_mid = w // 2
for y in range(h - 500, h):
    r,g,b = img.getpixel((x_mid, y))[:3]
    if r > 40 and r < 60 and g > 40 and g < 60 and b > 40 and b < 60: # (50,51,53)
        if y < min_y: min_y = y
        if y > max_y: max_y = y

print(f"Card height: {max_y - min_y + 1} px, {min_y} to {max_y}")
