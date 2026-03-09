import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

import { BASMDocument } from '../../types/basm.types';
import { BasmStoreService } from '../../services/basm-store.service';

// Minimal blank document scaffold used when creating a new BASM document
function createBlankDocument(appId: string): Partial<BASMDocument> {
  const now = new Date().toISOString();
  return {
    basm_metadata: {
      schema_version: '3.1-DIGITAL-TWIN',
      last_update: now,
      maturity_tier_logic: 'Level-1-Initial',
      author_role: '',
      document_hash: '',
    },
    identity_context: {
      app_id: appId || `APP-${Date.now()}`,
      name: '',
      business_owner: { name: '', department: '', contact: '' },
      technical_lead: '',
      criticality_class: 'Tier-3-Bronze',
      criticality_tier: 'Tier-3-Bronze',
      environment: 'production',
      external_facing: false,
      user_count_approx: 0,
      data_classification: 'Internal',
      asset_type: 'IT',
      asset_install_date: null,
      asset_eol_date: null,
      vendor_name: '',
      support_contract_expiry: null,
    } as any,
    ot_context: null,
    business_impact_analysis: {
      process_chain: '',
      hourly_downtime_cost: 0,
      annual_revenue_at_risk: 0,
      legal_obligations: [],
      insurance_coverage_eur: 0,
      recovery_objectives: {
        rto_hours: 4,
        rpo_hours: 1,
        bcp_drill_last_date: null,
        bcp_drill_result: 'not_tested',
      },
    } as any,
    security_controls: [],
    graph_edges: [],
    graph_node: null,
    reasoning_for_ai: { rag_chunks: [], primary_risk_narrative: '', compliance_narrative: '' } as any,
    maturity_scoring: null,
    snapshot_history: [],
    maturity_deltas: [],
    risk_quantification: null,
    threat_model: { threat_actors: [], attack_scenarios: [], primary_attack_vector: '' } as any,
    recommended_controls: [],
    incident_history: [],
  };
}

@Component({
  selector: 'app-basm-interview',
  templateUrl: 'interview.page.html',
  styleUrls: ['interview.page.scss'],
})
export class InterviewPage implements OnInit, OnDestroy {

  form: FormGroup;
  appId: string;
  isNew: boolean;
  isSaving = false;
  saveError: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private store: BasmStoreService,
  ) {}

  ngOnInit(): void {
    this.appId = this.route.snapshot.paramMap.get('appId') ?? '';
    this.isNew = this.appId === 'new' || !this.appId;

    const existing = !this.isNew ? this.store.getDocument(this.appId) : null;
    const draft = this.store.loadDraft(this.isNew ? 'new' : this.appId);
    const base = existing ?? (draft as BASMDocument) ?? createBlankDocument(this.appId) as BASMDocument;

    this.buildForm(base);

    // Autosave draft on form changes (debounced 500ms)
    this.form.valueChanges.pipe(
      debounceTime(500),
      takeUntil(this.destroy$),
    ).subscribe(() => {
      const key = this.isNew ? 'new' : this.appId;
      this.store.saveDraft(key, this.form.getRawValue());
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Form construction ─────────────────────────────────────────────────────

  private buildForm(doc: BASMDocument): void {
    const ic = doc.identity_context as any;
    const bia = doc.business_impact_analysis as any;

    this.form = this.fb.group({
      // Blocco A — Identity
      blockA: this.fb.group({
        app_id:            [ic?.app_id || '', Validators.required],
        name:              [ic?.name || '', Validators.required],
        business_owner_name:  [(ic?.business_owner as any)?.name || ''],
        business_owner_dept:  [(ic?.business_owner as any)?.department || ''],
        business_owner_contact: [(ic?.business_owner as any)?.contact || ''],
        technical_lead:    [ic?.technical_lead || ''],
        criticality_class: [ic?.criticality_class || 'Tier-3-Bronze'],
        environment:       [ic?.environment || 'production'],
        asset_type:        [ic?.asset_type || 'IT'],
        data_classification: [ic?.data_classification || 'Internal'],
        external_facing:   [ic?.external_facing ?? false],
        user_count_approx: [ic?.user_count_approx || 0],
        vendor_name:       [ic?.vendor_name || ''],
      }),

      // Blocco B — Business Impact
      blockB: this.fb.group({
        process_chain:           [bia?.process_chain || ''],
        hourly_downtime_cost:    [bia?.hourly_downtime_cost || 0, [Validators.min(0)]],
        annual_revenue_at_risk:  [bia?.annual_revenue_at_risk || 0, [Validators.min(0)]],
        insurance_coverage_eur:  [bia?.insurance_coverage_eur || 0],
        rto_hours:               [bia?.recovery_objectives?.rto_hours || 4, [Validators.min(0)]],
        rpo_hours:               [bia?.recovery_objectives?.rpo_hours || 1, [Validators.min(0)]],
        bcp_drill_result:        [bia?.recovery_objectives?.bcp_drill_result || 'not_tested'],
      }),

      // Blocco D — Security Controls
      blockD: this.fb.group({
        controls: this.fb.array(
          (doc.security_controls ?? []).map(c => this.buildControlGroup(c))
        ),
      }),
    });
  }

  private buildControlGroup(ctrl?: any): FormGroup {
    return this.fb.group({
      control_id:         [ctrl?.control_id || `CTR-${Date.now()}`],
      name:               [ctrl?.name || '', Validators.required],
      indicator:          [ctrl?.status?.indicator || 'gray'],
      method:             [ctrl?.verification?.method || 'Manual'],
      confidence_score:   [ctrl?.verification?.confidence_score ?? 0.5, [Validators.min(0), Validators.max(1)]],
      last_verified:      [ctrl?.verification?.last_verified || ''],
      ttl_days:           [ctrl?.verification?.ttl_days || 90],
      iso27001:           [ctrl?.mapping?.iso27001 || ''],
      nis2:               [ctrl?.mapping?.nis2 || ''],
      business_workaround: [ctrl?.failure_management?.business_workaround || ''],
      exception_active:   [ctrl?.exception?.active ?? false],
    });
  }

  // ─── Controls FormArray helpers ────────────────────────────────────────────

  get controlsArray(): FormArray {
    return this.form.get('blockD.controls') as FormArray;
  }

  addControl(): void {
    this.controlsArray.push(this.buildControlGroup());
  }

  removeControl(index: number): void {
    this.controlsArray.removeAt(index);
  }

  // ─── Blocco completion % ───────────────────────────────────────────────────

  completionPercent(blockKey: string): number {
    const group = this.form.get(blockKey) as FormGroup;
    if (!group) return 0;
    const controls = Object.values(group.controls);
    const filled = controls.filter(c => {
      const v = c.value;
      return v !== null && v !== '' && v !== 0 && v !== false;
    }).length;
    return Math.round((filled / controls.length) * 100);
  }

  // ─── Save ──────────────────────────────────────────────────────────────────

  async save(): Promise<void> {
    this.isSaving = true;
    this.saveError = null;

    try {
      const val = this.form.getRawValue();
      const a = val.blockA;
      const b = val.blockB;
      const d = val.blockD;

      const existing = !this.isNew
        ? this.store.getDocument(this.appId)
        : null;
      const base = existing ?? createBlankDocument(a.app_id) as BASMDocument;

      const updated: BASMDocument = {
        ...(base as BASMDocument),
        identity_context: {
          ...(base.identity_context as any),
          app_id: a.app_id,
          name: a.name,
          business_owner: {
            name: a.business_owner_name,
            department: a.business_owner_dept,
            contact: a.business_owner_contact,
          },
          technical_lead: a.technical_lead,
          criticality_class: a.criticality_class,
          criticality_tier: a.criticality_class,
          environment: a.environment,
          asset_type: a.asset_type,
          data_classification: a.data_classification,
          external_facing: a.external_facing,
          user_count_approx: a.user_count_approx,
          vendor_name: a.vendor_name,
        },
        business_impact_analysis: {
          ...(base.business_impact_analysis as any),
          process_chain: b.process_chain,
          hourly_downtime_cost: b.hourly_downtime_cost,
          annual_revenue_at_risk: b.annual_revenue_at_risk,
          insurance_coverage_eur: b.insurance_coverage_eur,
          recovery_objectives: {
            rto_hours: b.rto_hours,
            rpo_hours: b.rpo_hours,
            bcp_drill_last_date: (base.business_impact_analysis as any)?.recovery_objectives?.bcp_drill_last_date ?? null,
            bcp_drill_result: b.bcp_drill_result,
          },
        },
        security_controls: d.controls.map((c: any, i: number) => ({
          ...(base.security_controls?.[i] ?? {}),
          control_id: c.control_id,
          name: c.name,
          status: { indicator: c.indicator, message: '' },
          verification: {
            ...(base.security_controls?.[i]?.verification ?? {}),
            method: c.method,
            confidence_score: parseFloat(c.confidence_score),
            last_verified: c.last_verified,
            ttl_days: c.ttl_days,
            staleness: (base.security_controls?.[i]?.verification as any)?.staleness ?? {
              staleness_status: 'unknown',
              cascade_decay_rate_per_day: 0.01,
              downstream_dependents: [],
              alert_threshold: 0.5,
            },
          },
          mapping: {
            ...(base.security_controls?.[i]?.mapping ?? {}),
            iso27001: c.iso27001,
            nis2: c.nis2,
            mitre_attack: base.security_controls?.[i]?.mapping?.mitre_attack ?? [],
          },
          failure_management: {
            ...(base.security_controls?.[i]?.failure_management ?? {}),
            business_workaround: c.business_workaround,
          },
          exception: {
            active: c.exception_active,
            reason: (base.security_controls?.[i] as any)?.exception?.reason ?? '',
            approved_by: (base.security_controls?.[i] as any)?.exception?.approved_by ?? '',
            expiry: (base.security_controls?.[i] as any)?.exception?.expiry ?? null,
          },
          evidence_artifacts: base.security_controls?.[i]?.evidence_artifacts ?? [],
          latest_ccm_result: base.security_controls?.[i]?.latest_ccm_result ?? null,
        })),
      };

      await this.store.upsertDocument(updated, this.isNew ? 'Primo salvataggio da UI' : 'Aggiornamento da wizard intervista');
      this.store.clearDraft(this.isNew ? 'new' : this.appId);

      await this.router.navigate(['/basm', updated.identity_context.app_id]);
    } catch (e) {
      console.error('[InterviewPage] Save failed', e);
      this.saveError = 'Errore nel salvataggio. Controlla la console.';
    } finally {
      this.isSaving = false;
    }
  }

  cancel(): void {
    this.router.navigate(['/basm']);
  }

  indicatorBadgeColor(indicator: string): string {
    const map: Record<string, string> = {
      green: 'success',
      yellow: 'warning',
      red: 'danger',
      gray: 'medium',
    };
    return map[indicator] ?? 'medium';
  }
}
