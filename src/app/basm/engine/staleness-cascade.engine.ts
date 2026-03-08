/**
 * BASM Truth Decay Engine — v2.1
 *
 * Implements the "propagation of uncertainty" mechanic:
 *
 * 1. Each control has a confidence_score and a TTL.
 * 2. When TTL expires, the control enters "stale" then "expired" state.
 * 3. Staleness propagates to downstream dependents via cascade_decay_rate_per_day.
 * 4. Effective confidence of a downstream node = own_confidence − accumulated_decay
 * 5. When effective_confidence drops below alert_threshold → staleness_alert fires.
 *
 * This prevents silent "false greens" from masking real risk in the graph.
 */

import {
  BASMDocument,
  ConfidenceScore,
  SecurityControl,
  StalenessCascade,
  StalenesStatus,
} from '../types/basm.types';

// ─────────────────────────────────────────────────────────────────────────────
// Core staleness computation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the staleness status for a control based on its TTL and last_verified.
 *
 * States:
 *  fresh   — within TTL
 *  stale   — past TTL but within 2× TTL (grace period, still usable but alert)
 *  expired — past 2× TTL (data must be treated as unreliable)
 *  unknown — last_verified is null / unparseable
 */
export function computeStalenessStatus(
  lastVerified: string,
  ttlDays: number,
  now: Date = new Date()
): StalenesStatus {
  if (!lastVerified) return 'unknown';

  const verified = new Date(lastVerified);
  if (isNaN(verified.getTime())) return 'unknown';

  const elapsedDays = (now.getTime() - verified.getTime()) / 86_400_000;

  if (elapsedDays <= ttlDays) return 'fresh';
  if (elapsedDays <= ttlDays * 2) return 'stale';
  return 'expired';
}

/**
 * Computes how much confidence a control loses due to its own staleness.
 *
 * Decay formula (linear):
 *   own_decay = max(0, (elapsed_days - ttl_days) × 0.1)
 *
 * Capped at 0.5 — staleness alone cannot zero out confidence,
 * since the control may still be partially valid.
 */
export function computeOwnDecay(
  lastVerified: string,
  ttlDays: number,
  now: Date = new Date()
): number {
  if (!lastVerified) return 0.5;

  const verified = new Date(lastVerified);
  if (isNaN(verified.getTime())) return 0.5;

  const elapsedDays = (now.getTime() - verified.getTime()) / 86_400_000;
  const overdueDays = Math.max(0, elapsedDays - ttlDays);

  return Math.min(0.5, overdueDays * 0.1);
}

/**
 * Computes the effective confidence score for a control:
 *   effective = base_confidence − own_decay − accumulated_cascade_decay
 *
 * cascade_decay comes from upstream nodes that are stale/expired.
 */
export function computeEffectiveConfidence(
  baseConfidence: ConfidenceScore,
  ownDecay: number,
  accumulatedCascadeDecay: number
): ConfidenceScore {
  return Math.max(0, baseConfidence - ownDecay - accumulatedCascadeDecay);
}

// ─────────────────────────────────────────────────────────────────────────────
// Graph propagation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ControlGraphNode represents a simplified node used internally
 * during cascade propagation — avoids circular dependencies.
 */
interface ControlGraphNode {
  control_id: string;
  base_confidence: ConfidenceScore;
  last_verified: string;
  ttl_days: number;
  cascade_decay_rate_per_day: number;
  downstream_dependents: string[];
  alert_threshold: number;
}

/**
 * For each control, computes cascade decay received from all upstream stale nodes.
 *
 * Algorithm:
 *  - Build a reverse adjacency map (upstream → downstream)
 *  - BFS from each stale/expired node
 *  - Each hop accumulates: decay_rate × days_overdue
 *  - Total cascade decay for a node = sum of decay from all upstream paths
 *
 * Returns a map: control_id → total_cascade_decay_received
 */
export function propagateStaleness(
  controls: ControlGraphNode[],
  now: Date = new Date()
): Map<string, number> {
  const cascadeMap = new Map<string, number>();

  // Initialize all to zero
  controls.forEach(c => cascadeMap.set(c.control_id, 0));

  for (const upstream of controls) {
    const verified = new Date(upstream.last_verified);
    if (isNaN(verified.getTime())) continue;

    const elapsedDays = (now.getTime() - verified.getTime()) / 86_400_000;
    const overdueDays = Math.max(0, elapsedDays - upstream.ttl_days);

    if (overdueDays === 0) continue; // fresh node — no cascade

    const decayContribution = upstream.cascade_decay_rate_per_day * overdueDays;

    // Propagate to direct downstream dependents
    for (const downstreamId of upstream.downstream_dependents) {
      const existing = cascadeMap.get(downstreamId) ?? 0;
      cascadeMap.set(downstreamId, existing + decayContribution);
    }
  }

  return cascadeMap;
}

// ─────────────────────────────────────────────────────────────────────────────
// Full document evaluation
// ─────────────────────────────────────────────────────────────────────────────

export interface ControlTruthReport {
  control_id: string;
  control_name: string;
  base_confidence: ConfidenceScore;
  own_decay: number;
  cascade_decay: number;
  effective_confidence: ConfidenceScore;
  staleness_status: StalenesStatus;
  staleness_alert_active: boolean;
  next_verification_due: string;
}

export interface DocumentTruthReport {
  evaluated_at: string;
  document_id: string;
  /** Average effective confidence across all controls */
  overall_truth_score: number;
  /** Number of controls with staleness_alert_active */
  active_alerts: number;
  controls: ControlTruthReport[];
  /** Controls sorted by effective_confidence ASC — highest risk first */
  risk_ranked: string[];
}

/**
 * Evaluates the entire BASM document and returns a truth report.
 * This is called by the AI pipeline before generating any risk analysis
 * to ensure it does not reason on stale data.
 */
export function evaluateDocumentTruth(
  doc: BASMDocument,
  now: Date = new Date()
): DocumentTruthReport {
  // Build simplified graph nodes for propagation
  const graphNodes: ControlGraphNode[] = doc.security_controls.map(ctrl => ({
    control_id: ctrl.control_id,
    base_confidence: ctrl.verification.confidence_score,
    last_verified: ctrl.verification.last_verified,
    ttl_days: ctrl.verification.ttl_days,
    cascade_decay_rate_per_day:
      ctrl.verification.staleness.cascade_decay_rate_per_day,
    downstream_dependents:
      ctrl.verification.staleness.downstream_dependents,
    alert_threshold: ctrl.verification.staleness.alert_threshold,
  }));

  const cascadeMap = propagateStaleness(graphNodes, now);

  const controlReports: ControlTruthReport[] = graphNodes.map(node => {
    const ownDecay = computeOwnDecay(node.last_verified, node.ttl_days, now);
    const cascadeDecay = Math.min(0.4, cascadeMap.get(node.control_id) ?? 0);
    const effectiveConfidence = computeEffectiveConfidence(
      node.base_confidence,
      ownDecay,
      cascadeDecay
    );
    const stalenessStatus = computeStalenessStatus(
      node.last_verified,
      node.ttl_days,
      now
    );
    const alertActive = effectiveConfidence < node.alert_threshold;
    const nextVerification = computeNextVerificationDue(
      node.last_verified,
      node.ttl_days
    );

    return {
      control_id: node.control_id,
      control_name:
        doc.security_controls.find(c => c.control_id === node.control_id)
          ?.name ?? 'Unknown',
      base_confidence: node.base_confidence,
      own_decay: ownDecay,
      cascade_decay: cascadeDecay,
      effective_confidence: effectiveConfidence,
      staleness_status: stalenessStatus,
      staleness_alert_active: alertActive,
      next_verification_due: nextVerification,
    };
  });

  const activeAlerts = controlReports.filter(r => r.staleness_alert_active).length;
  const overallTruthScore =
    controlReports.reduce((sum, r) => sum + r.effective_confidence, 0) /
    (controlReports.length || 1);

  const riskRanked = [...controlReports]
    .sort((a, b) => a.effective_confidence - b.effective_confidence)
    .map(r => r.control_id);

  return {
    evaluated_at: now.toISOString(),
    document_id: doc.identity_context.app_id,
    overall_truth_score: parseFloat(overallTruthScore.toFixed(3)),
    active_alerts: activeAlerts,
    controls: controlReports,
    risk_ranked: riskRanked,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function computeNextVerificationDue(
  lastVerified: string,
  ttlDays: number
): string {
  const verified = new Date(lastVerified);
  if (isNaN(verified.getTime())) return new Date().toISOString();
  const next = new Date(verified.getTime() + ttlDays * 86_400_000);
  return next.toISOString();
}

/**
 * Applies the truth report results back to the BASM document,
 * updating effective_confidence and staleness fields in place.
 * Returns the mutated document (immutable copy recommended in production).
 */
export function applyTruthReport(
  doc: BASMDocument,
  report: DocumentTruthReport
): BASMDocument {
  const reportMap = new Map(report.controls.map(r => [r.control_id, r]));

  const updatedControls: SecurityControl[] = doc.security_controls.map(ctrl => {
    const r = reportMap.get(ctrl.control_id);
    if (!r) return ctrl;

    const updatedStaleness: StalenessCascade = {
      ...ctrl.verification.staleness,
      staleness_status: r.staleness_status,
      next_verification_due: r.next_verification_due,
      staleness_alert_active: r.staleness_alert_active,
    };

    return {
      ...ctrl,
      status: {
        ...ctrl.status,
        effective_confidence: r.effective_confidence,
      },
      verification: {
        ...ctrl.verification,
        staleness: updatedStaleness,
      },
    };
  });

  return { ...doc, security_controls: updatedControls };
}
