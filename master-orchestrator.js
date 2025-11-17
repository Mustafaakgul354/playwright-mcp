import fs from 'fs/promises';
import path from 'path';
import process from 'process';
import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';

import { loadConfig } from './configs/loadConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_DIR = path.resolve(process.env.MASTER_CONFIG_DIR ?? path.join(__dirname, 'configs'));
const WORKER_SCRIPT = path.resolve(__dirname, 'worker', 'run-booking.js');

const POLL_INTERVAL_MIN_MS = parseIntWithDefault(process.env.MASTER_POLL_INTERVAL_MIN_MS, 10000);
const POLL_INTERVAL_MAX_MS = parseIntWithDefault(process.env.MASTER_POLL_INTERVAL_MAX_MS, 60000);
const BACKOFF_MULTIPLIER = parseFloatWithDefault(process.env.MASTER_BACKOFF_MULTIPLIER, 1.5);
const WORKER_STAGGER_MS = parseIntWithDefault(process.env.MASTER_WORKER_STAGGER_MS, 2000);
const WORKER_SUCCESS_COOLDOWN_MS = parseIntWithDefault(process.env.MASTER_WORKER_SUCCESS_COOLDOWN_MS, 300000);
const WORKER_FAILURE_RETRY_MS = parseIntWithDefault(process.env.MASTER_WORKER_FAILURE_RETRY_MS, 60000);

const FORCED_HEADLESS = parseBoolean(process.env.MASTER_FORCE_HEADLESS);
const RAW_FORCED_SLOW_MO = process.env.MASTER_FORCE_SLOW_MO;
const FORCED_SLOW_MO = parseOptionalNumber(RAW_FORCED_SLOW_MO);
const WORKER_LOG_DIR = process.env.MASTER_WORKER_LOG_DIR;

const activeWorkers = new Map();
const coolDowns = new Map();

function parseBoolean(value) {
  if (value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  const normalised = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'y'].includes(normalised)) return true;
  if (['0', 'false', 'no', 'n'].includes(normalised)) return false;
  return undefined;
}

function parseIntWithDefault(raw, defaultValue) {
  const parsed = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

function parseFloatWithDefault(raw, defaultValue) {
  const parsed = Number.parseFloat(raw ?? '');
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

function parseOptionalNumber(raw) {
  if (raw === undefined || raw === null || raw === '') {
    return undefined;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function log(level, message, meta = {}) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };

  const line = JSON.stringify(payload);
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

async function ensureConfigDir() {
  try {
    await fs.access(CONFIG_DIR);
  } catch {
    throw new Error(`Config directory not found at ${CONFIG_DIR}.`);
  }
}

async function listConfigFiles() {
  const entries = await fs.readdir(CONFIG_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => path.join(CONFIG_DIR, entry.name));
}

async function loadConfigEntries() {
  const files = await listConfigFiles();
  const entries = [];

  for (const file of files) {
    try {
      const config = await loadConfig(file);
      entries.push({ config, file });
    } catch (error) {
      log('error', 'Failed to load config file', {
        file,
        error: error.message,
        issues: error.issues,
      });
    }
  }

  return entries;
}

async function checkForAppointment() {
  const forced = parseBoolean(process.env.MASTER_FORCE_AVAILABLE);
  if (forced !== undefined) {
    log('info', 'Using forced appointment availability flag', { available: forced });
    return forced;
  }

  // TODO: Replace this stub with the real appointment availability check.
  log('info', 'Checking appointment availability (stub implementation)');
  return false;
}

function isWorkerEligible(entry) {
  const { config } = entry;
  if (activeWorkers.has(config.id)) {
    return false;
  }

  const nextEligibleAt = coolDowns.get(config.id) ?? 0;
  return Date.now() >= nextEligibleAt;
}

function deriveLogFilePath(configId, runId) {
  if (!WORKER_LOG_DIR) {
    return undefined;
  }

  return path.join(WORKER_LOG_DIR, `${configId}-${runId}.log`);
}

function buildWorkerArgs(entry, runId) {
  const args = [WORKER_SCRIPT, entry.file];

  if (FORCED_HEADLESS !== undefined) {
    args.push(FORCED_HEADLESS ? '--headless' : '--no-headless');
  }

  if (FORCED_SLOW_MO !== undefined && Number.isFinite(FORCED_SLOW_MO)) {
    args.push('--slow-mo', String(FORCED_SLOW_MO));
  }

  const logFilePath = deriveLogFilePath(entry.config.id, runId);
  if (logFilePath) {
    args.push('--log-file', logFilePath);
  }

  return args;
}

async function launchWorker(entry) {
  if (!isWorkerEligible(entry)) {
    return null;
  }

  const runId = randomUUID?.() ?? `master-${Date.now()}`;
  const args = buildWorkerArgs(entry, runId);

  log('info', 'Launching worker', {
    worker: entry.config.id,
    args,
    runId,
  });

  const child = spawn(process.execPath, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      WORKER_PARENT_RUN_ID: runId,
    },
  });

  activeWorkers.set(entry.config.id, child);

  child.stdout.on('data', (chunk) => {
    const text = chunk.toString().trimEnd();
    if (text.length > 0) {
      log('info', 'Worker stdout', { worker: entry.config.id, output: text });
    }
  });

  child.stderr.on('data', (chunk) => {
    const text = chunk.toString().trimEnd();
    if (text.length > 0) {
      log('error', 'Worker stderr', { worker: entry.config.id, output: text });
    }
  });

  child.on('exit', (code, signal) => {
    activeWorkers.delete(entry.config.id);
    const success = code === 0;
    const nextEligibleIn = success ? WORKER_SUCCESS_COOLDOWN_MS : WORKER_FAILURE_RETRY_MS;
    coolDowns.set(entry.config.id, Date.now() + nextEligibleIn);

    log(success ? 'info' : 'error', 'Worker exited', {
      worker: entry.config.id,
      code,
      signal,
      nextEligibleIn,
    });
  });

  child.on('error', (error) => {
    activeWorkers.delete(entry.config.id);
    coolDowns.set(entry.config.id, Date.now() + WORKER_FAILURE_RETRY_MS);
    log('error', 'Failed to start worker process', {
      worker: entry.config.id,
      error: error.message,
    });
  });

  if (WORKER_STAGGER_MS > 0) {
    await delay(WORKER_STAGGER_MS);
  }

  return child;
}

async function launchAvailableWorkers(entries) {
  for (const entry of entries) {
    await launchWorker(entry);
  }
}

async function ensureProfileDirs(entries) {
  for (const entry of entries) {
    const profilePath = entry.config.profile?.path;
    if (profilePath) {
      try {
        await fs.mkdir(profilePath, { recursive: true });
      } catch (error) {
        log('error', 'Failed to create profile directory', {
          path: profilePath,
          error: error.message,
        });
      }
    }
  }
}

async function pollLoop() {
  let interval = POLL_INTERVAL_MIN_MS;

  while (true) {
    try {
      const available = await checkForAppointment();
      if (available) {
        interval = POLL_INTERVAL_MIN_MS;
        const entries = await loadConfigEntries();
        await ensureProfileDirs(entries);
        await launchAvailableWorkers(entries);
      } else {
        interval = Math.min(
          Math.max(POLL_INTERVAL_MIN_MS, Math.round(interval * BACKOFF_MULTIPLIER)),
          POLL_INTERVAL_MAX_MS,
        );
        log('info', 'No appointments available', { nextCheckInMs: interval });
      }
    } catch (error) {
      log('error', 'Poll loop error', { error: error.message, stack: error.stack });
      interval = Math.min(
        Math.max(POLL_INTERVAL_MIN_MS, Math.round(interval * BACKOFF_MULTIPLIER)),
        POLL_INTERVAL_MAX_MS,
      );
    }

    await delay(interval);
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  log('info', 'Master orchestrator starting', {
    configDir: CONFIG_DIR,
    workerScript: WORKER_SCRIPT,
  });

  if (RAW_FORCED_SLOW_MO !== undefined && FORCED_SLOW_MO === undefined) {
    log('warn', 'Ignoring invalid MASTER_FORCE_SLOW_MO value', {
      value: RAW_FORCED_SLOW_MO,
    });
  }

  await ensureConfigDir();
  await pollLoop();
}

main().catch((error) => {
  log('error', 'Master orchestrator failed', { error: error.message, stack: error.stack });
  process.exit(1);
});

