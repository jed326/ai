import { asSchema, safeValidateTypes } from '@ai-sdk/provider-utils';
import { describe, expect, it } from 'vitest';
import { takoContents } from './tako-contents';

describe('takoContents', () => {
  it('creates a provider-executed Tako Contents tool', () => {
    expect(
      takoContents({
        mode: 'url',
        contentFormat: 'csv',
        maxRows: 500,
      }),
    ).toMatchObject({
      type: 'provider',
      id: 'gateway.tako_contents',
      args: {
        mode: 'url',
        contentFormat: 'csv',
        maxRows: 500,
      },
      isProviderExecuted: true,
    });
  });

  it('describes all Tako Contents API inputs', async () => {
    const inputSchema = await asSchema(takoContents().inputSchema).jsonSchema;

    expect(inputSchema).toMatchObject({
      required: ['url'],
      properties: {
        url: { type: 'string' },
        mode: { enum: ['inline', 'url'] },
        content_format: {
          enum: ['card_json', 'csv', 'json_compact', 'json_records'],
        },
        max_rows: {
          type: 'number',
          description: expect.stringContaining('per 1,000 exported rows'),
        },
        offset: { type: 'number' },
        max_chars: { type: 'number' },
        highlights: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            max_characters: { type: 'number' },
          },
        },
      },
    });
  });

  it('validates inline card rows', async () => {
    const result = await safeValidateTypes({
      value: {
        request_id: 'contents-1',
        contents: [
          {
            source_url: 'https://tako.com/card/abc/',
            description: 'Intel quarterly revenue since 2020.',
            content_format: 'csv',
            cost: 0.021,
            data: 'Timestamp,Revenue\n2025-12-31 00:00:00+00:00,13.7',
            total_rows: 1,
            truncated: false,
            offset: 0,
          },
        ],
        usage: {
          total_cost_usd: 0.021,
          data: { cost_usd: 0.021, datasets: 1 },
        },
      },
      schema: asSchema(takoContents().outputSchema),
    });

    expect(result.success).toBe(true);
  });

  it('validates a card download link', async () => {
    const result = await safeValidateTypes({
      value: {
        request_id: 'contents-2',
        contents: [
          {
            source_url: 'https://tako.com/card/abc/',
            content_format: 'csv',
            cost: 0.05,
            url: 'https://downloads.tako.com/exports/abc.csv?signature=xyz',
            expires_at: '2026-10-26T18:30:00Z',
            total_rows: 12000,
            truncated: false,
          },
        ],
      },
      schema: asSchema(takoContents().outputSchema),
    });

    expect(result.success).toBe(true);
  });

  it('validates extracted web page text', async () => {
    const result = await safeValidateTypes({
      value: {
        request_id: 'contents-3',
        contents: [
          {
            source_url: 'https://example.com/article',
            description: null,
            cost: 0.001,
            data: 'Example Domain\n\nThis domain is for use in examples.',
            truncated: false,
          },
        ],
      },
      schema: asSchema(takoContents().outputSchema),
    });

    expect(result.success).toBe(true);
  });

  it('validates a Tako Contents API error response', async () => {
    const result = await safeValidateTypes({
      value: {
        error: 'invalid_input',
        statusCode: 422,
        message: 'This card type does not support card_json.',
      },
      schema: asSchema(takoContents().outputSchema),
    });

    expect(result.success).toBe(true);
  });

  it('rejects a content item missing source_url', async () => {
    const result = await safeValidateTypes({
      value: {
        request_id: 'contents-4',
        contents: [{ content_format: 'csv', data: 'a,b\n1,2' }],
      },
      schema: asSchema(takoContents().outputSchema),
    });

    expect(result.success).toBe(false);
  });
});
