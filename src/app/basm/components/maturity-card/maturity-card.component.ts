import { Component, Input } from '@angular/core';
import { MaturityScores } from '../../types/basm.types';

@Component({
  selector: 'basm-maturity-card',
  templateUrl: 'maturity-card.component.html',
})
export class MaturityCardComponent {
  @Input() scores: MaturityScores | null = null;

  get compositePercent(): number {
    return Math.round((this.scores?.composite_score ?? 0) * 100);
  }

  get phaseColor(): string {
    const phase = this.scores?.maturity_phase ?? 'Initial';
    const map: Record<string, string> = {
      Optimizing: 'success',
      Managed:    'primary',
      Defined:    'tertiary',
      Developing: 'warning',
      Initial:    'danger',
    };
    return map[phase] ?? 'medium';
  }

  get conicGradient(): string {
    return `conic-gradient(var(--ion-color-primary) ${this.compositePercent}%, #e0e0e0 0)`;
  }

  get hasBenchmark(): boolean {
    return this.scores?.industry_benchmark_median != null;
  }
}
