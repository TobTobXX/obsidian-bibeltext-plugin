# Bibeltext Plugin

An [Obsidian](https://obsidian.md) plugin that resolves Bible verse references written as tags into human-readable citations, with hover popups showing the full verse text.

## What it does

Write a Bible reference as an Obsidian tag anywhere in your notes:

```
( #b/Jo/3/16 )
( #b/Mt/5/3-12 )
( #b/Ps/23 )
```

The plugin will:
- Replace the raw tag with a readable citation (e.g. `Joh 3:16`)
- Show the full verse text in a floating popover on hover (or long-press on mobile)
- Open a global tag search when clicked

## Tag format

```
#b/<Book>/<Chapter>
#b/<Book>/<Chapter>/<Verse>
#b/<Book>/<Chapter>/<Verse1>-<Verse2>
```

Book abbreviations follow the German NWT Study Bible (e.g. `Mat`, `Joh`, `1Mo`, `Ps`, `Ro`). All 66 books are defined in a static table (`books.ts`).

## Data source

Verse text is fetched live from [jw.org](https://www.jw.org) (German NWT Study Bible). An internet connection is required. The API is not authenticated and the data is publicly accessible.

## Settings

| Setting | Default | Description |
|---|---|---|
| Remove formatting space | On | Strips the space in `( #b/...)` so the parenthesis sits flush against the citation |
| Offline mode | Off | Not yet implemented |

## Development

```sh
npm install
npm run dev      # watch mode — bundles to dist/
npm run build    # production build (type-checks first)
```

The output lands in `dist/` (`main.js`, `manifest.json`, `styles.css`). Copy or symlink that directory into your Obsidian vault's `.obsidian/plugins/bibeltext-plugin/` folder to test.

## Known limitations

- Only the German edition of the NWT Study Bible is supported (the API URL is hardcoded to `jw.org/de/...`)
- Offline mode is exposed in settings but not implemented
- Book abbreviations must match the JW.org API; unsupported abbreviations silently fail with a console warning
