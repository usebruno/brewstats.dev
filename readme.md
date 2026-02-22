# brewstats

Track and compare Homebrew installation trends for casks and formulae.

**Live:** [brewstats.dev](https://brewstats.dev)

## Features

- Compare install trends for Homebrew casks (macOS apps) and formulae (CLI tools)
- Line and pie chart visualizations
- 30-day, 90-day, and 365-day time periods
- Search with keyboard navigation
- Shareable URLs with selected apps and settings
- Dark/light mode

## Tech Stack

- [Astro](https://astro.build) + [Tailwind CSS](https://tailwindcss.com)
- [Chart.js](https://www.chartjs.org)
- Data from [Homebrew Analytics](https://formulae.brew.sh/analytics/)

## Development

```bash
npm install
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run fetch` | Fetch latest stats from Homebrew (runs on Sundays) |
| `npm run compile` | Compile raw CSV stats into JSON for the site |
| `npm run build` | Compile stats + build Astro site |

Set `FORCE_RUN=true` to run fetch on non-Sundays: `FORCE_RUN=true npm run fetch`

## License

[MIT](LICENSE)
