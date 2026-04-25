# Tasks

 - Don't fetch/store entire chapters. Render chapter tag, and link to WOL, but not contents.
 - Implement retry logic in `api-proxy.ts` `doRequest()`: ARCHITECTURE.md documents 3 attempts with exponential backoff (500 ms, 1 s, 2 s) but the code has none.
