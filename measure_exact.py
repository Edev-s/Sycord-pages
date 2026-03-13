from PIL import Image

img = Image.open("/tmp/file_attachments/Dream it , Build it! - 2.png")
# Let's crop the bottom half and save it to see what's actually there
w, h = img.size
crop = img.crop((0, h//2, w, h))
crop.save("mockup2_bottom.png")
