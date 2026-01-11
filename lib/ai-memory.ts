export const FILE_STRUCTURE = `
project/
├── index.html          # Main HTML entry (MUST be in ROOT)
├── src/
│   ├── main.ts         # App entry point, imports all components
│   ├── style.css       # Global styles, animations, custom CSS
│   ├── utils.ts        # Shared utility functions
│   └── components/
│       ├── header.ts   # Navigation, logo, mobile menu
│       ├── hero.ts     # Hero section with CTA
│       ├── features.ts # Features/services grid
│       ├── testimonials.ts # Social proof section
│       └── footer.ts   # Footer with links
├── public/             # Static assets (images, favicon)
├── package.json        # npm dependencies
├── tsconfig.json       # TypeScript config
├── vite.config.ts      # Vite build config
├── .gitignore          # Ignored files
└── README.md           # Documentation
`;

export function getShortTermMemory(instruction: string) {
  // Parse instructions to find completed tasks and files
  const completedTasks: { filename: string; description: string }[] = [];
  const taskRegex = /\[Done\]\s*([^\s:]+)\s*:\s*(?:\[usedfor\](.*?)\[usedfor\])?/g;
  let match;
  while ((match = taskRegex.exec(instruction)) !== null) {
      completedTasks.push({
          filename: match[1].trim(),
          description: match[2]?.trim() || "Implementation"
      });
  }

  if (completedTasks.length === 0) return "No files generated yet. Start fresh.";

  return `
**ALREADY GENERATED FILES (Reference these for consistency):**
${completedTasks.map(t => `- ${t.filename}: ${t.description}`).join('\n')}

**IMPORTANT:** 
- Maintain consistent styling with existing files
- Use the same color palette and design patterns
- Reference utility functions from src/utils.ts if already created
- Ensure imports match existing file structure
`;
}
