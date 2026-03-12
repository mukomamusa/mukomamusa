const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dbPath = path.join(process.cwd(), 'bus_booking.db');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = `${dbPath}.backup-${timestamp}`;

console.log('DB reset: backup → wipe → init → verify');
console.log(`DB path: ${dbPath}`);

// 1. Backup existing DB if it exists
if (fs.existsSync(dbPath)) {
  fs.copyFileSync(dbPath, backupPath);
  console.log(`Backed up to: ${backupPath}`);

  fs.unlinkSync(dbPath);
  console.log('Old DB removed.');
} else {
  console.log('No existing DB found — creating fresh.');
}

// 2. Run init
try {
  execSync('node scripts/db-init.js', { stdio: 'inherit' });
} catch (err) {
  console.error('db:init failed. Restoring backup...');
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, dbPath);
    console.log('Backup restored.');
  }
  process.exit(1);
}

// 3. Run verify
try {
  execSync('node scripts/db-verify.js', { stdio: 'inherit' });
  console.log('DB reset complete. Backup kept at:');
  console.log(backupPath);
} catch (err) {
  console.error('db:verify failed after reset.');
  process.exit(1);
}
