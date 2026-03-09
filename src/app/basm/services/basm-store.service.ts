/**
 * BasmStoreService — in-memory AppRegistry + localStorage persistence.
 *
 * Persistence strategy:
 *  - Web (default): localStorage, key = `basm_doc_${appId}`
 *  - Mobile (Capacitor): detected via Capacitor.isNativePlatform()
 *    → delegates to CapacitorFilesystemAdapter (added in Sprint 5)
 *
 * The service auto-loads all saved documents on construction.
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { BASMDocument } from '../types/basm.types';
import { BasmEngineService } from './basm-engine.service';
import { BasmValidatorService } from './basm-validator.service';

const STORAGE_PREFIX = 'basm_doc_';
const DRAFT_PREFIX   = 'basm_draft_';

@Injectable({ providedIn: 'root' })
export class BasmStoreService {

  private registry = new Map<string, BASMDocument>();

  /** Observable list of all loaded BASM documents (sorted by risk EUR desc). */
  readonly documents$ = new BehaviorSubject<BASMDocument[]>([]);

  constructor(
    private engine: BasmEngineService,
    private validator: BasmValidatorService,
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
   * 3. Persists to localStorage
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
    this.persist(withSnapshot);
    this.emit();

    return withSnapshot;
  }

  deleteDocument(appId: string): void {
    this.registry.delete(appId);
    localStorage.removeItem(STORAGE_PREFIX + appId);
    this.emit();
  }

  // ─── Draft (auto-save for interview wizard) ────────────────────────────────

  saveDraft(appId: string, partial: Partial<BASMDocument>): void {
    try {
      localStorage.setItem(DRAFT_PREFIX + appId, JSON.stringify(partial));
    } catch {
      console.warn('[BasmStore] Draft save failed (storage full?)');
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
    localStorage.removeItem(DRAFT_PREFIX + appId);
  }

  // ─── Import / Export ───────────────────────────────────────────────────────

  /**
   * Imports a BASM document from a JSON string (e.g. from file upload).
   * Returns the doc if valid, null otherwise.
   */
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

  /**
   * Triggers a browser file download of a single BASM document as JSON.
   */
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

  private loadAll(): void {
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
    this.emit();
  }

  private persist(doc: BASMDocument): void {
    try {
      localStorage.setItem(
        STORAGE_PREFIX + doc.identity_context.app_id,
        JSON.stringify(doc)
      );
    } catch {
      console.error('[BasmStore] localStorage full — cannot persist document');
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
