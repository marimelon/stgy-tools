# Strategy Board Editor

A strategy board viewer/editor for FFXIV (Final Fantasy XIV). Decodes `[stgy:a...]` format strings and renders them as SVG.

## Features

- **Viewer**: Decode and display stgy format strings
- **Editor**: Add, edit, delete objects with layer management and grouping
- **Image Export**: API to generate PNG images from stgy strings
- **Local Storage**: Board persistence using IndexedDB
- **Internationalization**: Japanese/English support (switchable via URL query parameter)

## Requirements

- Node.js 20+
- pnpm 9+

## Installation

```bash
pnpm install
```

### Asset Setup

Download game assets (icons and backgrounds) from [XIVAPI v2](https://v2.xivapi.com/api/docs):

```bash
npx tsx scripts/setup-assets.ts
```

## Commands

### Development

```bash
pnpm dev              # Start dev server (Node.js, port 3000)
pnpm dev:cloudflare   # Start dev server (Cloudflare Workers)
```

### Build

```bash
pnpm build            # Production build (both targets)
pnpm build:cloudflare # Production build (Cloudflare Workers)
pnpm build:node       # Production build (Node.js)
```

### Test & Lint

```bash
pnpm test             # Run tests
pnpm lint             # Biome linter
pnpm format           # Biome formatter
pnpm check            # Lint + format check
```

### Deploy

```bash
pnpm deploy           # Deploy to Cloudflare Workers
pnpm start            # Start Node.js production server
```

## Tech Stack

- **Framework**: TanStack Start (React 19.2 + TypeScript)
- **State Management**: TanStack Store
- **Database**: TanStack DB + Dexie (IndexedDB)
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI
- **Validation**: Zod v4
- **Build**: Vite 7 + Biome
- **Testing**: Vitest
- **i18n**: react-i18next
- **Deploy**: Cloudflare Workers / Node.js (Nitro)

## Project Structure

```
src/
├── lib/
│   ├── stgy/           # stgy format encoding/decoding
│   ├── editor/         # Editor state management (TanStack Store)
│   ├── boards/         # Board persistence (TanStack DB + Dexie)
│   ├── panel/          # Panel layout management
│   └── i18n/           # Internationalization config
├── components/
│   ├── board/          # Board rendering (SVG)
│   ├── editor/         # Editor UI
│   └── panel/          # Panel components
├── routes/
│   ├── index.tsx       # Viewer page
│   ├── editor.tsx      # Editor page
│   ├── image.ts        # Image generation API
│   └── debug*.tsx      # Debug pages
└── ui/                 # Shared UI components
```

## Language Switching

Switch languages via URL query parameter:

- Japanese: `?lang=ja`
- English: `?lang=en`

## License

This project is licensed under the [MIT License](LICENSE).

### Resource Attribution (© SQUARE ENIX)

Some resources in this repository contain content from FINAL FANTASY XIV:

- Test fixtures (`src/lib/screenshot/__tests__/__fixtures__/`)

FINAL FANTASY is a registered trademark of Square Enix Holdings Co., Ltd.

© SQUARE ENIX

For more information, see the [FINAL FANTASY XIV Materials Usage License](https://support.na.square-enix.com/rule.php?id=5382&la=1&tag=authc).

---

This project is not affiliated with, endorsed by, or in any way officially connected with SQUARE ENIX CO., LTD.
