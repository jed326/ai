import {
  createProviderExecutedToolFactory,
  lazySchema,
  zodSchema,
} from '@ai-sdk/provider-utils';
import { z } from '../zod';
import {
  takoResultContentSchema,
  type TakoContentFormat,
  type TakoResultContent,
  type TakoSearchError,
} from './tako-search';

export type TakoContentsMode = 'inline' | 'url';

export interface TakoContentsConfig {
  /**
   * Delivery mode. `inline` returns the content in the tool result. `url`
   * returns a signed download link that expires after a few minutes, for an
   * application that saves the content to a file instead of passing it to the
   * model.
   */
  mode?: TakoContentsMode;
  /** Serialization for Tako card data. Web pages always return text. */
  contentFormat?: TakoContentFormat;
  /**
   * Maximum card rows to return. A data surcharge applies per 1,000 exported
   * rows; lower values reduce cost. Web pages ignore it.
   */
  maxRows?: number;
  /** Maximum characters of extracted web page text. Tako cards ignore it. */
  maxChars?: number;
  /**
   * Reveal a card's premium cells and bill them. Premium cells are withheld
   * by default. The export then charges
   * `content.export_pricing.premium_row_cpm_usd` per 1,000 premium records on
   * top of the row rate. `card_json` rejects it, and web pages ignore it.
   */
  premium?: boolean;
}

export interface TakoContentsInput {
  url: string;
  mode?: TakoContentsMode;
  content_format?: TakoContentFormat;
  max_rows?: number;
  offset?: number;
  max_chars?: number;
  highlights?: {
    query?: string;
    max_characters?: number;
  };
  premium?: boolean;
  quote_only?: boolean;
}

export interface TakoContentItem extends TakoResultContent {
  source_url: string;
  description?: string | null;
  offset?: number | null;
  premium?: boolean;
  redacted_cells?: Record<string, number[]> | null;
}

export interface TakoContentsResponse {
  request_id: string;
  contents: TakoContentItem[];
  usage?: {
    total_cost_usd: number;
    compute?: {
      cost_usd: number;
    } | null;
    data?: {
      cost_usd: number;
      datasets: number;
    } | null;
    variable_cost?: {
      cost_usd: number;
    } | null;
  } | null;
}

export type TakoContentsOutput = TakoSearchError | TakoContentsResponse;

const takoContentsInputSchema = lazySchema(() =>
  zodSchema(
    z.object({
      url: z
        .string()
        .describe(
          "The result to fetch: a Tako card's webpage_url or a web result's url, usually from Tako Search. A card URL returns the card's data, and any other URL returns the page's extracted text.",
        ),
      mode: z
        .enum(['inline', 'url'])
        .optional()
        .describe(
          'Delivery mode. inline returns the content in the result. url returns a signed download link that expires after a few minutes; use it only when the application saves the content to a file.',
        ),
      content_format: z
        .enum(['card_json', 'csv', 'json_compact', 'json_records'])
        .optional()
        .describe(
          "Serialization for Tako card data. card_json returns the card's own structure, and not every card type supports it. Web pages always return text.",
        ),
      max_rows: z
        .number()
        .optional()
        .describe(
          "Maximum card rows to return. A card with a date column keeps its newest rows. A data surcharge applies per 1,000 exported rows; lower values reduce cost. Omit it to use the allowance in the card's content.export_pricing. Web pages ignore it.",
        ),
      offset: z
        .number()
        .optional()
        .describe(
          'Card rows to skip before the export starts. Use it with max_rows to page through a long list. Cards with a date column, sports cards, and card_json reject an offset above 0. Web pages ignore it.',
        ),
      max_chars: z
        .number()
        .optional()
        .describe(
          'Maximum characters of extracted web page text. Omit it to return the whole page. Tako cards ignore it.',
        ),
      highlights: z
        .object({
          query: z
            .string()
            .optional()
            .describe('The question the passages should answer.'),
          max_characters: z
            .number()
            .optional()
            .describe(
              'Total characters across the returned passages (100-20,000). Defaults to 4,000.',
            ),
        })
        .optional()
        .describe(
          'Return only the passages of a web page that answer query, instead of its full text. Tako cards reject it.',
        ),
      premium: z
        .boolean()
        .optional()
        .describe(
          "Reveal a card's premium cells and bill them. Premium cells are withheld by default: a withheld cell reads [premium: withheld] in CSV and is null in JSON formats. The export then charges content.export_pricing.premium_row_cpm_usd per 1,000 premium records on top of the row rate; content.premium_rows counts those records. card_json rejects it, and web pages ignore it.",
        ),
      quote_only: z
        .boolean()
        .optional()
        .describe(
          'Return only the price of the export, without fetching content or charging for it. The item then carries cost and export_pricing, and its payload and url fields are null. Use it to check the cost of a large or premium export before requesting it.',
        ),
    }),
  ),
);

const takoContentsOutputSchema = lazySchema(() =>
  zodSchema(
    z.union([
      z
        .object({
          request_id: z.string(),
          contents: z.array(
            takoResultContentSchema().extend({
              source_url: z.string(),
              description: z.string().nullish(),
              offset: z.number().nullish(),
              premium: z.boolean().optional(),
              redacted_cells: z
                .record(z.string(), z.array(z.number()))
                .nullish(),
            }),
          ),
          usage: z
            .object({
              total_cost_usd: z.number(),
              compute: z.object({ cost_usd: z.number() }).nullish(),
              data: z
                .object({ cost_usd: z.number(), datasets: z.number() })
                .nullish(),
              variable_cost: z.object({ cost_usd: z.number() }).nullish(),
            })
            .nullish(),
        })
        .passthrough(),
      z.object({
        error: z.enum([
          'api_error',
          'configuration_error',
          'execution_error',
          'invalid_input',
          'rate_limit',
          'timeout',
          'unknown_tool',
        ]),
        statusCode: z.number().optional(),
        message: z.string(),
      }),
    ]),
  ),
);

export const takoContentsToolFactory = createProviderExecutedToolFactory<
  TakoContentsInput,
  TakoContentsOutput,
  TakoContentsConfig
>({
  id: 'gateway.tako_contents',
  inputSchema: takoContentsInputSchema,
  outputSchema: takoContentsOutputSchema,
});

export const takoContents = (
  config: TakoContentsConfig = {},
): ReturnType<typeof takoContentsToolFactory> =>
  takoContentsToolFactory(config);
