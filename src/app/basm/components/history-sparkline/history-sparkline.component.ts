/**
 * HistorySparklineComponent — Sprint 6
 *
 * Mini SVG line-chart of composite_score across snapshot_history.
 * Zero external dependencies — pure SVG drawn in the template.
 *
 * Usage:
 *   <basm-history-sparkline [snapshots]="doc.snapshot_history"></basm-history-sparkline>
 *
 * Optional:
 *   [width]  — SVG width (default 240)
 *   [height] — SVG height (default 64)
 *   [showLabels] — show date labels on X axis (default false, space-saving)
 */

import { Component, Input, OnChanges } from '@angular/core';
import { SnapshotEvent } from '../../types/basm.types';

interface PlotPoint {
  x: number;
  y: number;
  snap: SnapshotEvent;
  label: string;
}

const PAD = 8; // px padding inside SVG

@Component({
  selector: 'basm-history-sparkline',
  templateUrl: 'history-sparkline.component.html',
})
export class HistorySparklineComponent implements OnChanges {

  @Input() snapshots: SnapshotEvent[] = [];
  @Input() width  = 240;
  @Input() height = 64;
  @Input() showLabels = false;

  points: PlotPoint[] = [];
  polyline = '';
  area = '';
  trend: 'improving' | 'stable' | 'degrading' | 'flat' = 'flat';
  trendColor = '#92949c';

  // exposed to template
  readonly pad = PAD;

  get plotW(): number { return this.width  - PAD * 2; }
  get plotH(): number { return this.height - PAD * 2 - (this.showLabels ? 14 : 0); }

  ngOnChanges(): void {
    this.buildChart();
  }

  private buildChart(): void {
    const snaps = (this.snapshots ?? [])
      .filter(s => s.maturity_scores?.composite_score != null)
      .slice() // don't mutate original
      .sort((a, b) => a.sequence - b.sequence);

    if (snaps.length === 0) {
      this.points = [];
      this.polyline = '';
      this.area = '';
      this.trend = 'flat';
      this.trendColor = '#92949c';
      return;
    }

    const scores = snaps.map(s => s.maturity_scores.composite_score);
    const minScore = Math.max(0, Math.min(...scores) - 0.05);
    const maxScore = Math.min(1, Math.max(...scores) + 0.05);
    const scoreRange = maxScore - minScore || 0.01;

    this.points = snaps.map((s, i) => {
      const xFrac = snaps.length > 1 ? i / (snaps.length - 1) : 0.5;
      const yFrac = (s.maturity_scores.composite_score - minScore) / scoreRange;
      const x = PAD + xFrac * this.plotW;
      const y = PAD + this.plotH - yFrac * this.plotH; // invert: higher score = higher on SVG

      const d = new Date(s.timestamp);
      const label = `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}`;

      return { x, y, snap: s, label };
    });

    // polyline string
    this.polyline = this.points.map(p => `${p.x},${p.y}`).join(' ');

    // closed area polygon (fill under line)
    const lastPt  = this.points[this.points.length - 1];
    const firstPt = this.points[0];
    const bottom  = PAD + this.plotH;
    this.area = `${firstPt.x},${bottom} ` + this.polyline + ` ${lastPt.x},${bottom}`;

    // trend from first to last
    if (scores.length >= 2) {
      const delta = scores[scores.length - 1] - scores[0];
      if (delta >  0.05) { this.trend = 'improving'; this.trendColor = '#2dd36f'; }
      else if (delta < -0.05) { this.trend = 'degrading'; this.trendColor = '#eb445a'; }
      else               { this.trend = 'stable';    this.trendColor = '#ffc409'; }
    } else {
      this.trend = 'flat';
      this.trendColor = '#92949c';
    }
  }

  trendIcon(): string {
    switch (this.trend) {
      case 'improving': return '↑';
      case 'degrading': return '↓';
      case 'stable':    return '→';
      default:          return '•';
    }
  }

  trendLabel(): string {
    switch (this.trend) {
      case 'improving': return 'In miglioramento';
      case 'degrading': return 'In peggioramento';
      case 'stable':    return 'Stabile';
      default:          return 'Dati insufficienti';
    }
  }

  lastScore(): number {
    if (!this.snapshots?.length) return 0;
    const sorted = [...this.snapshots].sort((a, b) => b.sequence - a.sequence);
    return (sorted[0]?.maturity_scores?.composite_score ?? 0) * 100;
  }
}
