/**
 * MYTHIC TABLE — SHARED STATE SERVER
 *
 * All devices (desktop, iPad, iPhone) that access the same Next.js server
 * share this single source of truth.  The state is backed by a JSON file so
 * it survives server restarts.
 *
 * GET  /api/shared-state           – returns { version, data }
 * GET  /api/shared-state?key=K     – returns { version, value }
 * GET  /api/shared-state?since=V   – returns { version, updates } (diff only)
 * POST /api/shared-state           – body { key, value } → stores and returns { version }
 * DELETE /api/shared-state         – wipes everything
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Increase body size limit so large combatant arrays (with portrait images) can sync
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// ─── Server-side singleton (persists across requests within a process) ────────
declare global {
  // eslint-disable-next-line no-var
  var __sharedState: {
    version: number;
    data: Record<string, any>;
    updateLog: { version: number; key: string; value: any }[];
  } | undefined;
}

if (!global.__sharedState) {
  global.__sharedState = { version: 0, data: {}, updateLog: [] };
  // Load from disk on first init
  try {
    const filePath = path.join(process.cwd(), 'data', 'shared-state.json');
    if (fs.existsSync(filePath)) {
      const loaded = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      global.__sharedState.data = loaded.data ?? {};
      global.__sharedState.version = loaded.version ?? 0;
    }
  } catch {/* no file yet — start empty */}
}

const store = global.__sharedState;

function persistToDisk() {
  try {
    const dir = path.join(process.cwd(), 'data');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'shared-state.json'),
      JSON.stringify({ version: store.version, data: store.data }, null, 2)
    );
  } catch { /* non-fatal */ }
}

// Keep only the last 500 update log entries to avoid unbounded growth
const MAX_LOG = 500;

// ─── GET ─────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const key    = searchParams.get('key');
  const since  = searchParams.get('since');
  const getAll = searchParams.get('all');

  if (key) {
    return NextResponse.json({
      version: store.version,
      value: store.data[key] ?? null,
    });
  }

  if (since !== null) {
    const sinceVersion = parseInt(since, 10) || 0;
    // Find all updates after sinceVersion
    const relevant = store.updateLog.filter(e => e.version > sinceVersion);
    // Deduplicate: keep only the latest update per key
    const updates: Record<string, any> = {};
    for (const entry of relevant) {
      updates[entry.key] = entry.value;
    }
    return NextResponse.json({
      version: store.version,
      updates,
    });
  }

  // Full state dump
  return NextResponse.json({
    version: store.version,
    data: store.data,
  });
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = body as { key: string; value: any };

    if (!key) {
      return NextResponse.json({ error: 'Missing key' }, { status: 400 });
    }

    store.version++;
    store.data[key] = value;
    store.updateLog.push({ version: store.version, key, value });

    // Trim log
    if (store.updateLog.length > MAX_LOG) {
      store.updateLog.splice(0, store.updateLog.length - MAX_LOG);
    }

    // Persist asynchronously (non-blocking)
    setImmediate(persistToDisk);

    return NextResponse.json({ version: store.version });
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE() {
  store.version++;
  store.data = {};
  store.updateLog = [];
  persistToDisk();
  return NextResponse.json({ ok: true });
}
