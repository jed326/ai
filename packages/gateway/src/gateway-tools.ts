import { browserbaseFetch } from './tool/browserbase-fetch';
import { browserbaseSearch } from './tool/browserbase-search';
import { exaSearch } from './tool/exa-search';
import { parallelSearch } from './tool/parallel-search';
import { perplexitySearch } from './tool/perplexity-search';
import { takoContents } from './tool/tako-contents';
import { takoSearch } from './tool/tako-search';

/**
 * Gateway-specific provider-defined tools.
 */
export const gatewayTools = {
  /**
   * Fetch page content using Browserbase's lightweight Fetch API.
   *
   * Supports raw, Markdown, and schema-driven JSON output as well as redirects,
   * proxy routing, and TLS controls.
   */
  browserbaseFetch,

  /**
   * Search the web using Browserbase's Search API for fast, structured results.
   *
   * Returns titles, URLs, and available publication metadata without requiring
   * a browser session.
   */
  browserbaseSearch,

  /**
   * Search the web using Exa for current information and token-efficient
   * excerpts optimized for agent workflows.
   *
   * Supports search type, category, domain, date, location, and content
   * extraction controls.
   */
  exaSearch,

  /**
   * Search the web using Parallel AI's Search API for LLM-optimized excerpts.
   *
   * Takes a natural language objective and returns relevant excerpts,
   * replacing multiple keyword searches with a single call for broad
   * or complex queries. Supports different search types for depth vs
   * breadth tradeoffs.
   */
  parallelSearch,

  /**
   * Search the web using Perplexity's Search API for real-time information,
   * news, research papers, and articles.
   *
   * Provides ranked search results with advanced filtering options including
   * domain, language, date range, and recency filters.
   */
  perplexitySearch,

  /**
   * Fetch the full content behind a Tako Search result: a Tako card's data
   * rows or a web page's extracted text.
   *
   * Supports inline delivery or a short-lived download link, card data
   * formats, row paging, and query-focused passages from web pages.
   */
  takoContents,

  /**
   * Search the web and Tako's curated knowledge graph in one call for
   * token-efficient web excerpts and structured data results grounded in
   * premium sources, each with an embed-ready visualization.
   *
   * Supports effort, per-source web and data controls, localization, and inline
   * contents for agents that need to reason over underlying data.
   */
  takoSearch,
};
