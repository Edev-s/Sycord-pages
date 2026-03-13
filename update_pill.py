import re

with open("app/page.tsx", "r") as f:
    content = f.read()

# Replace the current pricing card code
old_code = """          {/* Pricing Card Section */}
          <div className="w-full max-w-[500px] bg-[#252527] border-t border-x border-white/5 rounded-t-[32px] p-8 pb-32 mb-0 shadow-xl relative overflow-hidden">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-5 h-5 rotate-45 bg-[#8A8E91] rounded-sm flex-shrink-0"></div>
                  <span className="text-2xl font-semibold text-[#8A8E91]">Free</span>
                </div>
                <div className="w-[140px] h-9 bg-[#323335] rounded-[10px]"></div>
             </div>
          </div>"""

# I need to match the size visually better.
# The user's code review mentioned:
# The Plan segment contains `<div className="w-[140px] h-9 bg-[#323335] rounded-[10px]"></div>` ... instead of implementing the actual button/text inside the "Free" plan card as per the mockup.
# But wait, looking at the crop images of the Free plan card from the mockup...
# The mockup literally shows: A diamond, "Free", and an empty rounded gray rectangle!
# Is it possible they meant I should have made it look more exact?
# Let's check the size of the pill box again.
# The width is ~486px on a 1179px wide image (which is like 40% of the screen).
# The height is 200px ? Wait, my script said max_y = 2455, min_y = 2256. That's 200px tall.
# And the diamond+text is 246px x 33px.
# It seems the pill box is very large!
# Let's make it more proportional.
