import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================================================================
// CONFIGURATION
// =============================================================================

const PERIODS = ['30d', '90d', '365d'];
const SOURCES = [
  {
    name: 'cask-install',
    statsDir: path.join(__dirname, '..', 'stats', 'cask-install'),
    publicDir: path.join(__dirname, '..', 'public', 'stats', 'cask-install'),
  },
  {
    name: 'formulae-install',
    statsDir: path.join(__dirname, '..', 'stats', 'formulae-install'),
    publicDir: path.join(__dirname, '..', 'public', 'stats', 'formulae-install'),
  },
];

// =============================================================================
// OUTPUT JSON STRUCTURE
// =============================================================================
//
// Each period file (30d.json, 90d.json, 365d.json) will have this structure:
// {
//   "lastUpdated": "2026-02-23",          // Most recent date in the data
//   "dates": ["2026-02-22", "2026-02-23"], // Sorted array of all dates
//   "apps": {
//     "bruno": [5000, 5100],               // Install counts indexed by date position
//     "1password": [5179, 5200],
//     ...
//   }
// }
//
// This structure is optimized for:
// - Charting: dates array = x-axis, app counts = y-axis
// - Comparison: look up two apps and plot their arrays side by side
// - Efficiency: no repeated date strings per app
//

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Load metadata and create reverse mapping (hexId -> appName)
 */
function loadMetadata(metadataPath) {
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

  // Create reverse mapping: hexId -> appName
  const idToApp = {};
  for (const [appName, hexId] of Object.entries(metadata.apps)) {
    idToApp[hexId] = appName;
  }

  return { metadata, idToApp };
}

/**
 * Read a CSV file and return Map of hexId -> count
 * CSV format: id,count (first line is header)
 */
function readCsv(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const data = new Map();

  for (const line of content.split('\n')) {
    // Skip empty lines and header
    if (!line || line.startsWith('id,')) continue;

    const [id, count] = line.split(',');
    if (id && count !== undefined) {
      data.set(id.trim(), parseInt(count.trim(), 10));
    }
  }
  return data;
}

/**
 * Get all CSV files in a period directory, sorted by date
 */
function getCsvFiles(periodDir) {
  if (!fs.existsSync(periodDir)) return [];

  return fs.readdirSync(periodDir)
    .filter(f => f.endsWith('.csv'))
    .map(f => ({
      filename: f,
      date: f.replace('.csv', ''),
      path: path.join(periodDir, f)
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// =============================================================================
// MAIN LOGIC
// =============================================================================

/**
 * Build the complete time series data for a period
 * Returns { dates: string[], appData: Map<hexId, number[]> }
 */
function buildTimeSeries(periodDir) {
  const csvFiles = getCsvFiles(periodDir);

  if (csvFiles.length === 0) {
    console.log('  No CSV files found');
    return null;
  }

  // Collect all dates
  const allDates = csvFiles.map(f => f.date);

  // Build time series: for each date, read the CSV data
  // Structure: Map<hexId, number[]> where array index corresponds to date index
  const appData = new Map();

  for (let i = 0; i < csvFiles.length; i++) {
    const csvFile = csvFiles[i];
    const dateData = readCsv(csvFile.path);

    // Add this date's data to the time series
    for (const [hexId, count] of dateData) {
      if (!appData.has(hexId)) {
        // Initialize with nulls for previous dates
        appData.set(hexId, new Array(i).fill(null));
      }
      appData.get(hexId).push(count);
    }

    // Fill nulls for apps that existed before but not in this date
    for (const [hexId, counts] of appData) {
      if (counts.length === i) {
        counts.push(null);
      }
    }
  }

  return { dates: allDates, appData };
}

/**
 * Generate public JSON file for a period
 */
function generatePeriodJson(source, period, idToApp) {
  console.log(`  Processing ${period}...`);

  const periodDir = path.join(source.statsDir, period);
  const result = buildTimeSeries(periodDir);

  if (!result) {
    console.log(`  Skipping ${period} - no data`);
    return;
  }

  const { dates, appData } = result;

  // Convert hex IDs to app names
  const apps = {};
  for (const [hexId, counts] of appData) {
    const appName = idToApp[hexId];
    if (appName) {
      apps[appName] = counts;
    }
  }

  // Build final JSON structure
  const output = {
    lastUpdated: dates[dates.length - 1],
    dates: dates,
    apps: apps
  };

  // Write to public directory
  const outputPath = path.join(source.publicDir, `${period}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(output));

  const sizeKB = (fs.statSync(outputPath).size / 1024).toFixed(1);
  console.log(`  Saved ${outputPath}`);
  console.log(`  - ${dates.length} dates, ${Object.keys(apps).length} apps, ${sizeKB}KB`);
}

// =============================================================================
// ENTRY POINT
// =============================================================================

function main() {
  console.log('Generating public stats JSON files...\n');

  for (const source of SOURCES) {
    const metadataPath = path.join(source.statsDir, 'metadata.json');

    if (!fs.existsSync(metadataPath)) {
      console.log(`[${source.name}] No metadata found, skipping`);
      continue;
    }

    console.log(`[${source.name}]`);

    // Ensure public directory exists
    fs.mkdirSync(source.publicDir, { recursive: true });

    // Load metadata and create reverse mapping
    const { idToApp } = loadMetadata(metadataPath);
    console.log(`  Loaded ${Object.keys(idToApp).length} app mappings`);

    // Generate JSON for each period
    for (const period of PERIODS) {
      generatePeriodJson(source, period, idToApp);
    }
  }

  console.log('\nDone!');
}

main();
