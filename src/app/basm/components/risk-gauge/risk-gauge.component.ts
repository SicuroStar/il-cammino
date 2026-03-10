import { Component, Input } from '@angular/core';
import { RiskQuantification } from '../../types/basm.types';

/** Risk thresholds (EUR/year) for color coding */
const THRESHOLD_HIGH   = 1_000_000;
const THRESHOLD_MEDIUM =   200_000;

@Component({
  selector: 'basm-risk-gauge',
  templateUrl: 'risk-gauge.component.html',
})
export class RiskGaugeComponent {
  @Input() rq: RiskQuantification | null = null;
  @Input() appName = '';

  get annualRisk(): number {
    return this.rq?.risk_score_annualized_eur ?? 0;
  }

  get riskColor(): string {
    if (this.annualRisk >= THRESHOLD_HIGH)   return 'danger';
    if (this.annualRisk >= THRESHOLD_MEDIUM) return 'warning';
    return 'success';
  }

  get riskLabel(): string {
    if (this.annualRisk >= THRESHOLD_HIGH)   return 'Alto';
    if (this.annualRisk >= THRESHOLD_MEDIUM) return 'Medio';
    return 'Basso';
  }

  /** Normalises annualRisk to a 0-1 progress bar value (cap at 2M EUR = 100%) */
  get gaugeValue(): number {
    return Math.min(this.annualRisk / 2_000_000, 1);
  }
}
