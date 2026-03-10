/**
 * BasmStoreService — in-memory AppRegistry + unified persistence.
 *
 * Persistence strategy (Sprint 5):
 *  - Web (default): localStorage
 *  - Mobile (Capacitor): CapacitorFilesystemAdapter, detected via Capacitor.isNativePlatform()
 *    → stores JSON files in APP_DATA/basm/<key>.json
 *
 * The service auto-loads all saved documents on construction.
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { BASMDocument } from '../types/basm.types';
import { BasmEngineService } from './basm-engine.service';
import { BasmValidatorService } from './basm-validator.service';
import { CapacitorFilesystemAdapter } from './capacitor-filesystem.adapter';

export const STORAGE_PREFIX = 'basm_doc_';
export const DRAFT_PREFIX   = 'basm_draft_';

@Injectable({ providedIn: 'root' })
export class BasmStoreService {

  private registry = new Map<string, BASMDocument>();

  /** Observable list of all loaded BASM documents (sorted by risk EUR desc). */
  readonly documents$ = new BehaviorSubject<BASMDocument[]>([]);

  constructor(
    private engine: BasmEngineService,
    private validator: BasmValidatorService,
    private fs: CapacitorFilesystemAdapter,
  ) {
    this.loadAll();
  }

  // ─── Read ──────────────────────────────────────────────────────────────────

  getDocument(appId: string): BASMDocument | undefined {
    return this.registry.get(appId);
  }

  getRegistry(): Map<string, BASMDocument> {
    return new Map(this.registry);
  }

  // ─── Write ─────────────────────────────────────────────────────────────────

  /**
   * Saves or updates a BASM document:
   * 1. Validates schema basics
   * 2. Creates a new snapshot event
   * 3. Persists to localStorage or Capacitor Filesystem (Sprint 5)
   * 4. Emits updated documents$ list
   */
  async upsertDocument(
    doc: BASMDocument,
    changeSummary = 'Manual save'
  ): Promise<BASMDocument> {
    const errors = this.validator.validate(doc);
    if (errors.length > 0) {
      console.warn('[BasmStore] Validation warnings:', errors);
    }

    const withSnapshot = await this.engine.createSnapshot(
      doc,
      'BasmDashboard:UI',
      changeSummary
    );

    this.registry.set(withSnapshot.identity_context.app_id, withSnapshot);
    await this.persist(withSnapshot);
    this.emit();

    return withSnapshot;
  }

  deleteDocument(appId: string): void {
    this.registry.delete(appId);
    this.fs.removeItem(STORAGE_PREFIX + appId);
    this.emit();
  }

  // ─── Draft (auto-save for interview wizard) ────────────────────────────────

  saveDraft(appId: string, partial: Partial<BASMDocument>): void {
    try {
      this.fs.writeItem(DRAFT_PREFIX + appId, JSON.stringify(partial));
    } catch {
      console.warn('[BasmStore] Draft save failed');
    }
  }

  loadDraft(appId: string): Partial<BASMDocument> | null {
    try {
      const raw = localStorage.getItem(DRAFT_PREFIX + appId);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  clearDraft(appId: string): void {
    this.fs.removeItem(DRAFT_PREFIX + appId);
  }

  // ─── Import / Export ───────────────────────────────────────────────────────

  importFromJson(jsonString: string): BASMDocument | null {
    try {
      const doc = JSON.parse(jsonString) as BASMDocument;
      const errors = this.validator.validate(doc);
      if (errors.includes('FATAL')) {
        console.error('[BasmStore] Import rejected — fatal validation error');
        return null;
      }
      this.registry.set(doc.identity_context.app_id, doc);
      this.persist(doc);
      this.emit();
      return doc;
    } catch (e) {
      console.error('[BasmStore] Import failed — invalid JSON', e);
      return null;
    }
  }

  exportToFile(appId: string): void {
    const doc = this.registry.get(appId);
    if (!doc) return;

    const blob = new Blob([JSON.stringify(doc, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `basm-${appId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ─── Internal ──────────────────────────────────────────────────────────────

  private async loadAll(): Promise<void> {
    // Web: scan localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(STORAGE_PREFIX)) continue;

      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const doc = JSON.parse(raw) as BASMDocument;
        this.registry.set(doc.identity_context.app_id, doc);
      } catch {
        console.warn(`[BasmStore] Failed to parse stored doc at key: ${key}`);
      }
    }

    // Native: scan Capacitor Filesystem for docs not already in localStorage
    if (await this.fs.isAvailable()) {
      try {
        const keys = await this.fs.listKeys(STORAGE_PREFIX);
        for (const key of keys) {
          const appId = key.replace(STORAGE_PREFIX, '');
          if (this.registry.has(appId)) continue;

          const raw = await this.fs.readItem(key);
          if (!raw) continue;
          const doc = JSON.parse(raw) as BASMDocument;
          this.registry.set(doc.identity_context.app_id, doc);
        }
      } catch (e) {
        console.warn('[BasmStore] Capacitor FS scan failed', e);
      }
    }

    this.emit();
  }

  private async persist(doc: BASMDocument): Promise<void> {
    const key = STORAGE_PREFIX + doc.identity_context.app_id;
    const value = JSON.stringify(doc);
    try {
      await this.fs.writeItem(key, value);
    } catch {
      console.error('[BasmStore] persist failed');
    }
  }

  private emit(): void {
    const docs = Array.from(this.registry.values()).sort((a, b) => {
      const riskA = a.risk_quantification?.risk_score_annualized_eur ?? 0;
      const riskB = b.risk_quantification?.risk_score_annualized_eur ?? 0;
      return riskB - riskA;
    });
    this.documents$.next(docs);
  }
}
