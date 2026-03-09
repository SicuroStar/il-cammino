/**
 * CapacitorFilesystemAdapter — Sprint 5
 *
 * Wraps @capacitor/filesystem for persisting BASM documents on native iOS/Android.
 * Gracefully degrades to localStorage on web (Capacitor.isNativePlatform() === false).
 *
 * Directory: APP_DATA/basm/
 * File naming: basm_doc_<appId>.json  |  basm_draft_<appId>.json
 *
 * Required package: npm install @capacitor/filesystem
 * (Added to dependencies in Sprint 5 — package version aligned with @capacitor/core@3.x)
 */

import { Injectable } from '@angular/core';

/** Minimal type stubs for @capacitor/filesystem 3.x — avoids hard import when not installed. */
interface FilesystemPlugin {
  readFile(options: { path: string; directory: string; encoding: string }): Promise<{ data: string }>;
  writeFile(options: { path: string; directory: string; data: string; encoding: string; recursive: boolean }): Promise<void>;
  deleteFile(options: { path: string; directory: string }): Promise<void>;
  readdir(options: { path: string; directory: string }): Promise<{ files: string[] }>;
  mkdir(options: { path: string; directory: string; recursive: boolean }): Promise<void>;
}

const BASM_DIR = 'basm';
const DATA_DIR = 'DATA'; // Capacitor Directory.Data constant value

/**
 * Lazily resolves the Capacitor Filesystem plugin.
 * Returns null when running in a web/browser context.
 */
async function resolveFs(): Promise<FilesystemPlugin | null> {
  try {
    // Dynamic import — tree-shaken on web builds if not installed
    const { Filesystem } = await import('@capacitor/filesystem' as any);
    return Filesystem as FilesystemPlugin;
  } catch {
    return null;
  }
}

async function isNative(): Promise<boolean> {
  try {
    const { Capacitor } = await import('@capacitor/core' as any);
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

@Injectable({ providedIn: 'root' })
export class CapacitorFilesystemAdapter {

  private _native: boolean | null = null;
  private _ready: Promise<void>;

  constructor() {
    this._ready = this.init();
  }

  private async init(): Promise<void> {
    this._native = await isNative();
    if (!this._native) return;

    const fs = await resolveFs();
    if (!fs) { this._native = false; return; }

    try {
      await fs.mkdir({ path: BASM_DIR, directory: DATA_DIR, recursive: true });
    } catch {
      // Directory already exists — not an error
    }
  }

  async isAvailable(): Promise<boolean> {
    await this._ready;
    return this._native === true;
  }

  // ─── Read ──────────────────────────────────────────────────────────────────

  async readItem(key: string): Promise<string | null> {
    await this._ready;
    if (!this._native) return localStorage.getItem(key);

    const fs = await resolveFs();
    if (!fs) return null;

    try {
      const result = await fs.readFile({
        path: `${BASM_DIR}/${this.sanitize(key)}.json`,
        directory: DATA_DIR,
        encoding: 'utf8',
      });
      return result.data;
    } catch {
      return null;
    }
  }

  async listKeys(prefix: string): Promise<string[]> {
    await this._ready;
    if (!this._native) {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith(prefix)) keys.push(k);
      }
      return keys;
    }

    const fs = await resolveFs();
    if (!fs) return [];

    try {
      const result = await fs.readdir({ path: BASM_DIR, directory: DATA_DIR });
      // Filter files that match prefix pattern, strip .json suffix
      return result.files
        .filter(f => f.startsWith(this.sanitize(prefix)))
        .map(f => f.replace(/\.json$/, ''));
    } catch {
      return [];
    }
  }

  // ─── Write ─────────────────────────────────────────────────────────────────

  async writeItem(key: string, value: string): Promise<void> {
    await this._ready;
    if (!this._native) { localStorage.setItem(key, value); return; }

    const fs = await resolveFs();
    if (!fs) { localStorage.setItem(key, value); return; }

    try {
      await fs.writeFile({
        path: `${BASM_DIR}/${this.sanitize(key)}.json`,
        directory: DATA_DIR,
        data: value,
        encoding: 'utf8',
        recursive: true,
      });
    } catch (e) {
      console.error('[CapacitorFS] writeFile failed, falling back to localStorage', e);
      localStorage.setItem(key, value);
    }
  }

  // ─── Delete ────────────────────────────────────────────────────────────────

  async removeItem(key: string): Promise<void> {
    await this._ready;
    if (!this._native) { localStorage.removeItem(key); return; }

    const fs = await resolveFs();
    if (!fs) { localStorage.removeItem(key); return; }

    try {
      await fs.deleteFile({
        path: `${BASM_DIR}/${this.sanitize(key)}.json`,
        directory: DATA_DIR,
      });
    } catch {
      // File may not exist — ignore
    }
    // Also clean up localStorage in case of partial migration
    localStorage.removeItem(key);
  }

  // ─── Internal ──────────────────────────────────────────────────────────────

  /** Replace characters unsafe for filesystem paths */
  private sanitize(key: string): string {
    return key.replace(/[^a-zA-Z0-9_\-]/g, '_');
  }
}
