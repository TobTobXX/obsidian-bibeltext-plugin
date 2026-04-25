# Architecture

## Tech stack

| Layer | Technology |
|---|---|
| Language | TypeScript 4.7 |
| Bundler | esbuild 0.17 |
| Reactive state | RxJS 7 (Subject/firstValueFrom in api-proxy) |
| Host API | Obsidian Plugin API (`obsidian` package) |
| External API | jw.org JSON/HTML Bible API (no auth) |

## File overview

```
main.ts            Plugin entry point, post-processors, popover rendering
bibelresolver.ts   Tag parsing, verse resolution, Markdown conversion, caching
api-proxy.ts       HTTP batching, retry logic
books.ts           Static BOOKS_DATA table (book nr, tag abbr, display abbr); exports GERMAN_BOOKS and GERMAN_BOOK_ABBREVIATIONS
settings.ts        Cache management settings tab (stats, clear, build cache)
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
                                   book nr resolved via static GERMAN_BOOKS map (books.ts)
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

## jw.org Bible API

### Endpoint

```
GET https://www.jw.org/de/bibliothek/bibel/studienbibel/buecher/json/html/<refs>
```

No authentication required. The API is public.

`<refs>` is one or more verse-ref strings joined by commas (batch requests):

```
43003016                          → single verse  (John 3:16)
43003016-43003018                 → verse range   (John 3:16–18)
19023000-19023200                 → whole chapter (Psalm 23; 0–200 covers all verses)
1001001,43003016                  → batch of two
1001001,43003016,19023000-19023200 → batch of three
```

### Top-level response

| Field | Type | Description |
|---|---|---|
| `status` | number | HTTP-level status (always 200 on success) |
| `currentLocale` | string | Locale code (`"de"` for German) |
| `vernacularSectionHeadings` | object | Localised UI strings (footnotes, media, cross-ref chars, etc.) |
| `ranges` | object | Map of ref string → range data (see below) |
| `editionData.books` | object | Map of book number (string) → book metadata (see below) |

### `ranges[ref]` object

| Field | Type | Notes |
|---|---|---|
| `citation` | string | Human citation with `&nbsp;`, e.g. `"Johannes&nbsp;3:16"` |
| `citationVerseRange` | string | Chapter+verse only, e.g. `"3:16"` or `"3:16-18"` |
| `validRange` | string | Actual ref resolved by the server (clamps oversize chapter requests, e.g. `19023000-19023200` → `19023001-19023006`) |
| `link` | string | Canonical jw.org URL for the passage |
| `html` | string | Full rendered HTML for the entire range |
| `verses` | array | Per-verse objects (see below) |
| `crossReferences` | array | Cross-reference groups (see below) |
| `footnotes` | array | Footnote objects with `id`, `source`, `anchor`, `content` (HTML) |
| `superscriptions` | array | Superscription objects (usually empty) |
| `multimedia` | array | Linked media objects |
| `commentaries` | array | Study-note commentary objects |
| `pubReferences` | array | Publication reference objects |
| `numTranslations` | number | Number of translations available for this passage |

### `ranges[ref].verses[]` object

| Field | Type | Description |
|---|---|---|
| `vsID` | string | Zero-padded ref, e.g. `"43003016"` |
| `bookNumber` | number | Book number (integer) |
| `chapterNumber` | number | Chapter number |
| `verseNumber` | number | Verse number |
| `standardCitation` | string | Full citation with `&nbsp;`, e.g. `"Johannes&nbsp;3:16"` |
| `abbreviatedCitation` | string | Short citation, e.g. `"Joh&nbsp;3:16"` |
| `content` | string | HTML fragment for this verse (contains paragraph spans with CSS classes) |

#### Verse content HTML classes used by the plugin

| CSS class | Meaning |
|---|---|
| `style-b` | Normal prose paragraph |
| `style-l` | Poetic / indented line |
| `style-z` | Paragraph number marker |
| `parabreak` | Paragraph break (no text) |
| `newblock` | Block break (no text) |
| `verseNum` | Superscript verse number inside a paragraph |
| `chapterNum` | Superscript chapter number (first verse of chapter) |

### `ranges[ref].crossReferences[]` object

| Field | Type | Description |
|---|---|---|
| `id` | number | Internal cross-ref ID |
| `source` | string | Source verse ref (e.g. `"43003016"`) |
| `targets` | array | Target verse entries |

Each target: `{ vs, standardCitation, abbreviatedCitation, category: { id, label } }`

### `editionData.books[bookNr]` object

The plugin no longer reads book metadata from the API — abbreviations are embedded statically in `books.ts`. This object is present in every response but is ignored. Available fields for reference:

| Field | Type |
|---|---|
| `standardName` | string |
| `standardAbbreviation` | string |
| `officialAbbreviation` | string |
| `chapterCount` | string (numeric) |
| `bookDisplayTitle` | string |
| `chapterDisplayTitle` | string |
| `urlSegment` | string |
| `url` | string |
| `hasAudio` / `hasMultimedia` / `hasStudyNotes` / `hasPublicationReferences` | boolean |
| `additionalPages` | array (introduction, outline pages) |
| `images` | array (cover art in multiple sizes) |

### Behaviour notes

- The response key mirrors the requested ref exactly (e.g. request `19023000-19023200` → key is `19023000-19023200`, but `validRange` is `19023001-19023006`).
- `editionData.books` is returned on every response and always contains all 66 books — the plugin ignores it and uses its own static table in `books.ts` instead.
- The API does not paginate; all verses for a range are returned inline.

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

## Cache persistence

The verse cache (`BibelResolver.bibeltextCache`) is persisted to disk via `plugin.saveData` / `plugin.loadData` (Obsidian's built-in per-plugin JSON store). The saved object has a single `cache` key containing the map serialised as a plain object (`Record<string, Bibeltext>`).

Save triggers:
- **Debounced (5 s)** after every `bibeltextCache.set()` call — covers normal tag rendering
- **Immediate** when the user clicks "Build cache" or "Clear cache" in the settings panel
- **Best-effort on unload** — flushes anything the debounce had not yet fired

On load, the saved cache is imported before any post-processors run, so previously cached tags render instantly without a network round-trip.

The `space-remover` feature (strips the space in `( #b/...`) is always active and has no user-facing toggle.

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
