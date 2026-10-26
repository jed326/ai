import { writeFile } from 'node:fs/promises';
import { gateway, generateText, isStepCount } from 'ai';
import 'dotenv/config';

async function main() {
  const result = await generateText({
    model: 'openai/gpt-5.4-nano',
    prompt:
      'Find a Tako card for US monthly unemployment since 1990 and export its full data.',
    tools: {
      tako_search: gateway.tools.takoSearch(),
      tako_contents: gateway.tools.takoContents({
        mode: 'url',
        contentFormat: 'csv',
      }),
    },
    stopWhen: isStepCount(3),
  });

  for (const toolResult of result.steps.flatMap(step => step.toolResults)) {
    if (toolResult.dynamic || toolResult.toolName !== 'tako_contents') continue;

    const { output } = toolResult;
    if ('error' in output) {
      console.log('Tako Contents error:', output.message);
      continue;
    }

    for (const item of output.contents) {
      if (!item.url) continue;

      const response = await fetch(item.url);
      const path = `tako-${output.request_id}.csv`;
      await writeFile(path, await response.text());
      console.log(
        `Saved ${item.total_rows} rows from ${item.source_url} to ${path}`,
      );
    }
  }

  console.log();
  console.log('Text:', result.text);
  console.log('Token usage:', result.usage);
}

main().catch(console.error);
