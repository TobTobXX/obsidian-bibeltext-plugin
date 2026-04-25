# Architecture

## Tech stack

| Layer | Technology |
|---|---|
| Language | TypeScript 4.7 |
| Bundler | esbuild 0.17 |
| Reactive state | RxJS 7 (BehaviorSubject for settings) |
| Host API | Obsidian Plugin API (`obsidian` package) |
| External API | jw.org JSON/HTML Bible API (no auth) |

## File overview

```
main.ts            Plugin entry point, post-processors, popover rendering
bibelresolver.ts   Tag parsing, verse resolution, Markdown conversion, caching
api-proxy.ts       HTTP batching, retry logic
settings.ts        Settings model (BehaviorSubject) + settings tab UI
space-remover.ts   Post-processor: strips space before tags inside parentheses
styles.css         Popover styles
esbuild.config.mjs Build configuration — bundles to dist/
```

## Data flow

```
Markdown rendered in Obsidian preview
  │
  ▼
markerPP (sortOrder 20)
  Finds all <a class="tag"> whose text starts with #b/
  Adds class bibeltext-tag, stores raw tag in [tag] attribute
  │
  ▼
bibeltextRendererPP (sortOrder 24)
  For each .bibeltext-tag:
    BibelResolver.getDisplayText(tag)
      → RefRange.fromTag()         parse #b/Book/Ch/Vs into book nr + chapter + verse
      → BibelResolver.books        cached promise; fetches book list on first call
      → proxy.request(refNr)       fetch verse data (batched, cached)
    Sets tag.innerHTML to human citation (e.g. "Joh 3:16")
    Overrides onclick → global search
  │
  ▼
hoverListenerPP (sortOrder 25)
  Registers mouseover + long-touch listeners on each .bibeltext-tag
  On trigger:
    BibelResolver.resolveText(tag) → returns cached Bibeltext
    new BibeltextPopover(...)      renders markdown in HoverPopover
```

## API proxy (`api-proxy.ts`)

The JW.org API accepts multiple verse references in one request (comma-separated in the URL path). `ApiProxy` exploits this to reduce network traffic:

- Incoming `request(ref)` calls are queued
- After **80 ms** of inactivity a batch request fires with up to **8 refs**
- If more refs remain in the queue, the next batch is scheduled immediately
- On failure: **3 attempts** with exponential backoff (500 ms, 1 s, 2 s)
- Results are broadcast via an RxJS `Subject`; each caller filters for its own ref

The proxy does **not** cache — caching lives in `BibelResolver.bibeltextCache` (a `Map` keyed by the numeric ref string).

## Ref number format

Verse references are encoded as a zero-padded numeric string:

```
<book><chapter padded to 3><verse padded to 3>
e.g. 1001001  = Genesis 1:1  (book 1, ch 001, vs 001)
     43003016 = John 3:16    (book 43, ch 003, vs 016)

Range: 43003016-43003036  (John 3:16–36)
Whole chapter: 19023000-19023200  (Psalm 23, verses 0–200)
```

## Settings

Settings are stored via `plugin.saveData` / `plugin.loadData` (Obsidian's built-in per-plugin JSON store). Each setting is a `BehaviorSubject<boolean>`; subscribing to it auto-saves on every change.

## Build

```sh
npm run dev      # esbuild watch mode → dist/main.js (inline sourcemaps)
npm run build    # tsc type-check (no emit) then esbuild production → dist/
```

Production output: `dist/main.js`, `dist/manifest.json`, `dist/styles.css`.

To install locally, symlink `dist/` to `.obsidian/plugins/bibeltext-plugin/` in your vault.

## Useful commands

```sh
# Rebuild and watch
npm run dev

# One-shot production build
npm run build

# Bump version (updates manifest.json + versions.json, stages both)
npm run version
```
