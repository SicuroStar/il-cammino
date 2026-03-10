/**
 * BasmEngineService — Angular wrapper for the 4 BASM pure-function engines.
 *
 * Key concern: maturity-delta.engine.ts uses `require('crypto')` (Node.js only).
 * This service re-implements hashing using the browser's SubtleCrypto API.
 */

import { Injectable } from '@angular/core';

import {
  AppRegistry,
  BlastRadiusResult,
  calculateBlastRadius,
} from '../engine/graph-analyzer.engine';
import { computeMaturityScores } from '../engine/maturity-delta.engine';
import {
  computeStalenessStatus,
  DocumentTruthReport,
  evaluateDocumentTruth,
} from '../engine/staleness-cascade.engine';
import {
  BASMDocument,
  MaturityPhase,
  MaturityScores,
  SnapshotEvent,
  StalenesStatus,
} from '../types/basm.types';

// Re-export types needed by pages/components
export {
  AppRegistry,
  BlastRadiusResult,
} from '../engine/graph-analyzer.engine';
export {
  ControlTruthReport,
  DocumentTruthReport,
} from '../engine/staleness-cascade.engine';

@Injectable({ providedIn: 'root' })
export class BasmEngineService {

  // ─── Maturity scoring ──────────────────────────────────────────────────────

  computeMaturityScores(doc: BASMDocument): MaturityScores {
    return computeMaturityScores(doc);
  }

  phaseLabel(score: number): MaturityPhase {
    if (score >= 0.9) return 'Optimizing';
    if (score >= 0.75) return 'Managed';
    if (score >= 0.55) return 'Defined';
    if (score >= 0.35) return 'Developing';
    return 'Initial';
  }

  // ─── Truth decay / staleness ───────────────────────────────────────────────

  evaluateDocumentTruth(doc: BASMDocument): DocumentTruthReport {
    return evaluateDocumentTruth(doc);
  }

  computeStalenessStatus(
    lastVerified: string,
    ttlDays: number,
    now: Date = new Date()
  ): StalenesStatus {
    return computeStalenessStatus(lastVerified, ttlDays, now);
  }

  // ─── Graph analysis ────────────────────────────────────────────────────────

  calculateBlastRadius(
    originId: string,
    registry: AppRegistry,
    maxDepth = 5
  ): BlastRadiusResult {
    return calculateBlastRadius(originId, registry, maxDepth);
  }

  buildRegistry(docs: BASMDocument[]): AppRegistry {
    const map: AppRegistry = new Map();
    docs.forEach(d => map.set(d.identity_context.app_id, d));
    return map;
  }

  // ─── Hashing (SubtleCrypto replaces Node crypto) ──────────────────────────

  async hashDocument(doc: BASMDocument): Promise<string> {
    const { snapshot_history, maturity_deltas, ...hashableDoc } = doc as any;
    const sortedKeys = Object.keys(hashableDoc).sort();
    const serialized = JSON.stringify(hashableDoc, sortedKeys);
    const buffer = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(serialized)
    );
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // ─── Snapshot creation (async due to SubtleCrypto) ────────────────────────

  async createSnapshot(
    doc: BASMDocument,
    triggeredBy: string,
    changeSummary: string
  ): Promise<BASMDocument> {
    const scores = computeMaturityScores(doc);
    const documentHash = await this.hashDocument(doc);
    const sequence = (doc.snapshot_history?.length ?? 0) + 1;

    const event: SnapshotEvent = {
      sequence,
      snapshot_id: `SNAP-${doc.identity_context.app_id}-${sequence
        .toString()
        .padStart(4, '0')}`,
      timestamp: new Date().toISOString(),
      triggered_by: triggeredBy,
      document_hash: documentHash,
      maturity_scores: scores,
      change_summary: changeSummary,
    };

    const updatedHistory = [...(doc.snapshot_history ?? []), event];

    return {
      ...doc,
      basm_metadata: {
        ...doc.basm_metadata,
        last_update: new Date().toISOString(),
        document_hash: documentHash,
      },
      maturity_scoring: scores,
      snapshot_history: updatedHistory,
    };
  }
}
