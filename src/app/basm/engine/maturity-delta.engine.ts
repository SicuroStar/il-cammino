/**
 * BASM Maturity Delta Engine — v2.2
 *
 * Implements the temporal series mechanic:
 *
 * 1. Every BASM write produces an immutable SnapshotEvent (event sourcing).
 * 2. Each pair of consecutive snapshots generates a MaturityDelta.
 * 3. The AI pipeline reads the delta stream to compute trend and velocity.
 * 4. Projection: given N deltas, predict future maturity score at T+days.
 *
 * Storage guarantee: snapshots are append-only — nothing is overwritten.
 * This makes the history an audit-grade evidence trail.
 */

import {
  BASMDocument,
  MaturityDelta,
  MaturityPhase,
  MaturityScores,
  SnapshotEvent,
} from '../types/basm.types';

// Browser-safe hash: uses Node crypto when available (CI/CD), falls back to
// a placeholder in browser context. BasmEngineService provides the real async
// SHA-256 via SubtleCrypto for all UI-initiated saves.
declare const require: (m: string) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
function sha256Sync(data: string): string {
  try {
    const { createHash } = require('crypto');
    return createHash('sha256').update(data).digest('hex');
  } catch {
    return 'browser-hash-deferred-to-subtlecrypto';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Maturity Score Computation
// ─────────────────────────────────────────────────────────────────────────────

const PHASE_THRESHOLDS: { threshold: number; phase: MaturityPhase }[] = [
  { threshold: 0.9, phase: 'Optimizing' },
  { threshold: 0.75, phase: 'Managed' },
  { threshold: 0.55, phase: 'Defined' },
  { threshold: 0.35, phase: 'Developing' },
  { threshold: 0.0, phase: 'Initial' },
];

function phaseFromScore(score: number): MaturityPhase {
  for (const entry of PHASE_THRESHOLDS) {
    if (score >= entry.threshold) return entry.phase;
  }
  return 'Initial';
}

/**
 * Computes all three maturity dimensions from a live BASM document.
 *
 * data_completeness:
 *   Fraction of mandatory fields that are non-null / non-zero / non-empty.
 *   Mandatory fields: app_id, hourly_downtime_cost, all control names,
 *   evidence_artifacts present on each control.
 *
 * automation_ratio:
 *   Fraction of controls whose verification.method is 'Automated' or 'Hybrid'.
 *
 * compliance_index:
 *   Weighted fraction of controls whose latest_ccm_result.passed === true,
 *   weighted by the criticality implied by the control's MITRE coverage.
 */
export function computeMaturityScores(doc: BASMDocument): MaturityScores {
  const controls = doc.security_controls;
  const total = controls.length || 1;

  // --- data_completeness ---
  const mandatoryFieldsPerControl = 6; // name, status, verification, mapping, failure_management, evidence
  let populatedFields = 0;

  for (const ctrl of controls) {
    if (ctrl.name) populatedFields++;
    if (ctrl.status?.indicator && ctrl.status.indicator !== 'gray') populatedFields++;
    if (ctrl.verification?.confidence_score > 0) populatedFields++;
    if (ctrl.mapping?.iso27001) populatedFields++;
    if (ctrl.failure_management?.business_workaround) populatedFields++;
    if (ctrl.evidence_artifacts?.length > 0) populatedFields++;
  }

  const baseCompleteness = controls.length > 0
    ? populatedFields / (total * mandatoryFieldsPerControl)
    : 0;

  // bonus for OT context present
  const otBonus = doc.ot_context ? 0.05 : 0;
  // bonus for BIA fully populated
  const biaBonus =
    doc.business_impact_analysis.hourly_downtime_cost > 0 &&
    doc.business_impact_analysis.annual_revenue_at_risk > 0
      ? 0.05
      : 0;

  const data_completeness = Math.min(1, baseCompleteness + otBonus + biaBonus);

  // --- automation_ratio ---
  const automatedControls = controls.filter(
    c => c.verification?.method === 'Automated' || c.verification?.method === 'Hybrid'
  ).length;
  const automation_ratio = automatedControls / total;

  // --- compliance_index ---
  const passedControls = controls.filter(
    c => c.latest_ccm_result?.passed === true
  ).length;
  // Weight: controls with full MITRE coverage count double
  const weightedPassed = controls.reduce((sum, c) => {
    if (!c.latest_ccm_result?.passed) return sum;
    const fullCoverage = c.mapping?.mitre_attack?.some(
      m => m.control_coverage === 'full'
    );
    return sum + (fullCoverage ? 2 : 1);
  }, 0);
  const weightedTotal = controls.reduce((sum, c) => {
    const fullCoverage = c.mapping?.mitre_attack?.some(
      m => m.control_coverage === 'full'
    );
    return sum + (fullCoverage ? 2 : 1);
  }, 0);

  const compliance_index = weightedTotal > 0 ? weightedPassed / weightedTotal : 0;

  // --- composite ---
  const composite_score = parseFloat(
    (data_completeness * 0.35 + automation_ratio * 0.30 + compliance_index * 0.35).toFixed(3)
  );

  return {
    data_completeness: parseFloat(data_completeness.toFixed(3)),
    automation_ratio: parseFloat(automation_ratio.toFixed(3)),
    compliance_index: parseFloat(compliance_index.toFixed(3)),
    composite_score,
    maturity_phase: phaseFromScore(composite_score),
    computed_at: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Snapshot Event Creation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Serializes a BASM document to a deterministic JSON string
 * and returns its SHA-256 hash — used to detect document changes.
 */
export function hashDocument(doc: BASMDocument): string {
  // Exclude snapshot_history and maturity_deltas from hash
  // to avoid hash changing just because we appended a snapshot.
  const { snapshot_history, maturity_deltas, ...hashableDoc } = doc;
  const serialized = JSON.stringify(hashableDoc, Object.keys(hashableDoc).sort());
  return sha256Sync(serialized);
}

/**
 * Creates an immutable SnapshotEvent and appends it to the document.
 * Returns the updated document — the original is not mutated.
 */
export function createSnapshot(
  doc: BASMDocument,
  triggeredBy: string,
  changeSummary: string
): BASMDocument {
  const scores = computeMaturityScores(doc);
  const documentHash = hashDocument(doc);
  const sequence = (doc.snapshot_history?.length ?? 0) + 1;

  const event: SnapshotEvent = {
    sequence,
    snapshot_id: `SNAP-${doc.identity_context.app_id}-${sequence.toString().padStart(4, '0')}`,
    timestamp: new Date().toISOString(),
    triggered_by: triggeredBy,
    document_hash: documentHash,
    maturity_scores: scores,
    change_summary: changeSummary,
  };

  const updatedHistory = [...(doc.snapshot_history ?? []), event];

  // Recompute delta if we have a previous snapshot
  const updatedDeltas = [...(doc.maturity_deltas ?? [])];
  if (updatedHistory.length >= 2) {
    const prev = updatedHistory[updatedHistory.length - 2];
    const curr = updatedHistory[updatedHistory.length - 1];
    const delta = computeDelta(prev, curr, doc);
    updatedDeltas.push(delta);
  }

  return {
    ...doc,
    basm_metadata: {
      ...doc.basm_metadata,
      last_update: new Date().toISOString(),
      document_hash: documentHash,
    },
    maturity_scoring: scores,
    snapshot_history: updatedHistory,
    maturity_deltas: updatedDeltas,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Delta Computation
// ─────────────────────────────────────────────────────────────────────────────

function computeDelta(
  prev: SnapshotEvent,
  curr: SnapshotEvent,
  doc: BASMDocument
): MaturityDelta {
  const prevTime = new Date(prev.timestamp).getTime();
  const currTime = new Date(curr.timestamp).getTime();
  const elapsedDays = Math.max(0.001, (currTime - prevTime) / 86_400_000);

  const dcDelta = curr.maturity_scores.data_completeness - prev.maturity_scores.data_completeness;
  const arDelta = curr.maturity_scores.automation_ratio - prev.maturity_scores.automation_ratio;
  const ciDelta = curr.maturity_scores.compliance_index - prev.maturity_scores.compliance_index;
  const compositeDelta = curr.maturity_scores.composite_score - prev.maturity_scores.composite_score;

  const velocity = parseFloat((compositeDelta / elapsedDays).toFixed(4));

  return {
    from_snapshot: prev.snapshot_id,
    to_snapshot: curr.snapshot_id,
    elapsed_days: parseFloat(elapsedDays.toFixed(2)),
    data_completeness_delta: parseFloat(dcDelta.toFixed(3)),
    automation_ratio_delta: parseFloat(arDelta.toFixed(3)),
    compliance_index_delta: parseFloat(ciDelta.toFixed(3)),
    changed_controls: extractChangedControls(doc),
    exception_changes: [],
    improvement_velocity: velocity,
    trend: classifyTrend(velocity),
  };
}

function classifyTrend(
  velocity: number
): 'improving' | 'stable' | 'degrading' | 'volatile' {
  if (Math.abs(velocity) < 0.001) return 'stable';
  if (velocity > 0.005) return 'improving';
  if (velocity < -0.005) return 'degrading';
  return 'volatile';
}

function extractChangedControls(doc: BASMDocument): string[] {
  // In a real implementation this would diff against the previous document.
  // Here we return controls that have recent verification timestamps.
  const threshold = Date.now() - 86_400_000; // last 24h
  return doc.security_controls
    .filter(c => {
      const t = new Date(c.verification?.last_verified ?? 0).getTime();
      return t > threshold;
    })
    .map(c => c.control_id);
}

// ─────────────────────────────────────────────────────────────────────────────
// Predictive Projection (AI input)
// ─────────────────────────────────────────────────────────────────────────────

export interface MaturityProjection {
  projected_at_days: number;
  projected_composite_score: number;
  projected_phase: MaturityPhase;
  confidence_interval: { low: number; high: number };
  based_on_delta_count: number;
}

/**
 * Projects future maturity score using linear regression over the delta stream.
 *
 * This is the primary output fed to the AI for predictive risk analysis:
 * "At current velocity, this asset reaches 'Managed' maturity in ~X days."
 */
export function projectMaturity(
  doc: BASMDocument,
  futureDays: number
): MaturityProjection {
  const deltas = doc.maturity_deltas ?? [];
  const n = deltas.length;

  if (n === 0) {
    const current = doc.maturity_scoring.composite_score;
    return {
      projected_at_days: futureDays,
      projected_composite_score: current,
      projected_phase: phaseFromScore(current),
      confidence_interval: { low: current * 0.9, high: Math.min(1, current * 1.1) },
      based_on_delta_count: 0,
    };
  }

  // Weighted average velocity — more recent deltas weighted higher
  let weightedVelocity = 0;
  let totalWeight = 0;
  deltas.forEach((d, i) => {
    const weight = i + 1; // linear weight: latest delta gets weight N
    weightedVelocity += d.improvement_velocity * weight;
    totalWeight += weight;
  });
  const avgVelocity = weightedVelocity / totalWeight;

  const current = doc.maturity_scoring.composite_score;
  const projected = Math.min(1, Math.max(0, current + avgVelocity * futureDays));

  // Confidence interval widens with horizon and narrows with more data
  const uncertainty = Math.min(0.2, (futureDays / 365) * (1 / Math.sqrt(n)));

  return {
    projected_at_days: futureDays,
    projected_composite_score: parseFloat(projected.toFixed(3)),
    projected_phase: phaseFromScore(projected),
    confidence_interval: {
      low: parseFloat(Math.max(0, projected - uncertainty).toFixed(3)),
      high: parseFloat(Math.min(1, projected + uncertainty).toFixed(3)),
    },
    based_on_delta_count: n,
  };
}
