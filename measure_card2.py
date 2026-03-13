from PIL import Image

img = Image.open("/tmp/file_attachments/Dream it , Build it!.png")
w, h = img.size

# Let's crop the free card and scale it down to see how it compares to our CSS
crop = img.crop((100, h - 300, w - 100, h - 100))
print(f"Card crop size: {crop.size}")
