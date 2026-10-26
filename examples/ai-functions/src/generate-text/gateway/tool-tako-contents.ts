import { gateway, generateText, isStepCount } from 'ai';
import 'dotenv/config';

async function main() {
  const result = await generateText({
    model: 'openai/gpt-5.4-nano',
    prompt:
      'Find a Tako card for Nvidia quarterly revenue, fetch its rows, and report the largest quarter-over-quarter increase.',
    tools: {
      tako_search: gateway.tools.takoSearch(),
      tako_contents: gateway.tools.takoContents(),
    },
    stopWhen: isStepCount(5),
  });

  console.log('Text:', result.text);
  console.log();
  for (const step of result.steps) {
    console.log('Tool calls:', JSON.stringify(step.toolCalls, null, 2));
  }
}

main().catch(console.error);
