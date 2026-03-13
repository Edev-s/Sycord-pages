with open("app/page.tsx", "r") as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if "Pricing Card Section" in line:
        skip = True
        new_lines.append("          {/* Pricing Card Section */}\n")
        new_lines.append('          <div className="w-full max-w-4xl bg-[#252527] border-t border-x border-white/5 rounded-t-[40px] p-8 md:p-12 pb-32 mb-0 shadow-2xl relative overflow-hidden">\n')
        new_lines.append('             <div className="flex items-center justify-between">\n')
        new_lines.append('                <div className="flex items-center gap-6">\n')
        new_lines.append('                  <div className="w-8 h-8 rotate-45 bg-[#8A8E91] rounded-lg flex-shrink-0"></div>\n')
        new_lines.append('                  <span className="text-4xl font-bold text-[#8A8E91] tracking-tight">Free</span>\n')
        new_lines.append('                </div>\n')
        new_lines.append('                <div className="w-[180px] h-[52px] md:w-[320px] md:h-[80px] bg-[#323335] rounded-3xl"></div>\n')
        new_lines.append('             </div>\n')
        new_lines.append('          </div>\n')
        continue
    if skip and "</div>" in line and "</main>" in new_lines[-1] == False:
        pass # need to find end
