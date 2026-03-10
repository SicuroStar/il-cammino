/**
 * BASM Evidence Collector Engine — v2.4
 *
 * Implements automated evidence collection and CCM (Continuous Controls Monitoring).
 *
 * Mechanics:
 * 1. Each control defines a verification.source (API endpoint or system name).
 * 2. The collector fetches the raw payload, hashes it, and stores an EvidenceArtifact.
 * 3. A CCMResult is produced: passed/failed + compliance requirements satisfied.
 * 4. Evidence is cryptographically anchored (SHA-256) — audit-grade, no manual intervention.
 *
 * Adapter pattern: each source system has a CollectorAdapter.
 * New integrations (CrowdStrike, Tenable, SAP GRC…) add a new adapter only.
 */

// Browser-safe hash: uses Node crypto when available (CI/CD pipeline), falls
// back to a placeholder in browser context.
declare const require: (m: string) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
function sha256Sync(data: string): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createHash } = require('crypto');
    return createHash('sha256').update(data).digest('hex');
  } catch {
    return 'browser-hash-deferred-to-subtlecrypto';
  }
}
import {
  BASMDocument,
  CCMResult,
  EvidenceArtifact,
  EvidenceType,
  SecurityControl,
} from '../types/basm.types';

// ─────────────────────────────────────────────────────────────────────────────
// Adapter interface — implement one per source system
// ─────────────────────────────────────────────────────────────────────────────

export interface RawEvidence {
  source_system: string;
  source_uri: string;
  payload: string;           // raw JSON / XML / log line
  fetched_at: string;        // ISO-8601
  http_status?: number;
  error?: string;
}

export interface CollectorAdapter {
  /** Unique identifier matching verification.source in the BASM control */
  sourceId: string;
  /** Human-readable name */
  label: string;
  /**
   * Fetches current state of the control from the source system.
   * Must be idempotent — may be called multiple times per run.
   */
  fetch(control: SecurityControl): Promise<RawEvidence>;
  /**
   * Interprets the raw payload and returns pass/fail + score (0.0–1.0).
   * Also extracts which compliance requirements are satisfied.
   */
  evaluate(
    raw: RawEvidence,
    control: SecurityControl
  ): {
    passed: boolean;
    score: number;
    finding: string;
    remediation_hint: string;
    requirements_satisfied: CCMResult['requirements_satisfied'];
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Built-in adapters (stubs — replace fetch() body with real HTTP calls)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Microsoft Defender for Endpoint — checks EDR coverage and health.
 */
export const DefenderAdapter: CollectorAdapter = {
  sourceId: 'Defender API',
  label: 'Microsoft Defender for Endpoint',

  async fetch(control: SecurityControl): Promise<RawEvidence> {
    // Real implementation: GET /api/machines?$filter=...
    // Stubbed for portability — swap with real fetch() in production
    return {
      source_system: 'Microsoft Defender ATP',
      source_uri: 'https://api.securitycenter.microsoft.com/api/machines',
      payload: JSON.stringify({
        onboardingStatus: 'Onboarded',
        healthStatus: 'Active',
        riskScore: 'Low',
        aadDeviceId: control.control_id,
        lastSeen: new Date().toISOString(),
      }),
      fetched_at: new Date().toISOString(),
      http_status: 200,
    };
  },

  evaluate(raw, _control) {
    const data = JSON.parse(raw.payload);
    const passed =
      data.onboardingStatus === 'Onboarded' &&
      data.healthStatus === 'Active' &&
      data.riskScore !== 'High';

    return {
      passed,
      score: passed ? 1.0 : data.healthStatus === 'Active' ? 0.5 : 0.0,
      finding: passed
        ? 'EDR agent onboarded, active, and low risk.'
        : `EDR issue: status=${data.onboardingStatus}, health=${data.healthStatus}, risk=${data.riskScore}`,
      remediation_hint: passed
        ? ''
        : 'Re-onboard the device to Defender ATP and verify agent health.',
      requirements_satisfied: passed
        ? {
            iso27001: ['A.8.7', 'A.8.16'],
            nis2: ['Art. 21.2(e)'],
            iec62443: ['SR 3.2'],
          }
        : {},
    };
  },
};

/**
 * Azure Active Directory — checks MFA enrollment and policy compliance.
 */
export const AzureADAdapter: CollectorAdapter = {
  sourceId: 'Azure AD API',
  label: 'Azure Active Directory / Entra ID',

  async fetch(control: SecurityControl): Promise<RawEvidence> {
    return {
      source_system: 'Azure AD',
      source_uri: 'https://graph.microsoft.com/v1.0/users?$filter=...',
      payload: JSON.stringify({
        mfaEnrollmentRate: 0.97,
        conditionalAccessPolicies: ['MFA-All-Users', 'Block-Legacy-Auth'],
        privilegedAccountsMfaRate: 1.0,
      }),
      fetched_at: new Date().toISOString(),
      http_status: 200,
    };
  },

  evaluate(raw, _control) {
    const data = JSON.parse(raw.payload);
    const passed =
      data.mfaEnrollmentRate >= 0.95 && data.privilegedAccountsMfaRate === 1.0;

    return {
      passed,
      score: parseFloat(
        ((data.mfaEnrollmentRate + data.privilegedAccountsMfaRate) / 2).toFixed(2)
      ),
      finding: `MFA enrollment: ${(data.mfaEnrollmentRate * 100).toFixed(0)}% users, ${(data.privilegedAccountsMfaRate * 100).toFixed(0)}% privileged accounts.`,
      remediation_hint: passed
        ? ''
        : 'Enforce MFA via Conditional Access for all users. Privileged accounts must be 100%.',
      requirements_satisfied: passed
        ? {
            iso27001: ['A.9.4.2'],
            nis2: ['Art. 21.2(j)'],
          }
        : {},
    };
  },
};

/**
 * Vulnerability Scanner (Tenable / Qualys / OpenVAS) — checks patch status.
 */
export const VulnScannerAdapter: CollectorAdapter = {
  sourceId: 'Vulnerability Scanner',
  label: 'Vulnerability Scanner (Tenable/Qualys)',

  async fetch(control: SecurityControl): Promise<RawEvidence> {
    return {
      source_system: 'Tenable.io',
      source_uri: 'https://cloud.tenable.com/workbenches/assets/vulnerabilities',
      payload: JSON.stringify({
        critical_count: 0,
        high_count: 2,
        medium_count: 7,
        last_scan: new Date(Date.now() - 86_400_000).toISOString(),
        scan_coverage: 1.0,
      }),
      fetched_at: new Date().toISOString(),
      http_status: 200,
    };
  },

  evaluate(raw, _control) {
    const data = JSON.parse(raw.payload);
    const passed = data.critical_count === 0 && data.high_count <= 5;
    const score = passed
      ? Math.max(0, 1.0 - data.high_count * 0.05 - data.medium_count * 0.01)
      : 0.0;

    return {
      passed,
      score: parseFloat(score.toFixed(2)),
      finding: `Vuln counts — Critical: ${data.critical_count}, High: ${data.high_count}, Medium: ${data.medium_count}.`,
      remediation_hint: passed
        ? ''
        : `Remediate ${data.critical_count} critical and ${data.high_count} high vulnerabilities within SLA.`,
      requirements_satisfied: passed
        ? {
            iso27001: ['A.8.8'],
            nis2: ['Art. 21.2(e)'],
          }
        : {},
    };
  },
};

// Registry — add new adapters here
const ADAPTER_REGISTRY: CollectorAdapter[] = [
  DefenderAdapter,
  AzureADAdapter,
  VulnScannerAdapter,
];

function resolveAdapter(source: string): CollectorAdapter | undefined {
  return ADAPTER_REGISTRY.find(
    a => a.sourceId.toLowerCase() === source.toLowerCase()
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Evidence artifact construction
// ─────────────────────────────────────────────────────────────────────────────

function buildEvidenceArtifact(
  raw: RawEvidence,
  control: SecurityControl,
  satisfiedRequirements: string[]
): EvidenceArtifact {
  const contentHash = sha256Sync(raw.payload);

  const type: EvidenceType =
    raw.http_status !== undefined ? 'api_response' : 'log_export';

  const validityDays = control.verification.ttl_days;
  const expiresAt = new Date(
    new Date(raw.fetched_at).getTime() + validityDays * 86_400_000
  ).toISOString();

  return {
    evidence_id: `EVD-${control.control_id}-${Date.now()}`,
    type,
    description: `Automated evidence for ${control.name} from ${raw.source_system}`,
    source_system: raw.source_system,
    source_uri: raw.source_uri,
    content_hash: `sha256:${contentHash}`,
    collected_at: raw.fetched_at,
    auto_collected: true,
    payload_ref: Buffer.from(raw.payload).toString('base64'),
    satisfies_requirements: satisfiedRequirements,
    validity_days: validityDays,
    expires_at: expiresAt,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CCM Run
// ─────────────────────────────────────────────────────────────────────────────

export interface CCMRunReport {
  run_id: string;
  started_at: string;
  completed_at: string;
  document_id: string;
  controls_checked: number;
  controls_passed: number;
  controls_failed: number;
  controls_skipped: number;
  overall_compliance_score: number;
  results: CCMResult[];
  evidence_collected: EvidenceArtifact[];
}

/**
 * Runs a full CCM cycle on a BASM document.
 *
 * For each control:
 *  1. Resolves the adapter matching verification.source
 *  2. Fetches raw evidence
 *  3. Evaluates pass/fail
 *  4. Creates an EvidenceArtifact with SHA-256 hash
 *  5. Produces a CCMResult
 *
 * Returns the updated document and a CCM run report.
 */
export async function runCCMCycle(
  doc: BASMDocument
): Promise<{ updatedDoc: BASMDocument; report: CCMRunReport }> {
  const runId = `CCM-${doc.identity_context.app_id}-${Date.now()}`;
  const startedAt = new Date().toISOString();

  const results: CCMResult[] = [];
  const allEvidence: EvidenceArtifact[] = [];
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  const updatedControls: SecurityControl[] = [];

  for (const control of doc.security_controls) {
    const adapter = resolveAdapter(control.verification.source);

    if (!adapter) {
      skipped++;
      updatedControls.push(control);
      continue;
    }

    try {
      const raw = await adapter.fetch(control);
      const evaluation = adapter.evaluate(raw, control);

      // Flatten satisfied requirements for EvidenceArtifact
      const flatRequirements = [
        ...(evaluation.requirements_satisfied.iso27001 ?? []),
        ...(evaluation.requirements_satisfied.nis2 ?? []),
        ...(evaluation.requirements_satisfied.iec62443 ?? []),
      ];

      const artifact = buildEvidenceArtifact(raw, control, flatRequirements);
      allEvidence.push(artifact);

      const ccmResult: CCMResult = {
        run_id: runId,
        control_id: control.control_id,
        checked_at: new Date().toISOString(),
        passed: evaluation.passed,
        score: evaluation.score,
        finding: evaluation.finding,
        remediation_hint: evaluation.remediation_hint,
        evidence_refs: [artifact.evidence_id],
        requirements_satisfied: evaluation.requirements_satisfied,
      };

      results.push(ccmResult);
      evaluation.passed ? passed++ : failed++;

      // Update confidence_score based on CCM result
      const newConfidence = parseFloat(
        (
          control.verification.confidence_score * 0.3 +
          evaluation.score * 0.7
        ).toFixed(3)
      );

      updatedControls.push({
        ...control,
        verification: {
          ...control.verification,
          confidence_score: newConfidence,
          last_verified: new Date().toISOString(),
        },
        evidence_artifacts: [
          ...control.evidence_artifacts,
          artifact,
        ],
        latest_ccm_result: ccmResult,
      });
    } catch (err) {
      skipped++;
      updatedControls.push(control);
    }
  }

  const completedAt = new Date().toISOString();
  const overallScore =
    results.length > 0
      ? parseFloat(
          (results.reduce((s, r) => s + r.score, 0) / results.length).toFixed(3)
        )
      : 0;

  const report: CCMRunReport = {
    run_id: runId,
    started_at: startedAt,
    completed_at: completedAt,
    document_id: doc.identity_context.app_id,
    controls_checked: passed + failed,
    controls_passed: passed,
    controls_failed: failed,
    controls_skipped: skipped,
    overall_compliance_score: overallScore,
    results,
    evidence_collected: allEvidence,
  };

  const updatedDoc: BASMDocument = {
    ...doc,
    security_controls: updatedControls,
  };

  return { updatedDoc, report };
}
