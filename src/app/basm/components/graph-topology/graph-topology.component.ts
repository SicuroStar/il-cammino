import { Component, Input, OnChanges } from '@angular/core';
import { TypedEdge, GraphNode } from '../../types/basm.types';

interface NodeView {
  id: string;
  isCurrent: boolean;
}

interface EdgeView {
  edge: TypedEdge;
  critColor: string;
}

@Component({
  selector: 'basm-graph-topology',
  templateUrl: 'graph-topology.component.html',
})
export class GraphTopologyComponent implements OnChanges {
  @Input() appId: string = '';
  @Input() edges: TypedEdge[] = [];
  @Input() graphNode: GraphNode | null = null;

  nodes: NodeView[] = [];
  edgeViews: EdgeView[] = [];

  ngOnChanges(): void {
    this.buildViews();
  }

  private buildViews(): void {
    const nodeIds = new Set<string>();
    nodeIds.add(this.appId);
    (this.edges ?? []).forEach(e => {
      nodeIds.add(e.source_app_id);
      nodeIds.add(e.target_app_id);
    });

    this.nodes = Array.from(nodeIds).map(id => ({
      id,
      isCurrent: id === this.appId,
    }));

    this.edgeViews = (this.edges ?? []).map(e => ({
      edge: e,
      critColor: this.critColor(e.criticality),
    }));
  }

  private critColor(criticality: string): string {
    const map: Record<string, string> = {
      Critical: 'danger',
      High:     'warning',
      Medium:   'primary',
      Low:      'medium',
    };
    return map[criticality] ?? 'medium';
  }

  directionIcon(direction: string): string {
    switch (direction) {
      case 'Inbound':       return 'arrow-down-outline';
      case 'Outbound':      return 'arrow-up-outline';
      case 'Bidirectional': return 'swap-vertical-outline';
      default:              return 'help-outline';
    }
  }
}
