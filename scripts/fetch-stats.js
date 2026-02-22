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
    baseUrl: 'https://formulae.brew.sh/api/analytics/cask-install/homebrew-cask',
    statsDir: path.join(__dirname, '..', 'stats', 'cask-install'),
  },
  {
    name: 'formulae-install',
    baseUrl: 'https://formulae.brew.sh/api/analytics/install/homebrew-core',
    statsDir: path.join(__dirname, '..', 'stats', 'formulae-install'),
  },
];

// =============================================================================
// METADATA MANAGEMENT
// Maps app names to compact hex IDs to reduce file sizes
// =============================================================================

function loadMetadata(metadataPath) {
  if (fs.existsSync(metadataPath)) {
    return JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
  }
  return { nextId: 0, apps: {} };
}

function saveMetadata(metadataPath, metadata) {
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
}

/**
 * Get or create a hex ID for an app name
 * New apps are assigned incrementing hex IDs (0, 1, 2, ... a, b, c, ... 1b08, etc.)
 */
function getAppId(metadata, appName) {
  if (metadata.apps[appName] !== undefined) {
    return metadata.apps[appName];
  }
  const hexId = metadata.nextId.toString(16);
  metadata.apps[appName] = hexId;
  metadata.nextId++;
  return hexId;
}

// =============================================================================
// DATE UTILITIES
// =============================================================================

function getCurrentDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if today is Sunday (day 0)
 */
function isSunday() {
  return new Date().getDay() === 0;
}

// =============================================================================
// MAIN FETCH LOGIC
// =============================================================================

async function fetchPeriodStats(source, period, metadata, currentDate) {
  const url = `${source.baseUrl}/${period}.json`;
  const periodDir = path.join(source.statsDir, period);
  const csvPath = path.join(periodDir, `${currentDate}.csv`);

  // Check if file already exists
  if (fs.existsSync(csvPath)) {
    console.log(`[${source.name}/${period}] Stats for ${currentDate} already exist`);
    return;
  }

  console.log(`[${source.name}/${period}] Fetching stats...`);
  const response = await fetch(url);
  const data = await response.json();
  const { formulae } = data;

  // Ensure directory exists
  fs.mkdirSync(periodDir, { recursive: true });

  // Build CSV content
  const lines = ['id,count'];
  for (const [app, entries] of Object.entries(formulae)) {
    const id = getAppId(metadata, app);
    const count = parseInt(entries[0]?.count?.replace(/,/g, '') || '0', 10);
    lines.push(`${id},${count}`);
  }

  // Write CSV file
  const content = lines.join('\n');
  fs.writeFileSync(csvPath, content);

  const sizeKB = (Buffer.byteLength(content) / 1024).toFixed(1);
  console.log(`[${source.name}/${period}] Saved ${Object.keys(formulae).length} apps (${sizeKB}KB)`);
}

async function fetchSource(source, currentDate) {
  const metadataPath = path.join(source.statsDir, 'metadata.json');

  // Ensure base directory exists
  fs.mkdirSync(source.statsDir, { recursive: true });

  // Load metadata (app name -> hex ID mapping)
  const metadata = loadMetadata(metadataPath);
  const initialAppCount = Object.keys(metadata.apps).length;

  // Fetch stats for all time periods
  for (const period of PERIODS) {
    await fetchPeriodStats(source, period, metadata, currentDate);
  }

  // Save updated metadata
  saveMetadata(metadataPath, metadata);

  const newAppsCount = Object.keys(metadata.apps).length - initialAppCount;
  console.log(`[${source.name}] Total apps in metadata: ${Object.keys(metadata.apps).length}`);
  if (newAppsCount > 0) {
    console.log(`[${source.name}] New apps added: ${newAppsCount}`);
  }
}

// =============================================================================
// ENTRY POINT
// =============================================================================

async function main() {
  // Only run on Sundays (weekly fetch), unless FORCE_RUN is set
  if (!isSunday() && !process.env.FORCE_RUN) {
    console.log('Skipping: This script only runs on Sundays.');
    console.log(`Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}.`);
    console.log('Set FORCE_RUN=true to override.');
    return;
  }

  const currentDate = getCurrentDate();
  console.log(`Fetching weekly brew install stats for ${currentDate}...\n`);

  for (const source of SOURCES) {
    console.log(`\n--- ${source.name} ---`);
    await fetchSource(source, currentDate);
  }
}

main().catch(console.error);
