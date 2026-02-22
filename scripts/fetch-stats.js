import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================================================================
// CONFIGURATION
// =============================================================================

const PERIODS = ['30d', '90d', '365d'];
const BASE_URL = 'https://formulae.brew.sh/api/analytics/cask-install/homebrew-cask';
const STATS_DIR = path.join(__dirname, '..', 'stats', 'cask-install');
const METADATA_PATH = path.join(STATS_DIR, 'metadata.json');

// =============================================================================
// METADATA MANAGEMENT
// Maps app names to compact hex IDs to reduce file sizes
// =============================================================================

function loadMetadata() {
  if (fs.existsSync(METADATA_PATH)) {
    return JSON.parse(fs.readFileSync(METADATA_PATH, 'utf-8'));
  }
  return { nextId: 0, apps: {} };
}

function saveMetadata(metadata) {
  fs.writeFileSync(METADATA_PATH, JSON.stringify(metadata, null, 2));
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

async function fetchPeriodStats(period, metadata, currentDate) {
  const url = `${BASE_URL}/${period}.json`;
  const periodDir = path.join(STATS_DIR, period);
  const csvPath = path.join(periodDir, `${currentDate}.csv`);
  
  // Check if file already exists
  if (fs.existsSync(csvPath)) {
    console.log(`[${period}] Stats for ${currentDate} already exist`);
    return;
  }
  
  console.log(`[${period}] Fetching stats...`);
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
  console.log(`[${period}] Saved ${Object.keys(formulae).length} apps (${sizeKB}KB)`);
}

// =============================================================================
// ENTRY POINT
// =============================================================================

async function main() {
  // Only run on Sundays (weekly fetch)
  if (!isSunday()) {
    console.log('Skipping: This script only runs on Sundays.');
    console.log(`Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}.`);
    return;
  }
  
  const currentDate = getCurrentDate();
  console.log(`Fetching weekly brew cask install stats for ${currentDate}...\n`);
  
  // Ensure base directory exists
  fs.mkdirSync(STATS_DIR, { recursive: true });
  
  // Load metadata (app name -> hex ID mapping)
  const metadata = loadMetadata();
  const initialAppCount = Object.keys(metadata.apps).length;
  
  // Fetch stats for all time periods
  for (const period of PERIODS) {
    await fetchPeriodStats(period, metadata, currentDate);
  }
  
  // Save updated metadata
  saveMetadata(metadata);
  
  const newAppsCount = Object.keys(metadata.apps).length - initialAppCount;
  console.log(`\nTotal apps in metadata: ${Object.keys(metadata.apps).length}`);
  if (newAppsCount > 0) {
    console.log(`New apps added: ${newAppsCount}`);
  }
}

main().catch(console.error);
