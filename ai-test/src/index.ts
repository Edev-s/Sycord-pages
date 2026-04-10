import 'dotenv/config';
import { streamText } from 'ai';

async function main() {
  const apiKey = process.env.AI_GATEWAY_API_KEY;

  if (!apiKey) {
    console.error('Error: AI_GATEWAY_API_KEY environment variable is not set');
    process.exit(1);
  }

  console.log('Starting AI Gateway text generation test...\n');

  try {
    const result = await streamText({
      model: 'alibaba/qwen3-coder',
      prompt: 'Explain what the AI SDK is and why it is useful in 2-3 sentences.',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    console.log('Stream output:\n');

    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    for await (const chunk of result.textStream) {
      process.stdout.write(chunk);
    }

    console.log('\n');

    const finalResult = await result.finishPromise;
    totalInputTokens = finalResult.usage?.promptTokens || 0;
    totalOutputTokens = finalResult.usage?.completionTokens || 0;

    console.log('\n--- Token Usage ---');
    console.log(`Input tokens: ${totalInputTokens}`);
    console.log(`Output tokens: ${totalOutputTokens}`);
    console.log(`Total tokens: ${totalInputTokens + totalOutputTokens}`);
    console.log('--- Test Complete ---');
  } catch (error) {
    console.error('Error during streaming:', error);
    process.exit(1);
  }
}

main();
