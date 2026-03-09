/**
 * BASM — Business Application Security Model
 * TypeScript type definitions — v3.1-DIGITAL-TWIN
 *
 * Coverage roadmap:
 *  v2.1  Truth Decay Engine      — DataLineage, StalenessCascade
 *  v2.2  Temporal Series         — SnapshotEvent, MaturityDelta
 *  v2.3  OT/ICS Layer            — OTContext, PurdueLevel
 *  v2.4  Evidence Artifacts      — EvidenceArtifact, CCMResult
 *  v3.0  Graph-Native Schema     — TypedEdge, GraphNode
 *  v3.1  Risk Intelligence       — RiskQuantification, ThreatModel, RecommendedControl,
 *                                  SecurityIncident, ControlEconomics, MITRE coverage
 */

// ─────────────────────────────────────────────────────────────────────────────
// Primitives & Enums
// ─────────────────────────────────────────────────────────────────────────────

export type ISOTimestamp = string; // ISO-8601

export type ConfidenceScore = number; // 0.0 – 1.0

export type StatusIndicator = 'green' | 'yellow' | 'red' | 'gray';

export type StalenesStatus = 'fresh' | 'stale' | 'expired' | 'unknown';

export type DataFlowDirection = 'Inbound' | 'Outbound' | 'Bidirectional';

export type AssetType = 'IT' | 'OT' | 'IoT' | 'ICS' | 'Cloud' | 'Hybrid';

export type PurdueLevel = 0 | 1 | 2 | 3 | 4 | 5; // ISA-95 Purdue Model

export type AirGapStatus = 'verified' | 'assumed' | 'none' | 'partial';

export type EvidenceType =
  | 'screenshot'
  | 'log_export'
  | 'api_response'
  | 'config_snapshot'
  | 'scan_report'
  | 'manual_attestation';

export type ControlCoverage = 'full' | 'partial' | 'none' | 'compensating';

export type EdgeType =
  | 'AUTHENTICATES_VIA'
  | 'STORES_DATA_IN'
  | 'CONTROLLED_BY'
  | 'DEPENDS_ON_NETWORK_SEGMENT'
  | 'REPLICATES_TO'
  | 'MONITORED_BY'
  | 'FEEDS_DATA_TO'
  | 'TRIGGERS'
  | 'BACKUP_OF'
  | 'ACCESSES'
  | 'ACCESSED_VIA'
  | 'SYNCS_WITH'
  | 'CONTROLS'
  | 'SHARES_DATA_WITH';

export type MaturityPhase =
  | 'Initial'
  | 'Developing'
  | 'Defined'
  | 'Managed'
  | 'Optimizing';

/** v3.1 — Data classification levels, aligned with ISO 27001 Annex A */
export type DataClassification =
  | 'Public'
  | 'Internal'
  | 'Confidential'
  | 'Restricted'
  | 'Secret';

/** v3.1 — Deployment environment type */
export type EnvironmentType =
  | 'production'
  | 'staging'
  | 'development'
  | 'dr'
  | 'test';

// ─────────────────────────────────────────────────────────────────────────────
// v2.1 — Truth Decay Engine
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tracks the provenance of every data point.
 * Without lineage, confidence_score is an opinion, not a fact.
 */
export interface DataLineage {
  /** System that generated the raw data (e.g. "Microsoft Defender ATP") */
  source_system: string;
  /** How data enters BASM — pull from API, push via webhook, manual entry */
  ingestion_method: 'API_Pull' | 'Webhook_Push' | 'Manual' | 'File_Import';
  /** SHA-256 of the raw payload at ingestion time — detects tampering */
  last_ingestion_hash: string;
  /** When the source system itself last updated the value (≠ ingestion time) */
  source_timestamp: ISOTimestamp;
  /** True only when a human has explicitly confirmed automated findings */
  verified_by_human: boolean;
  /** Identity of the human verifier, if applicable */
  verified_by?: string;
  /** Algorithm version used to compute confidence_score */
  confidence_algorithm: string;
}

/**
 * Describes how confidence degrades over time and propagates to dependents.
 *
 * Core mechanic: if this node's data becomes stale/expired, every node
 * in interconnections that depends on it inherits a degraded confidence.
 * This prevents "false greens" from propagating silently through the graph.
 */
export interface StalenessCascade {
  /** Current freshness state — computed at query time, never stored manually */
  staleness_status: StalenesStatus;
  /** When verification must happen next — explicit, not inferred from TTL */
  next_verification_due: ISOTimestamp;
  /**
   * How much confidence to subtract from dependent nodes per day of staleness.
   * Example: 0.05 = each day this node is stale, its downstream nodes lose 5%
   * confidence even if their own data is fresh.
   */
  cascade_decay_rate_per_day: number;
  /**
   * IDs of controls/nodes that inherit confidence decay from this one.
   * Populated by the graph engine — do not edit manually.
   */
  downstream_dependents: string[];
  /**
   * Minimum confidence below which the node emits a staleness_alert,
   * triggering re-verification workflow regardless of TTL.
   */
  alert_threshold: number;
  /** True when alert_threshold has been breached — activates notification pipeline */
  staleness_alert_active: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// v2.2 — Temporal Series & Maturity Delta
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Immutable snapshot event — the unit of temporal storage.
 * Every BASM write creates a new SnapshotEvent; none are overwritten.
 * This enables trend analysis, regression detection, and AI time-series input.
 */
export interface SnapshotEvent {
  /** Monotonically increasing sequence number */
  sequence: number;
  snapshot_id: string;
  timestamp: ISOTimestamp;
  /** Who or what triggered this snapshot (human, CI pipeline, scheduled job) */
  triggered_by: string;
  /** SHA-256 of the full BASM document at this point in time */
  document_hash: string;
  /** Scores at snapshot time — never recalculated retroactively */
  maturity_scores: MaturityScores;
  /** Human-readable description of what changed */
  change_summary: string;
}

/**
 * Delta between two consecutive snapshots.
 * This is the primary input for AI-driven predictive analysis.
 */
export interface MaturityDelta {
  from_snapshot: string;
  to_snapshot: string;
  elapsed_days: number;
  /** Positive = improvement, Negative = regression */
  data_completeness_delta: number;
  automation_ratio_delta: number;
  compliance_index_delta: number;
  /** Controls that changed status in this interval */
  changed_controls: string[];
  /** New exceptions activated or expired */
  exception_changes: string[];
  /**
   * Velocity: rate of maturity change per day.
   * Used by AI to project future maturity scores.
   */
  improvement_velocity: number;
  /** AI-generated trend label based on last N deltas */
  trend: 'improving' | 'stable' | 'degrading' | 'volatile';
}

export interface MaturityScores {
  /** 0.0–1.0: fraction of mandatory fields populated with non-null values */
  data_completeness: number;
  /** 0.0–1.0: fraction of controls verified via automated sources */
  automation_ratio: number;
  /** 0.0–1.0: weighted compliance coverage across all mapped frameworks */
  compliance_index: number;
  /** Composite score — weighted average of the three dimensions */
  composite_score: number;
  /** CMM-like label derived from composite_score */
  maturity_phase: MaturityPhase;
  /** When these scores were last computed */
  computed_at: ISOTimestamp;
  /** v3.1 — Industry median composite score for benchmarking (0.0–1.0) */
  industry_benchmark_median?: number;
  /** v3.1 — Top quartile composite score for aspirational target (0.0–1.0) */
  industry_benchmark_top_quartile?: number;
  /** v3.1 — Peer group used for benchmarking (e.g. "manufacturing-mid-cap-eu") */
  peer_group?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// v2.3 — OT / ICS Layer
// ─────────────────────────────────────────────────────────────────────────────

export interface FirmwareInfo {
  current_version: string;
  vendor: string;
  release_date: ISOTimestamp;
  /** Known CVEs affecting this firmware version */
  known_cves: string[];
  /** Whether patching is possible without production downtime */
  patch_requires_downtime: boolean;
  /** Date of last applied security patch */
  last_patched: ISOTimestamp;
  /** Frequency policy: 'monthly' | 'quarterly' | 'vendor_driven' | 'frozen' */
  update_policy: string;
  /** "frozen" assets require compensating controls — tracked here */
  compensating_control_ref?: string;
}

export interface OTContext {
  asset_type: AssetType;
  /**
   * Purdue Model level — determines allowed communication patterns:
   * 0 = Physical Process, 1 = Intelligent Devices (PLCs, sensors)
   * 2 = Control Systems (SCADA/DCS), 3 = Operations Zone (MES)
   * 4 = Business Planning (ERP), 5 = Enterprise Network
   */
  purdue_level: PurdueLevel;
  air_gap_status: AirGapStatus;
  /** Date air gap was last verified (e.g. via network scan or physical inspection) */
  air_gap_last_verified?: ISOTimestamp;
  firmware?: FirmwareInfo;
  /**
   * Protocol whitelist — only these should appear in network traffic.
   * Any deviation triggers an anomaly alert.
   */
  allowed_protocols: string[];
  /** OT-specific: maximum tolerable degraded-mode duration in minutes */
  degraded_mode_max_minutes: number;
  /**
   * Production throughput when running in degraded/workaround mode.
   * 1.0 = full capacity, 0.4 = 40% capacity, 0.0 = full stop.
   */
  degraded_mode_throughput_ratio: number;
  /** Physical safety implications if this asset is compromised */
  safety_impact: 'none' | 'low' | 'medium' | 'high' | 'catastrophic';
  /** IEC 62443 Security Level target for this asset */
  iec62443_target_sl: 'SL-1' | 'SL-2' | 'SL-3' | 'SL-4';
}

// ─────────────────────────────────────────────────────────────────────────────
// v2.4 — Evidence Artifacts & CCM
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A cryptographically anchored proof that a control was in a given state
 * at a given time. Eliminates manual evidence collection for audits.
 */
export interface EvidenceArtifact {
  evidence_id: string;
  type: EvidenceType;
  /** Human-readable description of what this evidence proves */
  description: string;
  /** System that generated the evidence */
  source_system: string;
  /** API endpoint or file path that produced this artifact */
  source_uri: string;
  /** SHA-256 of the artifact content — proof of integrity */
  content_hash: string;
  collected_at: ISOTimestamp;
  /** True if collected without human intervention */
  auto_collected: boolean;
  /** Base64-encoded artifact for small payloads; URI for large ones */
  payload_ref: string;
  /** Which compliance requirement this evidence satisfies */
  satisfies_requirements: string[];
  /** How long this evidence remains valid for audit purposes (days) */
  validity_days: number;
  expires_at: ISOTimestamp;
}

/**
 * Result of a single automated compliance control check.
 * This is the output of the CCM engine — one per control per run.
 */
export interface CCMResult {
  run_id: string;
  control_id: string;
  checked_at: ISOTimestamp;
  passed: boolean;
  score: number; // 0.0–1.0
  finding: string;
  remediation_hint: string;
  /** Evidence collected during this CCM run */
  evidence_refs: string[];
  /** Framework requirements satisfied by a passing result */
  requirements_satisfied: {
    iso27001?: string[];
    nis2?: string[];
    iec62443?: string[];
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// v3.0 — Graph-Native Schema
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A typed, directed edge in the application security graph.
 * Replaces the flat interconnections array with a semantically rich structure
 * compatible with Neo4j, Amazon Neptune, and graph-RAG pipelines.
 */
export interface TypedEdge {
  edge_id: string;
  /** Semantic type of the relationship */
  type: EdgeType;
  source_app_id: string;
  target_app_id: string;
  direction: DataFlowDirection;
  protocol: string;
  port?: number;
  /** Criticality of this specific data flow */
  criticality: 'Critical' | 'High' | 'Medium' | 'Low';
  /**
   * MITRE ATT&CK tactics this edge enables if compromised.
   * Structured (not free text) for automated threat modeling.
   */
  threat_tactics: MitreReference[];
  /**
   * If this edge is severed during an incident, what is the operational impact?
   * Feeds directly into blast-radius calculation.
   */
  severance_impact: string;
  /** True if traffic on this edge is encrypted */
  encrypted: boolean;
  /** True if mutual authentication is enforced on both ends */
  mutually_authenticated: boolean;
  /** Network segment this edge crosses — triggers zone-crossing alert if unexpected */
  crosses_segment_boundary: boolean;
  last_validated: ISOTimestamp;
  /** v3.1 — Classification of data flowing through this edge */
  data_classification_in_transit?: DataClassification;
  /** v3.1 — Approximate daily data volume (e.g. "50 GB/day", "continuous stream") */
  data_volume?: string;
  /** v3.1 — Authentication mechanism enforced on this edge */
  authentication_type?: 'mTLS' | 'API_Key' | 'OAuth2' | 'Kerberos' | 'NTLM' | 'Certificate' | 'None' | 'MFA';
}

/**
 * Represents this BASM node's position and metadata within the security graph.
 * Used by graph-RAG to retrieve relevant context clusters.
 */
export interface GraphNode {
  node_id: string;
  /** Semantic tags for embedding clustering and similarity search */
  semantic_tags: string[];
  /**
   * Version of the narrative text — changing this invalidates cached embeddings.
   * The RAG pipeline uses this to detect stale vector representations.
   */
  risk_narrative_version: string;
  /** Pre-computed list of nodes within 2 hops — cached for blast-radius queries */
  neighborhood_ids: string[];
  /**
   * Centrality score in the risk graph (0.0–1.0).
   * High centrality = this node is a critical junction; compromise is catastrophic.
   */
  graph_centrality: number;
  /**
   * Pre-computed blast radius: number of nodes that would be impacted
   * if this node is fully compromised.
   */
  blast_radius_node_count: number;
  /**
   * Estimated revenue at risk if this node and its blast radius go down.
   * Computed as sum of hourly_downtime_cost across all affected nodes × estimated_recovery_hours.
   */
  blast_radius_revenue_at_risk: number;
  /** v3.1 — Number of distinct MITRE ATT&CK tactics covered by this node's controls */
  mitre_tactics_covered?: number;
  /** v3.1 — Total number of MITRE ATT&CK tactics relevant to this asset type */
  mitre_tactics_total?: number;
  /**
   * v3.1 — Percentage of relevant MITRE tactics covered (0–100).
   * CALC: (mitre_tactics_covered / mitre_tactics_total) × 100
   */
  mitre_coverage_pct?: number;
  /**
   * v3.1 — List of MITRE tactic IDs with no current control coverage.
   * Direct AI query target: "which tactics are uncovered for this node?"
   */
  uncovered_critical_tactics?: string[];
  /**
   * v3.1 — Composite risk score (EUR annualized) from risk_quantification.
   * CALC: threat_event_frequency × vulnerability_probability × primary_loss_magnitude
   */
  risk_score?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// v3.1 — Risk Intelligence: FAIR Quantification
// ─────────────────────────────────────────────────────────────────────────────

/**
 * FAIR-inspired (Factor Analysis of Information Risk) quantitative risk model.
 *
 * Formula:
 *   risk_score_annualized_eur = threat_event_frequency
 *                              × vulnerability_probability
 *                              × primary_loss_magnitude
 *
 * This enables AI to rank applications by financial risk exposure and
 * compute cost-benefit ratios for recommended controls.
 */
export interface RiskQuantification {
  /**
   * Expected number of relevant threat events per year.
   * Source: threat intelligence, historical incident rates, industry data.
   * Example: 0.3 = one successful attack every ~3 years on average.
   */
  threat_event_frequency: number;
  /**
   * Probability that a threat event results in a loss (0.0–1.0).
   * Considers current control effectiveness.
   * Example: 0.6 = 60% chance a threat event overcomes defenses.
   */
  vulnerability_probability: number;
  /**
   * Expected financial loss per successful compromise (EUR).
   * Includes: downtime cost + recovery cost + regulatory fines + reputational damage.
   */
  primary_loss_magnitude: number;
  /**
   * CALC (read-only): threat_event_frequency × vulnerability_probability × primary_loss_magnitude
   * Represents expected annual loss in EUR.
   */
  risk_score_annualized_eur: number;
  /** Confidence level of these estimates (0.0–1.0) */
  confidence_level: number;
  /** Methodology used: "FAIR" | "CVSS-based" | "Expert-elicitation" | "Historical" */
  methodology: 'FAIR' | 'CVSS-based' | 'Expert-elicitation' | 'Historical';
  /** Who validated these numbers and when */
  last_reviewed_by: string;
  last_reviewed_date: ISOTimestamp;
}

// ─────────────────────────────────────────────────────────────────────────────
// v3.1 — Threat Model
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A named threat actor profile relevant to this application.
 */
export interface ThreatActor {
  actor_id: string;
  /** Common name or alias (e.g. "Sandworm", "FIN7", "Insider-Finance") */
  name: string;
  /** Threat actor category */
  type: 'nation-state' | 'cybercriminal' | 'insider' | 'hacktivist' | 'competitor';
  /** Primary motivation driving attacks */
  motivation: 'financial' | 'espionage' | 'sabotage' | 'disruption' | 'data-theft';
  /**
   * Relative capability score (1–5):
   * 1 = script-kiddie, 3 = organized crime, 5 = nation-state APT
   */
  capability_level: 1 | 2 | 3 | 4 | 5;
  /** MITRE ATT&CK group ID if mapped (e.g. "G0034" for Sandworm) */
  mitre_group_id?: string;
  /** Known TTPs (T-codes) this actor uses against similar targets */
  known_ttps: string[];
  /** Qualitative likelihood this actor targets our specific asset type */
  targeting_likelihood: 'low' | 'medium' | 'high' | 'very-high';
}

/**
 * A named, structured attack scenario for this application.
 * Used by AI to simulate attack paths and recommend defensive priorities.
 */
export interface AttackScenario {
  scenario_id: string;
  /** Human-readable scenario name (e.g. "Ransomware via phishing → lateral movement → ERP encryption") */
  name: string;
  threat_actor_ref: string; // → ThreatActor.actor_id
  /** MITRE ATT&CK kill chain steps (ordered) */
  kill_chain_steps: {
    step: number;
    tactic: string;
    technique_id: string;
    technique_name: string;
    /** Which control (if any) currently blocks this step */
    blocked_by_control?: string;
  }[];
  /** Estimated probability this scenario succeeds given current controls (0.0–1.0) */
  success_probability: number;
  /** Financial impact if this scenario succeeds (EUR) */
  estimated_impact_eur: number;
  /** Which controls, if added, would most reduce success_probability */
  mitigating_controls: string[];
}

/**
 * Structured threat model for a BASM node.
 * Aggregates threat actors and attack scenarios for AI reasoning.
 */
export interface ThreatModel {
  threat_actors: ThreatActor[];
  attack_scenarios: AttackScenario[];
  /** Primary attack vector most relevant to this asset */
  primary_attack_vector: 'network' | 'email' | 'supply-chain' | 'insider' | 'physical' | 'web';
  /** Date of last formal threat modeling review */
  last_threat_model_review: ISOTimestamp;
  /** Who conducted the threat model review */
  reviewed_by: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// v3.1 — Control Economics
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cost-benefit model for a single security control.
 * Enables AI to compute ROI and prioritize control investments.
 *
 * ROI formula:
 *   roi_payback_years = (annual_capex_eur + annual_opex_eur)
 *                     / (risk_score_annualized_eur × expected_risk_reduction_pct)
 *
 *   cost_per_risk_euro_reduced = (annual_capex_eur + annual_opex_eur)
 *                              / (risk_score_annualized_eur × expected_risk_reduction_pct)
 */
export interface ControlEconomics {
  /** Type of control: preventive stops attacks, detective finds them, corrective recovers */
  control_type: 'preventive' | 'detective' | 'corrective' | 'compensating';
  /** Annualized capital expenditure for this control (EUR) */
  annual_capex_eur: number;
  /** Annualized operational expenditure (licenses, FTE hours, etc.) (EUR) */
  annual_opex_eur: number;
  /** Implementation effort in person-days */
  implementation_days: number;
  /**
   * Fraction of annualized risk this control is expected to eliminate (0.0–1.0).
   * Example: 0.40 = this control reduces expected annual loss by 40%.
   */
  expected_risk_reduction_pct: number;
  /**
   * CALC (read-only): years until cumulative risk reduction pays back control cost.
   * roi_payback_years = total_annual_cost / (risk_annualized × risk_reduction_pct)
   */
  roi_payback_years: number;
  /**
   * CALC (read-only): EUR of annual control cost per EUR of annual risk reduced.
   * Lower = better ROI. Target: < 1.0 (spend less than you save).
   */
  cost_per_risk_euro_reduced: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// v3.1 — Recommended Controls
// ─────────────────────────────────────────────────────────────────────────────

/**
 * An AI-addressable recommendation for a control not yet implemented.
 * Distinct from SecurityControl (which tracks implemented controls).
 * Enables AI to answer: "What should I implement next for best ROI?"
 */
export interface RecommendedControl {
  recommendation_id: string;
  /** Name of the recommended control */
  name: string;
  /** Why this control is recommended for this specific application */
  rationale: string;
  /** Expected effort to implement */
  implementation_effort: 'low' | 'medium' | 'high' | 'very-high';
  /** Estimated capital expenditure to implement (EUR) */
  estimated_capex_eur: number;
  /** Estimated annual operating cost (EUR) */
  estimated_opex_eur: number;
  /**
   * Fraction of annualized risk this control would eliminate (0.0–1.0).
   * Source: industry data, vendor claims, threat model analysis.
   */
  expected_risk_reduction_pct: number;
  /**
   * CALC: estimated_capex / (risk_score_annualized × expected_risk_reduction_pct)
   * Lower = better ROI priority.
   */
  roi_payback_years_estimated: number;
  /** Priority rank among all recommendations (1 = highest) */
  priority_rank: number;
  /** Compliance gaps this control would close */
  compliance_gaps_addressed: string[];
  /** MITRE tactics this control would cover */
  mitre_tactics_addressed: string[];
  /** Current implementation status */
  status: 'proposed' | 'approved' | 'in-progress' | 'deferred' | 'rejected';
  /** Roadmap target implementation date */
  target_implementation_date?: ISOTimestamp;
}

// ─────────────────────────────────────────────────────────────────────────────
// v3.1 — Incident History
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A historical security incident affecting this application.
 * Grounds the AI's risk analysis in real-world evidence rather than theory.
 * Required for recalibrating threat_event_frequency in RiskQuantification.
 */
export interface SecurityIncident {
  incident_id: string;
  /** Date the incident was first detected */
  detected_date: ISOTimestamp;
  /** Date the incident was fully resolved */
  resolved_date?: ISOTimestamp;
  /** Incident category */
  type: 'ransomware' | 'data-breach' | 'unauthorized-access' | 'insider-threat'
      | 'supply-chain' | 'phishing' | 'vulnerability-exploit' | 'denial-of-service' | 'other';
  /** Plain-language description (no PII) */
  description: string;
  /** MITRE ATT&CK techniques observed during this incident */
  mitre_techniques_observed: string[];
  /** Total financial impact (downtime + recovery + fines) (EUR) */
  total_financial_impact_eur: number;
  /** Actual downtime duration in hours */
  downtime_hours: number;
  /** Root cause category */
  root_cause: 'missing-control' | 'misconfiguration' | 'unpatched-vulnerability'
            | 'social-engineering' | 'insider' | 'supply-chain' | 'unknown';
  /** Which control failed or was absent */
  failed_control_ref?: string;
  /** Controls added or improved as a result of this incident */
  remediation_applied: string[];
  /** Whether this incident was disclosed to regulators (NIS2, GDPR, etc.) */
  regulatory_disclosure_required: boolean;
  regulatory_disclosure_ref?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core BASM Structures (updated to compose all new types)
// ─────────────────────────────────────────────────────────────────────────────

export interface MitreReference {
  tactic_id: string;
  tactic_name: string;
  technique_id: string;
  technique_name: string;
  sub_technique_id?: string;
  /** How much of this technique does this control mitigate? */
  control_coverage: ControlCoverage;
}

export interface SecurityControl {
  control_id: string;
  name: string;
  status: {
    indicator: StatusIndicator;
    current_value: string;
    /** Confidence as currently computed — may be lower than source value due to cascade decay */
    effective_confidence: ConfidenceScore;
  };
  verification: {
    method: 'Automated' | 'Manual' | 'Hybrid';
    source: string;
    confidence_score: ConfidenceScore;
    last_verified: ISOTimestamp;
    ttl_days: number;
    /** v2.1 additions */
    lineage: DataLineage;
    staleness: StalenessCascade;
  };
  mapping: {
    iso27001: string;
    nis2: string;
    mitre_attack: MitreReference[];
    iec62443?: string;
  };
  failure_management: {
    immediate_action: string;
    business_workaround: string;
    /**
     * Does the workaround require systems that might also be compromised?
     * If true, the workaround reliability is lower during a systemic attack.
     */
    workaround_dependencies: string[];
    /** Date the workaround procedure was last tested in a drill */
    workaround_last_tested: ISOTimestamp;
    incident_playbook_ref: string;
  };
  exception: {
    is_active: boolean;
    reason: string | null;
    approved_by: string | null;
    expiry_date: ISOTimestamp | null;
    /** Risk acceptance form reference for audit trail */
    risk_acceptance_ref: string | null;
  };
  /** v2.4: Evidence artifacts proving this control's current state */
  evidence_artifacts: EvidenceArtifact[];
  /** v2.4: Latest CCM check result for this control */
  latest_ccm_result?: CCMResult;
  /** v3.1: Cost-benefit model for this control */
  economics?: ControlEconomics;
}

export interface BusinessImpactAnalysis {
  process_chain: string;
  hourly_downtime_cost: number;
  /** Annualized revenue at risk = hourly_downtime_cost × expected_incidents × avg_hours */
  annual_revenue_at_risk: number;
  cyber_insurance_coverage: number;
  /** Net exposure after insurance: annual_revenue_at_risk - cyber_insurance_coverage */
  net_financial_exposure: number;
  legal_implications: string[];
  recovery_objectives: {
    rto_hours: number;
    rpo_hours: number;
    /** Tested in a BCP drill? Untested RTOs are aspirational, not operational. */
    last_bcp_drill: ISOTimestamp;
    bcp_drill_result: 'passed' | 'failed' | 'partial' | 'never_tested';
  };
  /**
   * Threshold above which the board must be notified automatically.
   * Linked to the staleness cascade: if risk_score exceeds this, alert fires.
   */
  board_notification_threshold: number;
}

export interface ReasoningForAI {
  logic_inference: string;
  failure_cascading_effect: string;
  training_notes: string;
  /** v3.0: Semantic tags for embedding clustering — keep under 15 tags */
  semantic_tags: string[];
  /** v3.0: Increment when narrative changes to invalidate stale embeddings */
  risk_narrative_version: string;
  /**
   * Structured context for RAG chunking strategy.
   * The AI pipeline splits on these boundaries rather than arbitrary token counts.
   *
   * v3.1: each chunk carries embedding metadata so the pipeline can upsert
   * idempotently — same chunk_id always maps to the same vector slot.
   */
  rag_chunks: RAGChunk[];
}

/**
 * A single RAG chunk with full embedding lifecycle metadata.
 *
 * Embedding lifecycle:
 *  1. Pipeline reads chunk, checks embedding_valid.
 *  2. If false (or missing): re-embed → upsert → set embedding_valid=true + last_embedded=now.
 *  3. If true and content unchanged: skip — no wasted API calls.
 *  4. When risk_narrative_version changes on the parent document:
 *     pipeline sets embedding_valid=false on ALL chunks of that document.
 */
export interface RAGChunk {
  chunk_id: string;
  topic: string;
  content: string;
  /**
   * Stable UUID v4 — the vector store primary key for this chunk.
   * NEVER regenerate after first creation: changing this orphans the old vector.
   * Format: "rag-{app_id}-{chunk_id}"
   */
  embedding_id: string;
  /** Model used to produce the current embedding vector */
  embedding_model: string;
  /** ISO-8601 timestamp of the last successful embedding upsert */
  last_embedded: ISOTimestamp | null;
  /**
   * False when content has changed since last_embedded.
   * The pipeline treats false as a mandatory re-embed signal.
   * Set to false automatically when risk_narrative_version is incremented.
   */
  embedding_valid: boolean;
  /**
   * SHA-256 of the content string at last_embedded time.
   * The pipeline compares this to the current content hash to detect
   * silent content changes (e.g. edits without version bump).
   */
  content_hash: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Root BASM Document — v3.1
// ─────────────────────────────────────────────────────────────────────────────

export interface BASMDocument {
  basm_metadata: {
    schema_version: '3.1-DIGITAL-TWIN';
    last_update: ISOTimestamp;
    maturity_tier_logic: string;
    author_role: string;
    /** SHA-256 of this document — used for snapshot integrity verification */
    document_hash: string;
  };

  identity_context: {
    app_id: string;
    name: string;
    business_owner: {
      name: string;
      department: string;
      contact: string;
    };
    technical_lead: string;
    criticality_class: 'Tier-1-Gold' | 'Tier-2-Silver' | 'Tier-3-Bronze';
    /** v3.1 — Deployment environment */
    environment?: EnvironmentType;
    /** v3.1 — Whether this application is directly reachable from the internet */
    external_facing?: boolean;
    /** v3.1 — Approximate number of active users (internal + external) */
    user_count_approx?: number;
    /** v3.1 — Highest data classification handled by this application */
    data_classification?: DataClassification;
    /** v3.1 — Date the physical/virtual asset was first deployed */
    asset_install_date?: ISOTimestamp;
    /** v3.1 — End-of-life date for this asset/version (null if not yet known) */
    asset_eol_date?: ISOTimestamp | null;
    /** v3.1 — Primary vendor/manufacturer name */
    vendor_name?: string;
    /** v3.1 — Date the vendor support contract expires */
    support_contract_expiry?: ISOTimestamp | null;
  };

  /** v2.3 — OT/ICS context (null for pure IT assets) */
  ot_context: OTContext | null;

  business_impact_analysis: BusinessImpactAnalysis;

  security_controls: SecurityControl[];

  /** v3.0 — Typed edges replacing flat interconnections array */
  graph_edges: TypedEdge[];

  /** v3.0 — Graph node metadata for Digital Twin positioning */
  graph_node: GraphNode;

  reasoning_for_ai: ReasoningForAI;

  /** v2.2 — Current maturity scores (computed, not manually entered) */
  maturity_scoring: MaturityScores;

  /**
   * v2.2 — Append-only event log.
   * Each BASM update appends a SnapshotEvent; nothing is deleted.
   * The latest entry is always snapshot_history[snapshot_history.length - 1].
   */
  snapshot_history: SnapshotEvent[];

  /**
   * v2.2 — Ordered list of deltas between consecutive snapshots.
   * Input stream for AI-driven maturity trend analysis.
   */
  maturity_deltas: MaturityDelta[];

  /**
   * v3.1 — FAIR-based quantitative risk model.
   * Enables AI to rank applications by annualized financial risk exposure
   * and compute cost-benefit ratios for control investments.
   */
  risk_quantification: RiskQuantification;

  /**
   * v3.1 — Structured threat model: actors + attack scenarios.
   * Grounds AI analysis in named threat actors and realistic kill chains.
   */
  threat_model: ThreatModel;

  /**
   * v3.1 — AI-addressable control recommendations (not yet implemented).
   * Enables AI to answer: "What should I implement next for best ROI?"
   */
  recommended_controls: RecommendedControl[];

  /**
   * v3.1 — Historical security incidents affecting this application.
   * Grounds risk quantification in real-world evidence.
   * Required for recalibrating threat_event_frequency in RiskQuantification.
   */
  incident_history: SecurityIncident[];
}
