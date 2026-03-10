import { Component, Input, OnChanges } from '@angular/core';
import { TypedEdge, GraphNode } from '../../types/basm.types';

interface SvgNode {
  id: string;
  x: number;
  y: number;
  isCurrent: boolean;
  color: string;
}

interface SvgEdge {
  edge: TypedEdge;
  x1: number; y1: number;
  x2: number; y2: number;
  color: string;
  midX: number; midY: number;
}

const SVG_W = 600;
const SVG_H = 360;
const NODE_R = 28;
const CENTER_R = 36;

const CRIT_COLORS: Record<string, string> = {
  Critical: '#eb445a',
  High:     '#ffc409',
  Medium:   '#3880ff',
  Low:      '#92949c',
};

@Component({
  selector: 'basm-graph-topology',
  templateUrl: 'graph-topology.component.html',
})
export class GraphTopologyComponent implements OnChanges {
  @Input() appId  = '';
  @Input() edges: TypedEdge[] = [];
  @Input() graphNode: GraphNode | null = null;

  svgNodes: SvgNode[] = [];
  svgEdges: SvgEdge[] = [];

  readonly svgW = SVG_W;
  readonly svgH = SVG_H;
  readonly nodeR = NODE_R;
  readonly centerR = CENTER_R;

  // for the text view below the SVG
  get edgeList(): TypedEdge[] { return this.edges ?? []; }

  ngOnChanges(): void {
    this.buildLayout();
  }

  private buildLayout(): void {
    // collect unique neighbour node IDs
    const neighbourIds = new Set<string>();
    (this.edges ?? []).forEach(e => {
      if (e.source_app_id !== this.appId) neighbourIds.add(e.source_app_id);
      if (e.target_app_id !== this.appId) neighbourIds.add(e.target_app_id);
    });

    const neighbours = Array.from(neighbourIds);
    const cx = SVG_W / 2;
    const cy = SVG_H / 2;
    const orbitR = Math.min(cx, cy) - CENTER_R - 20;

    // build nodes
    const nodeMap = new Map<string, SvgNode>();

    nodeMap.set(this.appId, {
      id: this.appId,
      x: cx, y: cy,
      isCurrent: true,
      color: '#3880ff',
    });

    neighbours.forEach((id, i) => {
      const angle = (2 * Math.PI * i) / neighbours.length - Math.PI / 2;
      nodeMap.set(id, {
        id,
        x: cx + orbitR * Math.cos(angle),
        y: cy + orbitR * Math.sin(angle),
        isCurrent: false,
        color: '#92949c',
      });
    });

    this.svgNodes = Array.from(nodeMap.values());

    // build edges
    this.svgEdges = (this.edges ?? []).map(e => {
      const src  = nodeMap.get(e.source_app_id);
      const tgt  = nodeMap.get(e.target_app_id);
      if (!src || !tgt) return null;

      // shorten line to stop at node border
      const dx = tgt.x - src.x;
      const dy = tgt.y - src.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const srcR = src.isCurrent ? CENTER_R : NODE_R;
      const tgtR = tgt.isCurrent ? CENTER_R : NODE_R;
      const ux = dx / dist;
      const uy = dy / dist;

      return {
        edge: e,
        x1: src.x + ux * srcR,
        y1: src.y + uy * srcR,
        x2: tgt.x - ux * tgtR,
        y2: tgt.y - uy * tgtR,
        color: CRIT_COLORS[e.criticality] ?? '#92949c',
        midX: (src.x + tgt.x) / 2,
        midY: (src.y + tgt.y) / 2,
      } as SvgEdge;
    }).filter(Boolean) as SvgEdge[];
  }

  critColor(c: string): string {
    return CRIT_COLORS[c] ?? '#92949c';
  }

  directionIcon(direction: string): string {
    switch (direction) {
      case 'Inbound':       return '↓';
      case 'Outbound':      return '↑';
      case 'Bidirectional': return '↕';
      default:              return '•';
    }
  }

  lockIcon(encrypted: boolean): string {
    return encrypted ? '🔒' : '🔓';
  }

  /** Shorten a long app ID to first 8 chars for SVG label readability */
  shortId(id: string): string {
    return id.length > 10 ? id.slice(0, 9) + '…' : id;
  }
}
