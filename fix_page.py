import re

with open("app/page.tsx", "r") as f:
    content = f.read()

# Replace the pricing card section
# The old design has it: max-w-[500px]
# The actual card is 957px wide on a 1179px image (81% width).
# For max-w-7xl (1280px), 81% is around 1036px.
# Currently max-w-3xl is 768px.
# The card contains a big empty pill.
# Pill width: 486px on 1179px image (41% width).
# Pill height: 200px on 2556px image. Wait, the card height is 449px. 200px is almost half the card.
# Oh, the "pill box" is actually another box INSIDE the card.
# The pill bounding box I measured earlier was: (589, 2256) to (1074, 2455) (Size: 486 x 200)
# But my code measured card bounding box: (118, 2107) to (1074, 2555) (Size: 957 x 449)
# Note that max_x of card (1074) is exactly max_x of pill!
# This means the "pill" is actually NOT a pill, it's just the right side of the card, and they have the same color!
# There is NO pill! The image `free_card_full.png` had an empty pill inside because the mockup HAS an empty pill inside.

new_card = """          {/* Pricing Card Section */}
          <div className="w-full bg-[#323335] rounded-t-[40px] p-8 md:p-12 h-[220px] shadow-2xl relative overflow-hidden flex flex-col justify-start">
             <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-6">
                  <div className="w-10 h-10 rotate-45 bg-[#8A8E91] rounded-lg flex-shrink-0"></div>
                  <span className="text-4xl md:text-[40px] font-bold text-[#8A8E91] tracking-tight ml-2">Free</span>
                </div>
                <div className="w-[140px] h-[50px] md:w-[320px] md:h-[80px] bg-[#464749] rounded-2xl md:rounded-3xl"></div>
             </div>
          </div>"""

content = re.sub(
    r'\{\/\* Pricing Card Section \*\/\}.*?<\/div>\n\s*<\/div>',
    new_card,
    content,
    flags=re.DOTALL
)

with open("app/page.tsx", "w") as f:
    f.write(content)
