<p align="center">
  <a href="https://brewstats.dev">
    <img src="src/assets/logo.svg" alt="brewstats logo" width="96" height="96">
  </a>
</p>

<h1 align="center">brewstats</h1>

<p align="center">
  Track and compare Homebrew install trends for casks and formulae.
</p>

<p align="center">
  <a href="https://brewstats.dev"><strong>brewstats.dev</strong></a>
</p>

<p align="center">
  <a href="https://github.com/usebruno/brewstats.dev/actions/workflows/fetch-stats.yml"><img src="https://img.shields.io/github/actions/workflow/status/usebruno/brewstats.dev/fetch-stats.yml?label=weekly%20stats&logo=github" alt="Weekly stats workflow status"></a>
  <a href="license.md"><img src="https://img.shields.io/github/license/usebruno/brewstats.dev" alt="MIT license"></a>
  <a href="https://astro.build"><img src="https://img.shields.io/badge/built%20with-Astro-BC52EE?logo=astro&logoColor=white" alt="Built with Astro"></a>
</p>

---

## What is brewstats?

[Homebrew](https://brew.sh) publishes install analytics for every cask and formula, but only as a single ranked list with no history. brewstats takes a snapshot of that data every week, keeps it forever, and turns it into charts so you can see how packages trend over time and how they stack up against each other.

- **Casks** — macOS apps distributed through Homebrew, such as `bruno`, `cursor`, or `1password`
- **Formulae** — CLI tools and libraries, such as `node`, `python`, or `git`

## Features

- **Compare packages side by side** — pick up to eight casks or formulae and plot them on one chart
- **Line and pie charts** — see trends over time or share of installs at a glance
- **Three time windows** — 30-day, 90-day, and 365-day rolling install counts
- **Fast search** — instant substring search with full keyboard navigation
- **Shareable URLs** — your selection, period, and chart type live in the URL, so any view can be linked
- **Dark and light mode** — follows your system preference, with a manual toggle

**Example:** compare API clients over the last 90 days as a pie chart:

```
https://brewstats.dev/casks?packages=bruno,postman,insomnia&period=90d&chart=pie
```

## How it works

```
Homebrew Analytics API ──▶ scripts/fetch-stats.js ──▶ stats/<source>/<period>/<date>.csv
                                                                    │
                                                                    ▼
                          public/stats/<source>/<period>.json ◀── scripts/compile-stats.js
                                                                    │
                                                                    ▼
                                                        Astro site (brewstats.dev)
```

1. **Fetch.** A [GitHub Actions workflow](.github/workflows/fetch-stats.yml) runs every Sunday at 12:00 UTC and pulls the 30-, 90-, and 365-day install counts for every cask and formula from the [Homebrew Analytics API](https://formulae.brew.sh/analytics/).
2. **Store.** Each run is saved as a dated CSV in [`stats/`](stats). Package names are mapped to compact IDs in a `metadata.json` file per source, which keeps the weekly snapshots small.
3. **Compile.** `scripts/compile-stats.js` merges all snapshots into one JSON file per period, which the site loads client-side.
4. **Commit.** The workflow commits the new snapshots and compiled JSON back to the repository, so the full history lives in git.

## Getting started

Requires [Node.js](https://nodejs.org) 20 or newer.

```bash
git clone https://github.com/usebruno/brewstats.dev.git
cd brewstats.dev
npm install
npm run compile   # build the JSON the site reads from the committed CSV snapshots
npm run dev       # start the dev server at http://localhost:4321
```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Astro dev server with hot reload |
| `npm run build` | Compile stats, then build the production site into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run fetch` | Fetch the latest snapshot from Homebrew (only runs on Sundays) |
| `npm run compile` | Compile the CSV snapshots in `stats/` into JSON under `public/stats/` |

To fetch a fresh snapshot on any other day of the week:

```bash
FORCE_RUN=true npm run fetch
```

## Project structure

```
.
├── .github/workflows/fetch-stats.yml   # weekly data refresh
├── scripts/
│   ├── fetch-stats.js                  # pulls analytics from Homebrew
│   └── compile-stats.js                # CSV snapshots → JSON for the site
├── stats/
│   ├── cask-install/                   # weekly CSVs for casks, by period
│   └── formulae-install/               # weekly CSVs for formulae, by period
└── src/
    ├── components/StatsPage.astro      # the shared casks/formulae page
    ├── layouts/Layout.astro
    └── pages/                          # index, /casks, /formulae
```

## Built with

- [Astro](https://astro.build) and [Tailwind CSS](https://tailwindcss.com)
- [Chart.js](https://www.chartjs.org)
- Data from [Homebrew Analytics](https://formulae.brew.sh/analytics/)

## Contributing

Issues and pull requests are welcome. If you spot a package that looks wrong or have an idea for a new view, [open an issue](https://github.com/usebruno/brewstats.dev/issues).

## License

[MIT](license.md) © [Bruno Software Inc.](https://www.usebruno.com)

<p align="center">
  <sub>Built by the team behind <a href="https://www.usebruno.com">Bruno</a>, the open-source API client.</sub>
</p>
