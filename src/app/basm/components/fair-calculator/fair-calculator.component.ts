/**
 * FairCalculatorComponent — Sprint 6
 *
 * Interactive FAIR (Factor Analysis of Information Risk) calculator.
 * The user adjusts the three FAIR inputs; the component computes and emits
 * the resulting RiskQuantification in real time.
 *
 * Formula:
 *   risk_score_annualized_eur = threat_event_frequency
 *                              × vulnerability_probability
 *                              × primary_loss_magnitude
 */

import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

import { RiskQuantification } from '../../types/basm.types';

@Component({
  selector: 'basm-fair-calculator',
  templateUrl: 'fair-calculator.component.html',
})
export class FairCalculatorComponent implements OnInit, OnDestroy {

  /** Pre-fill inputs from an existing RiskQuantification (optional) */
  @Input() initialRq: RiskQuantification | null = null;

  /** Emits every time the computed RiskQuantification changes (debounced 300ms) */
  @Output() rqChange = new EventEmitter<RiskQuantification>();

  form: FormGroup;
  annualRisk = 0;

  private destroy$ = new Subject<void>();

  readonly methodologies: RiskQuantification['methodology'][] = [
    'FAIR', 'CVSS-based', 'Expert-elicitation', 'Historical',
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    const rq = this.initialRq;
    this.form = this.fb.group({
      threat_event_frequency:   [rq?.threat_event_frequency   ?? 0.3,  [Validators.required, Validators.min(0)]],
      vulnerability_probability:[rq?.vulnerability_probability ?? 0.5,  [Validators.required, Validators.min(0), Validators.max(1)]],
      primary_loss_magnitude:   [rq?.primary_loss_magnitude   ?? 50000, [Validators.required, Validators.min(0)]],
      confidence_level:         [rq?.confidence_level         ?? 0.6,  [Validators.required, Validators.min(0), Validators.max(1)]],
      methodology:              [rq?.methodology              ?? 'FAIR'],
      last_reviewed_by:         [rq?.last_reviewed_by         ?? ''],
    });

    // Compute immediately
    this.compute();

    // Recompute on every change (debounced)
    this.form.valueChanges.pipe(
      debounceTime(300),
      takeUntil(this.destroy$),
    ).subscribe(() => this.compute());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private compute(): void {
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    const risk = v.threat_event_frequency
               * v.vulnerability_probability
               * v.primary_loss_magnitude;

    this.annualRisk = risk;

    const rq: RiskQuantification = {
      threat_event_frequency:    parseFloat(v.threat_event_frequency),
      vulnerability_probability: parseFloat(v.vulnerability_probability),
      primary_loss_magnitude:    parseFloat(v.primary_loss_magnitude),
      risk_score_annualized_eur: risk,
      confidence_level:          parseFloat(v.confidence_level),
      methodology:               v.methodology,
      last_reviewed_by:          v.last_reviewed_by,
      last_reviewed_date:        new Date().toISOString(),
    };

    this.rqChange.emit(rq);
  }

  /** Exposed to template — Angular templates cannot access global Math directly */
  gaugeValue(): number {
    return Math.min(this.annualRisk / 2_000_000, 1);
  }

  get riskColor(): string {
    if (this.annualRisk >= 1_000_000) return 'danger';
    if (this.annualRisk >= 200_000)   return 'warning';
    return 'success';
  }

  get riskLabel(): string {
    if (this.annualRisk >= 1_000_000) return 'Alto';
    if (this.annualRisk >= 200_000)   return 'Medio';
    return 'Basso';
  }

  /** Format frequency as human-readable string */
  freqLabel(f: number): string {
    if (!f) return '—';
    if (f >= 1) return `${f.toFixed(1)}x/anno`;
    return `1 ogni ${(1 / f).toFixed(1)} anni`;
  }
}
