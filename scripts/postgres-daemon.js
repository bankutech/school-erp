const { spawn, execSync } = require('child_process');
const fs = require('fs');

console.log('[PG-DAEMON] Starting PostgreSQL supervisor...');

const pidFile = 'C:\\Users\\Sagni\\pgsql_data\\postmaster.pid';
if (fs.existsSync(pidFile)) {
  try { fs.unlinkSync(pidFile); } catch (e) {}
}

const pgCtl = 'C:\\Users\\Sagni\\pgsql\\pgsql\\bin\\pg_ctl.exe';
const pgData = 'C:\\Users\\Sagni\\pgsql_data';
const pgLog = 'C:\\Users\\Sagni\\postgres.log';

// Launch pg_ctl start with ignored stdio so it doesn't block
const child = spawn(pgCtl, ['-D', pgData, '-l', pgLog, 'start'], {
  detached: true,
  stdio: 'ignore',
});
child.unref();

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function verifyAndInitialize() {
  const isReadyExe = 'C:\\Users\\Sagni\\pgsql\\pgsql\\bin\\pg_isready.exe';
  let ready = false;

  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      execSync(`"${isReadyExe}" -h 127.0.0.1 -p 5432`, { stdio: 'ignore' });
      ready = true;
      break;
    } catch {
      // still starting
    }
  }

  if (ready) {
    console.log('[PG-DAEMON] ✅ PostgreSQL is running and accepting connections on 127.0.0.1:5432');
    const createdbExe = 'C:\\Users\\Sagni\\pgsql\\pgsql\\bin\\createdb.exe';
    try {
      execSync(`"${createdbExe}" -h 127.0.0.1 -p 5432 -U postgres school_erp`, { stdio: 'pipe' });
      console.log('[PG-DAEMON] ✅ Database "school_erp" created successfully.');
    } catch (e) {
      if (e.message && e.message.includes('already exists')) {
        console.log('[PG-DAEMON] ℹ️ Database "school_erp" already exists.');
      } else {
        console.log('[PG-DAEMON] Createdb info:', e.message);
      }
    }
  } else {
    console.error('[PG-DAEMON] ❌ Failed to start PostgreSQL within timeout.');
  }
}

verifyAndInitialize();

// Keep supervisor alive
const timer = setInterval(() => {}, 1000 * 60);

function handleExit() {
  console.log('[PG-DAEMON] Stopping PostgreSQL...');
  clearInterval(timer);
  try {
    execSync(`"${pgCtl}" -D "${pgData}" -m fast stop`, { stdio: 'ignore' });
  } catch {}
  process.exit(0);
}

process.on('SIGINT', handleExit);
process.on('SIGTERM', handleExit);
