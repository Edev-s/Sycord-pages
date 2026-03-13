from PIL import Image

img = Image.open("/tmp/file_attachments/Dream it , Build it!.png")
w, h = img.size
y = h - 250
for x in range(w):
    r,g,b = img.getpixel((x, y))[:3]
    if r > 30 and r < 40 and g > 30 and g < 40:
        print(f"Found card pixel at x={x}, color=({r},{g},{b})")
