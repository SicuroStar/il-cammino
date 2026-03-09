/**
 * BASM Graph Analyzer Engine — v3.0
 *
 * Implements the Digital Twin graph mechanics:
 *
 * 1. Blast Radius Calculation — BFS from a compromised node across TypedEdges.
 *    Result: count of impacted nodes + aggregated revenue at risk.
 *
 * 2. Graph Centrality — identifies junction nodes whose compromise
 *    would maximally impact the overall security graph.
 *
 * 3. Lateral Movement Paths — enumerates attack paths between two nodes
 *    following edges annotated with MITRE lateral movement tactics.
 *
 * 4. RAG Context Builder — assembles the graph neighborhood of a node
 *    into a structured prompt context for AI risk analysis.
 *
 * All functions operate on a multi-document registry (app_id → BASMDocument)
 * representing the full enterprise application graph.
 */

import {
  BASMDocument,
  EdgeType,
  TypedEdge,
} from '../types/basm.types';

export type AppRegistry = Map<string, BASMDocument>;

// ─────────────────────────────────────────────────────────────────────────────
// Graph construction
// ─────────────────────────────────────────────────────────────────────────────

interface AdjacencyEntry {
  targetId: string;
  edge: TypedEdge;
}

/**
 * Builds a directed adjacency list from all edges across all documents.
 * Bidirectional edges produce two entries.
 */
export function buildAdjacency(
  registry: AppRegistry
): Map<string, AdjacencyEntry[]> {
  const adj = new Map<string, AdjacencyEntry[]>();

  for (const [, doc] of registry) {
    for (const edge of doc.graph_edges ?? []) {
      // Forward direction
      if (!adj.has(edge.source_app_id)) adj.set(edge.source_app_id, []);
      adj.get(edge.source_app_id)!.push({ targetId: edge.target_app_id, edge });

      // Reverse direction for Bidirectional edges
      if (edge.direction === 'Bidirectional') {
        if (!adj.has(edge.target_app_id)) adj.set(edge.target_app_id, []);
        adj.get(edge.target_app_id)!.push({ targetId: edge.source_app_id, edge });
      }
    }
  }

  return adj;
}

// ─────────────────────────────────────────────────────────────────────────────
// Blast Radius
// ─────────────────────────────────────────────────────────────────────────────

export interface BlastRadiusResult {
  origin_node: string;
  /** All nodes reachable from the origin via any edge type */
  impacted_nodes: string[];
  /** Nodes reachable only via high/critical edges — immediate blast */
  critical_impact_nodes: string[];
  impacted_node_count: number;
  /**
   * Sum of hourly_downtime_cost × estimated_recovery_hours across all impacted nodes.
   * Uses RTO as proxy for recovery hours.
   */
  revenue_at_risk: number;
  /** Lateral movement paths available to an attacker from the origin */
  lateral_movement_paths: LateralPath[];
}

/**
 * BFS from originId across all edges — models a compromised node's reach.
 * Stops at maxDepth to bound computation on large graphs.
 */
export function calculateBlastRadius(
  originId: string,
  registry: AppRegistry,
  maxDepth = 5
): BlastRadiusResult {
  const adj = buildAdjacency(registry);
  const visited = new Set<string>();
  const criticalVisited = new Set<string>();
  const queue: { id: string; depth: number }[] = [{ id: originId, depth: 0 }];
  visited.add(originId);

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    if (depth >= maxDepth) continue;

    for (const { targetId, edge } of adj.get(id) ?? []) {
      if (!visited.has(targetId)) {
        visited.add(targetId);
        queue.push({ id: targetId, depth: depth + 1 });
      }
      if (
        (edge.criticality === 'Critical' || edge.criticality === 'High') &&
        !criticalVisited.has(targetId)
      ) {
        criticalVisited.add(targetId);
      }
    }
  }

  visited.delete(originId); // exclude origin from impacted count
  const impactedNodes = Array.from(visited);

  let revenueAtRisk = 0;
  for (const nodeId of impactedNodes) {
    const doc = registry.get(nodeId);
    if (!doc) continue;
    const hourlyCost = doc.business_impact_analysis.hourly_downtime_cost;
    const rto = doc.business_impact_analysis.recovery_objectives.rto_hours;
    revenueAtRisk += hourlyCost * rto;
  }

  const lateralPaths = findLateralMovementPaths(originId, registry, adj);

  return {
    origin_node: originId,
    impacted_nodes: impactedNodes,
    critical_impact_nodes: Array.from(criticalVisited),
    impacted_node_count: impactedNodes.length,
    revenue_at_risk: revenueAtRisk,
    lateral_movement_paths: lateralPaths,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Lateral Movement Path Enumeration
// ─────────────────────────────────────────────────────────────────────────────

export interface LateralPath {
  path: string[];        // ordered list of node IDs
  edge_types: EdgeType[];
  tactics_used: string[];
  path_risk_score: number; // 0.0–1.0
}

const LATERAL_MOVEMENT_TACTICS = new Set([
  'TA0008', // Lateral Movement
  'TA0001', // Initial Access
  'TA0004', // Privilege Escalation
]);

function findLateralMovementPaths(
  originId: string,
  registry: AppRegistry,
  adj: Map<string, AdjacencyEntry[]>,
  maxPaths = 10
): LateralPath[] {
  const paths: LateralPath[] = [];

  // DFS with path tracking — find paths using lateral-movement-annotated edges
  function dfs(
    currentId: string,
    path: string[],
    edgeTypes: EdgeType[],
    tactics: Set<string>,
    visited: Set<string>
  ) {
    if (paths.length >= maxPaths) return;

    for (const { targetId, edge } of adj.get(currentId) ?? []) {
      if (visited.has(targetId)) continue;

      const edgeTactics = (edge.threat_tactics ?? [])
        .filter(t => LATERAL_MOVEMENT_TACTICS.has(t.tactic_id))
        .map(t => t.tactic_id);

      if (edgeTactics.length === 0) continue; // skip non-lateral edges

      const newPath = [...path, targetId];
      const newEdgeTypes = [...edgeTypes, edge.type];
      const newTactics = new Set([...tactics, ...edgeTactics]);
      const newVisited = new Set([...visited, targetId]);

      const riskScore = computePathRisk(newPath, registry, newEdgeTypes);

      paths.push({
        path: newPath,
        edge_types: newEdgeTypes,
        tactics_used: Array.from(newTactics),
        path_risk_score: riskScore,
      });

      // Continue deeper only for high-value targets
      const targetDoc = registry.get(targetId);
      if (
        targetDoc?.identity_context.criticality_class === 'Tier-1-Gold' ||
        newPath.length < 4
      ) {
        dfs(targetId, newPath, newEdgeTypes, newTactics, newVisited);
      }
    }
  }

  dfs(originId, [originId], [], new Set(), new Set([originId]));
  return paths.sort((a, b) => b.path_risk_score - a.path_risk_score);
}

function computePathRisk(
  path: string[],
  registry: AppRegistry,
  edgeTypes: EdgeType[]
): number {
  let risk = 0;
  for (const nodeId of path) {
    const doc = registry.get(nodeId);
    if (!doc) continue;
    const tierWeight =
      doc.identity_context.criticality_class === 'Tier-1-Gold' ? 1.0 :
      doc.identity_context.criticality_class === 'Tier-2-Silver' ? 0.6 : 0.3;
    const avgConfidence =
      doc.security_controls.reduce(
        (s, c) => s + (c.status.effective_confidence ?? c.verification.confidence_score),
        0
      ) / (doc.security_controls.length || 1);
    // Low confidence = higher risk
    risk += tierWeight * (1 - avgConfidence);
  }
  return parseFloat(Math.min(1, risk / path.length).toFixed(3));
}

// ─────────────────────────────────────────────────────────────────────────────
// Graph Centrality (Degree + Weighted)
// ─────────────────────────────────────────────────────────────────────────────

export interface CentralityReport {
  node_id: string;
  in_degree: number;
  out_degree: number;
  weighted_centrality: number;
  /** True if this node is a critical junction (removal splits the graph) */
  is_articulation_point: boolean;
}

/**
 * Computes weighted centrality for all nodes.
 * High criticality_class edges contribute more weight.
 */
export function computeCentrality(registry: AppRegistry): CentralityReport[] {
  const inDegree = new Map<string, number>();
  const outDegree = new Map<string, number>();
  const weightedScore = new Map<string, number>();

  for (const [appId] of registry) {
    inDegree.set(appId, 0);
    outDegree.set(appId, 0);
    weightedScore.set(appId, 0);
  }

  for (const [, doc] of registry) {
    for (const edge of doc.graph_edges ?? []) {
      const edgeWeight =
        edge.criticality === 'Critical' ? 4 :
        edge.criticality === 'High' ? 3 :
        edge.criticality === 'Medium' ? 2 : 1;

      outDegree.set(edge.source_app_id, (outDegree.get(edge.source_app_id) ?? 0) + 1);
      inDegree.set(edge.target_app_id, (inDegree.get(edge.target_app_id) ?? 0) + 1);

      weightedScore.set(
        edge.source_app_id,
        (weightedScore.get(edge.source_app_id) ?? 0) + edgeWeight
      );
      weightedScore.set(
        edge.target_app_id,
        (weightedScore.get(edge.target_app_id) ?? 0) + edgeWeight
      );
    }
  }

  const maxWeight = Math.max(...weightedScore.values(), 1);

  return Array.from(registry.keys()).map(nodeId => ({
    node_id: nodeId,
    in_degree: inDegree.get(nodeId) ?? 0,
    out_degree: outDegree.get(nodeId) ?? 0,
    weighted_centrality: parseFloat(
      ((weightedScore.get(nodeId) ?? 0) / maxWeight).toFixed(3)
    ),
    is_articulation_point: false, // full implementation requires Tarjan's algorithm
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// RAG Context Builder
// ─────────────────────────────────────────────────────────────────────────────

export interface RAGContext {
  primary_node: string;
  /** All text chunks from the primary node and its N-hop neighborhood */
  chunks: {
    node_id: string;
    chunk_id: string;
    topic: string;
    content: string;
    /** Pre-computed semantic tags for embedding retrieval */
    tags: string[];
  }[];
  /** Structured graph summary for system prompt injection */
  graph_summary: string;
  /** Total revenue at risk in the neighborhood — key figure for AI analysis */
  neighborhood_revenue_at_risk: number;
}

/**
 * Assembles graph-RAG context for a given node.
 *
 * Strategy:
 *  1. Include all RAG chunks from the primary node.
 *  2. Include chunks from 1-hop neighbors (direct connections).
 *  3. Build a graph_summary string injected as system prompt context.
 *
 * The AI model receives this context to generate risk analysis that is
 * grounded in the actual topology of the enterprise application graph.
 */
export function buildRAGContext(
  nodeId: string,
  registry: AppRegistry
): RAGContext {
  const adj = buildAdjacency(registry);
  const primaryDoc = registry.get(nodeId);
  if (!primaryDoc) {
    return {
      primary_node: nodeId,
      chunks: [],
      graph_summary: `Node ${nodeId} not found in registry.`,
      neighborhood_revenue_at_risk: 0,
    };
  }

  const neighborIds = new Set<string>(
    (adj.get(nodeId) ?? []).map(e => e.targetId)
  );

  const allChunks: RAGContext['chunks'] = [];
  let totalRevenue = 0;

  for (const docId of [nodeId, ...neighborIds]) {
    const doc = registry.get(docId);
    if (!doc) continue;

    totalRevenue += doc.business_impact_analysis.hourly_downtime_cost *
      doc.business_impact_analysis.recovery_objectives.rto_hours;

    const tags = doc.reasoning_for_ai.semantic_tags ?? [];

    for (const chunk of doc.reasoning_for_ai.rag_chunks ?? []) {
      allChunks.push({
        node_id: docId,
        chunk_id: chunk.chunk_id,
        topic: chunk.topic,
        content: chunk.content,
        tags,
      });
    }
  }

  const neighborList = Array.from(neighborIds)
    .map(id => {
      const d = registry.get(id);
      return d
        ? `  - ${d.identity_context.name} (${id}) [${d.identity_context.criticality_class}]`
        : `  - ${id}`;
    })
    .join('\n');

  const blast = calculateBlastRadius(nodeId, registry);

  const graphSummary = `
GRAPH CONTEXT FOR RISK ANALYSIS
================================
Primary Asset : ${primaryDoc.identity_context.name} [${nodeId}]
Criticality   : ${primaryDoc.identity_context.criticality_class}
Process Chain : ${primaryDoc.business_impact_analysis.process_chain}
Hourly Cost   : €${primaryDoc.business_impact_analysis.hourly_downtime_cost.toLocaleString()}
RTO           : ${primaryDoc.business_impact_analysis.recovery_objectives.rto_hours}h

Direct Neighbors (${neighborIds.size}):
${neighborList}

Blast Radius  : ${blast.impacted_node_count} nodes impacted
Revenue Risk  : €${blast.revenue_at_risk.toLocaleString()} (sum across blast radius)

Lateral Paths : ${blast.lateral_movement_paths.length} attacker paths identified
Highest Risk Path Score: ${blast.lateral_movement_paths[0]?.path_risk_score ?? 'N/A'}
`.trim();

  return {
    primary_node: nodeId,
    chunks: allChunks,
    graph_summary: graphSummary,
    neighborhood_revenue_at_risk: totalRevenue,
  };
}

/**
 * Updates the GraphNode metadata on a document using live graph computations.
 * Called after any topology change (new edge added, node removed).
 */
export function refreshGraphNode(
  doc: BASMDocument,
  registry: AppRegistry
): BASMDocument {
  const centrality = computeCentrality(registry);
  const nodeCentrality = centrality.find(c => c.node_id === doc.identity_context.app_id);
  const blast = calculateBlastRadius(doc.identity_context.app_id, registry);
  const adj = buildAdjacency(registry);

  const neighborIds = Array.from(
    new Set([
      ...(adj.get(doc.identity_context.app_id) ?? []).map(e => e.targetId),
    ])
  );

  return {
    ...doc,
    graph_node: {
      ...doc.graph_node,
      graph_centrality: nodeCentrality?.weighted_centrality ?? 0,
      blast_radius_node_count: blast.impacted_node_count,
      blast_radius_revenue_at_risk: blast.revenue_at_risk,
      neighborhood_ids: neighborIds,
    },
  };
}
