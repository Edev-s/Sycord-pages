fetch("http://localhost:3000/api/ai/generate-website", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    messages: [{role: "user", content: "hello"}],
    instruction: "[1] main.ts",
    model: "alibaba/qwen3-coder"
  })
}).then(res => res.json()).then(console.log).catch(console.error);
