import { Component, Input } from '@angular/core';
import { SecurityControl } from '../../types/basm.types';

@Component({
  selector: 'basm-control-status-row',
  templateUrl: 'control-status-row.component.html',
})
export class ControlStatusRowComponent {
  @Input() control: SecurityControl;

  get indicatorColor(): string {
    const map: Record<string, string> = {
      green: 'success',
      yellow: 'warning',
      red: 'danger',
      gray: 'medium',
    };
    return map[this.control?.status?.indicator] ?? 'medium';
  }

  get confidencePercent(): number {
    return Math.round((this.control?.verification?.confidence_score ?? 0) * 100);
  }

  get stalenessStatus(): string {
    return this.control?.verification?.staleness?.staleness_status ?? 'unknown';
  }

  get hasException(): boolean {
    return !!(this.control?.exception as any)?.active || !!(this.control?.exception as any)?.is_active;
  }
}
