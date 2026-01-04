export const FILE_STRUCTURE = `
project/
├── src/
│   ├── main.ts
│   ├── utils.ts
│   ├── style.css
│   └── components/
│       ├── header.ts
│       └── footer.ts
├── public/
│   └── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .gitignore
└── README.md
`;

export function getShortTermMemory(instruction: string) {
  // Parse instructions to find completed tasks and files
  const completedTasks = [];
  const taskRegex = /\[Done\]\s*([^\s:]+)\s*:\s*(?:\[usedfor\](.*?)\[usedfor\])?/g;
  let match;
  while ((match = taskRegex.exec(instruction)) !== null) {
      completedTasks.push({
          filename: match[1].trim(),
          description: match[2]?.trim() || "No description provided"
      });
  }

  if (completedTasks.length === 0) return "No files generated yet.";

  return `
  ALREADY GENERATED FILES:
  ${completedTasks.map(t => `- ${t.filename}: ${t.description}`).join('\n')}
  `;
}
