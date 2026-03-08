/**
 * BASM — Business Application Security Model
 * TypeScript type definitions — v3.0-DIGITAL-TWIN
 *
 * Coverage roadmap:
 *  v2.1  Truth Decay Engine      — DataLineage, StalenessCascade
 *  v2.2  Temporal Series         — SnapshotEvent, MaturityDelta
 *  v2.3  OT/ICS Layer            — OTContext, PurdueLevel
 *  v2.4  Evidence Artifacts      — EvidenceArtifact, CCMResult
 *  v3.0  Graph-Native Schema     — TypedEdge, GraphNode
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
  | 'BACKUP_OF';

export type MaturityPhase =
  | 'Initial'
  | 'Developing'
  | 'Defined'
  | 'Managed'
  | 'Optimizing';

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
   */
  rag_chunks: {
    chunk_id: string;
    topic: string;
    content: string;
  }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Root BASM Document — v3.0
// ─────────────────────────────────────────────────────────────────────────────

export interface BASMDocument {
  basm_metadata: {
    schema_version: '3.0-DIGITAL-TWIN';
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
}
