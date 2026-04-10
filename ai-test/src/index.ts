import 'dotenv/config';
import { streamText } from 'ai';

async function main() {
  if (!process.env.AI_GATEWAY_API_KEY) {
    console.error('Error: AI_GATEWAY_API_KEY environment variable is not set');
    process.exit(1);
  }

  console.log('Starting AI Gateway text generation test...\n');

  try {
    const result = await streamText({
      model: 'alibaba/qwen3-coder',
      prompt: 'Explain what the AI SDK is and why it is useful in 2-3 sentences.',
    });

    console.log('Stream output:\n');

    for await (const chunk of result.textStream) {
      process.stdout.write(chunk);
    }

    console.log('\n');

    const finalResult = await result.finishPromise;
    const inputTokens = finalResult.usage?.promptTokens || 0;
    const outputTokens = finalResult.usage?.completionTokens || 0;

    console.log('\n--- Token Usage ---');
    console.log(`Input tokens: ${inputTokens}`);
    console.log(`Output tokens: ${outputTokens}`);
    console.log(`Total tokens: ${inputTokens + outputTokens}`);
    console.log('--- Test Complete ---');
  } catch (error) {
    console.error('Error during streaming:', error);
    process.exit(1);
  }
}

main();
